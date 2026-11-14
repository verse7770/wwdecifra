import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Msg = { role: "user" | "assistant"; content: string };

export const tutorChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[]; mode?: string }) => {
    if (!Array.isArray(d.messages) || d.messages.length === 0) throw new Error("Mensagem vazia");
    return { messages: d.messages.slice(-20).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 6000) }) as Msg), mode: d.mode };
  })
  .handler(async ({ data, context }) => {
    const { askAI, SYSTEM_TEACHER } = await import("./ai.server");
    const { data: profile } = await context.supabase.from("profiles").select("full_name,level,exam_name,difficult_subjects").eq("id", context.userId).maybeSingle();
    const extra = `\nEstudante: ${profile?.full_name ?? ""}; nível: ${profile?.level ?? "?"}; prova: ${profile?.exam_name ?? "ENEM"}; dificuldades: ${(profile?.difficult_subjects ?? []).join(", ") || "não informadas"}.` +
      (data.mode ? `\nModo solicitado: ${data.mode}.` : "");
    const reply = await askAI(SYSTEM_TEACHER + extra, data.messages);
    const last = data.messages[data.messages.length - 1];
    await context.supabase.from("tutor_messages").insert([
      { user_id: context.userId, role: "user", content: last?.content ?? "" },
      { user_id: context.userId, role: "assistant", content: reply },
    ]);
    return { reply };
  });

export const learnFromZero = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topic: string; level: string }) => ({ topic: String(d.topic).slice(0, 200), level: String(d.level).slice(0, 40) }))
  .handler(async ({ data }) => {
    const { askAI, SYSTEM_TEACHER, parseJSON } = await import("./ai.server");
    const text = await askAI(SYSTEM_TEACHER,
      `Crie uma aula estruturada "Aprender do Zero" sobre "${data.topic}" para nível ${data.level}. Responda em JSON com o formato:
{"titulo":string,"explicacao":string (markdown, didática, com analogias),"exemplos":[string markdown],"exercicios":[{"enunciado":string,"alternativas":{"A":string,"B":string,"C":string,"D":string,"E":string},"correta":"A"|"B"|"C"|"D"|"E","resolucao":string}] (3 exercícios),"avaliacao":[mesmo formato] (2 questões finais),"resumo":string}`, true);
    return parseJSON<{ titulo: string; explicacao: string; exemplos: string[]; exercicios: Ex[]; avaliacao: Ex[]; resumo: string }>(text);
  });
type Ex = { enunciado: string; alternativas: Record<string, string>; correta: string; resolucao: string };

export const correctEssay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { theme: string; content: string }) => {
    const content = String(d.content).trim();
    if (content.length < 300) throw new Error("A redação precisa ter pelo menos 300 caracteres.");
    return { theme: String(d.theme).slice(0, 300), content: content.slice(0, 8000) };
  })
  .handler(async ({ data, context }) => {
    const { askAI, parseJSON } = await import("./ai.server");
    const text = await askAI(
      "Você é um corretor experiente de redações do ENEM, seguindo a matriz das 5 competências do INEP. Seja criterioso e justo. Notas de cada competência em múltiplos de 40 (0,40,80,120,160,200).",
      `Tema: ${data.theme}\n\nRedação:\n${data.content}\n\nAvalie e responda em JSON: {"competencias":[{"numero":1,"nome":string,"nota":number,"comentario":string,"melhorias":[string]}] (5 itens),"comentario_geral":string,"pontos_fortes":[string]}`, true);
    const r = parseJSON<{ competencias: { numero: number; nome: string; nota: number; comentario: string; melhorias: string[] }[]; comentario_geral: string; pontos_fortes: string[] }>(text);
    r.competencias = r.competencias.slice(0, 5).map((c) => ({ ...c, nota: Math.max(0, Math.min(200, Math.round(Number(c.nota) / 40) * 40)) }));
    const total = r.competencias.reduce((s, c) => s + c.nota, 0);
    const { data: row, error } = await context.supabase.from("essays").insert({ user_id: context.userId, theme: data.theme, content: data.content, scores: r as never, total, feedback: r.comentario_geral }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id, total, ...r };
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { exam: string; examDate: string; hoursPerDay: number; difficulties: string[]; level: string; goal: string }) => ({
    exam: String(d.exam).slice(0, 80), examDate: String(d.examDate).slice(0, 10), hoursPerDay: Math.max(0.5, Math.min(14, Number(d.hoursPerDay) || 2)),
    difficulties: (d.difficulties ?? []).slice(0, 20).map(String), level: String(d.level).slice(0, 40), goal: String(d.goal).slice(0, 300),
  }))
  .handler(async ({ data, context }) => {
    const { askAI, parseJSON } = await import("./ai.server");
    // Real performance by subject feeds the plan
    const { data: ans } = await context.supabase.from("answers").select("is_correct, questions(subjects(name), topics(name))").eq("user_id", context.userId).limit(1000);
    const stats: Record<string, { c: number; t: number }> = {};
    for (const a of (ans ?? []) as unknown as { is_correct: boolean; questions: { topics: { name: string } | null; subjects: { name: string } | null } | null }[]) {
      const k = a.questions?.topics?.name ?? a.questions?.subjects?.name; if (!k) continue;
      stats[k] ??= { c: 0, t: 0 }; stats[k].t++; if (a.is_correct) stats[k].c++;
    }
    const weak = Object.entries(stats).filter(([, s]) => s.t >= 2).map(([k, s]) => `${k}: ${Math.round((s.c / s.t) * 100)}% em ${s.t} questões`).join("; ") || "sem histórico suficiente";
    const text = await askAI(
      "Você é um planejador de estudos para provas brasileiras. Use revisão espaçada (1, 7 e 30 dias), intercale teoria, exercícios e simulados. Priorize as dificuldades e os assuntos com desempenho baixo. Não invente estatísticas de provas.",
      `Prova: ${data.exam}. Data: ${data.examDate}. Horas/dia: ${data.hoursPerDay}. Nível: ${data.level}. Meta: ${data.goal}. Dificuldades declaradas: ${data.difficulties.join(", ") || "nenhuma"}. Desempenho real na plataforma: ${weak}.
Gere um cronograma para os próximos 7 dias em JSON: {"resumo":string,"dias":[{"dia":"Segunda"...,"blocos":[{"materia":string,"assunto":string,"minutos":number,"tipo":"teoria"|"exercicios"|"revisao"|"simulado"|"redacao","prioridade":"muito alta"|"alta"|"média"|"baixa","motivo":string}]}],"revisao_espacada":[string],"dicas":[string]}`, true);
    const plan = parseJSON<Record<string, unknown>>(text);
    const { data: row, error } = await context.supabase.from("study_plans").insert({ user_id: context.userId, inputs: data as never, plan: plan as never }).select("*").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("profiles").update({ exam_name: data.exam, exam_date: data.examDate || null, daily_goal_minutes: Math.round(data.hoursPerDay * 60), difficult_subjects: data.difficulties, level: data.level, goal: data.goal }).eq("id", context.userId);
    return row;
  });

export const todayRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { askAI, parseJSON } = await import("./ai.server");
    const { data: profile } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    const { data: ans } = await context.supabase.from("answers").select("is_correct, created_at, questions(topics(name), subjects(name))").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(300);
    const stats: Record<string, { c: number; t: number }> = {};
    for (const a of (ans ?? []) as unknown as { is_correct: boolean; questions: { topics: { name: string } | null; subjects: { name: string } | null } | null }[]) {
      const k = a.questions?.topics?.name ?? a.questions?.subjects?.name; if (!k) continue;
      stats[k] ??= { c: 0, t: 0 }; stats[k].t++; if (a.is_correct) stats[k].c++;
    }
    const perf = Object.entries(stats).map(([k, s]) => `${k}: ${s.c}/${s.t}`).join("; ") || "nenhum histórico";
    const text = await askAI("Você é um tutor que recomenda o que estudar hoje. Baseie-se no desempenho real e nas dificuldades. Não invente estatísticas de provas; justifique com o desempenho do estudante ou com a relevância curricular.",
      `Prova: ${profile?.exam_name}. Data da prova: ${profile?.exam_date ?? "não informada"}. Meta diária: ${profile?.daily_goal_minutes} min. Dificuldades: ${(profile?.difficult_subjects ?? []).join(", ")}. Desempenho: ${perf}.
Responda em JSON: {"itens":[{"assunto":string,"materia":string,"minutos":number,"motivo":string,"acao":"teoria"|"exercicios"|"revisao"}] (3 a 4 itens)}`, true);
    return parseJSON<{ itens: { assunto: string; materia: string; minutos: number; motivo: string; acao: string }[] }>(text);
  });

export const generatePracticeQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topicId: string; difficulty: number; count: number }) => ({ topicId: String(d.topicId), difficulty: Math.max(1, Math.min(3, Number(d.difficulty) || 2)), count: Math.max(1, Math.min(5, Number(d.count) || 3)) }))
  .handler(async ({ data, context }) => {
    const { askAI, parseJSON } = await import("./ai.server");
    const { data: topic } = await context.supabase.from("topics").select("id,name,subject_id,subjects(name)").eq("id", data.topicId).single();
    if (!topic) throw new Error("Assunto não encontrado");
    const subjName = (topic as unknown as { subjects: { name: string } | null }).subjects?.name ?? "";
    const text = await askAI("Você elabora questões INÉDITAS de treino no estilo ENEM (contextualizadas, 5 alternativas). Nunca copie nem atribua a questão a uma prova oficial.",
      `Crie ${data.count} questões de ${subjName} — ${topic.name}, dificuldade ${["", "fácil", "média", "difícil"][data.difficulty]}. JSON: {"questoes":[{"enunciado":string,"habilidade":string,"alternativas":{"A":string,"B":string,"C":string,"D":string,"E":string},"correta":"A".."E","resolucao":string (passo a passo, explicando por que as outras estão erradas)}]}`, true);
    const parsed = parseJSON<{ questoes: { enunciado: string; habilidade: string; alternativas: Record<string, string>; correta: string; resolucao: string }[] }>(text);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids: string[] = [];
    for (const q of parsed.questoes.slice(0, data.count)) {
      const { data: row, error } = await supabaseAdmin.from("questions").insert({
        subject_id: topic.subject_id, topic_id: topic.id, statement: q.enunciado, skill: q.habilidade, difficulty: data.difficulty,
        correct_label: String(q.correta).toUpperCase().slice(0, 1), explanation: q.resolucao, origin: "ia", validation: "pendente", created_by: context.userId,
      }).select("id").single();
      if (error || !row) continue;
      await supabaseAdmin.from("question_options").insert(Object.entries(q.alternativas).slice(0, 5).map(([label, text]) => ({ question_id: row.id, label, text })));
      ids.push(row.id);
    }
    return { ids };
  });

export const explainNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; summary: string }) => ({ title: String(d.title).slice(0, 300), summary: String(d.summary).slice(0, 2000) }))
  .handler(async ({ data }) => {
    const { askAI, SYSTEM_TEACHER } = await import("./ai.server");
    const reply = await askAI(SYSTEM_TEACHER, `Explique para um estudante como este acontecimento se relaciona com os conteúdos do ENEM (matérias, conceitos, possíveis eixos de redação e repertório). Não invente fatos além do resumo.\n\nTítulo: ${data.title}\nResumo: ${data.summary}`);
    return { reply };
  });
