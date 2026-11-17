import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogQ, uid } from "@/lib/data";
import { fetchQuestionsByIds, type Q } from "@/lib/questions";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card, Stat } from "@/components/app/Stat";
import { QuestionCard } from "@/components/app/QuestionCard";
import { Sel } from "@/components/app/Sel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/simulados")({
  head: () => ({ meta: [{ title: "Desafios Decifra — WW DECIFRA" }, { name: "description", content: "Desafios Decifra cronometrados com relatório de desempenho." }] }),
  component: Sims,
});

type Run = { id: string; title: string; qs: Q[]; minutes: number; started: number };
const MODES = [["completo", "Completo (todas as áreas)"], ["area", "Por área"], ["materia", "Por matéria"], ["assunto", "Por assunto"], ["revisao", "Revisão (questões que errei)"], ["ia", "Personalizado (pontos fracos)"]] as [string, string][];

function Sims() {
  const qc = useQueryClient();
  const { data: cat } = useQuery(catalogQ);
  const [cfg, setCfg] = useState({ mode: "completo", area: "", subject: "", topic: "", n: "10", minutes: "30" });
  const [run, setRun] = useState<Run | null>(null);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [times, setTimes] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [i, setI] = useState(0); const [now, setNow] = useState(Date.now()); const [enter, setEnter] = useState(Date.now());
  const [report, setReport] = useState<null | { qs: Q[]; ans: Record<string, string>; times: Record<string, number> }>(null);

  const history = useQuery({ queryKey: ["sims"], queryFn: async () => (await supabase.from("simulations").select("*").eq("user_id", await uid()).not("finished_at", "is", null).order("created_at", { ascending: false }).limit(10)).data ?? [] });

  useEffect(() => { if (!run) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [run]);
  const left = run ? Math.max(0, run.minutes * 60 - Math.floor((now - run.started) / 1000)) : 0;
  useEffect(() => { if (run && left === 0) finishM.mutate(); }, [left]); // eslint-disable-line

  const startM = useMutation({
    mutationFn: async () => {
      const n = Math.max(1, Math.min(90, Number(cfg.n)));
      let ids: string[] = [];
      const user = await uid();
      if (cfg.mode === "revisao" || cfg.mode === "ia") {
        const { data } = await supabase.from("answers").select("question_id,is_correct,questions(topic_id)").eq("user_id", user);
        const rows = (data ?? []) as unknown as { question_id: string; is_correct: boolean; questions: { topic_id: string | null } | null }[];
        if (cfg.mode === "revisao") ids = [...new Set(rows.filter((r) => !r.is_correct).map((r) => r.question_id))];
        else {
          const s: Record<string, { c: number; t: number }> = {}; for (const r of rows) { const k = r.questions?.topic_id; if (!k) continue; s[k] ??= { c: 0, t: 0 }; s[k].t++; if (r.is_correct) s[k].c++; }
          const weak = Object.entries(s).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t).slice(0, 5).map(([k]) => k);
          if (!weak.length) throw new Error("Resolva algumas questões primeiro para a IA identificar seus pontos fracos.");
          ids = ((await supabase.from("questions").select("id").in("topic_id", weak).limit(300)).data ?? []).map((d) => d.id);
        }
      } else {
        let q = supabase.from("questions").select("id").limit(500);
        if (cfg.mode === "area" && cfg.area) q = q.in("subject_id", cat!.subjects.filter((s) => s.area_id === cfg.area).map((s) => s.id));
        if (cfg.mode === "materia" && cfg.subject) q = q.eq("subject_id", cfg.subject);
        if (cfg.mode === "assunto" && cfg.topic) q = q.eq("topic_id", cfg.topic);
        ids = ((await q).data ?? []).map((d) => d.id);
      }
      ids = ids.sort(() => Math.random() - 0.5).slice(0, n);
      if (!ids.length) throw new Error("Não há questões suficientes para este simulado. Gere questões de treino no banco de questões.");
      const qs = await fetchQuestionsByIds(ids);
      const title = MODES.find((m) => m[0] === cfg.mode)?.[1] ?? "Simulado";
      const { data, error } = await supabase.from("simulations").insert({ user_id: user, title, mode: cfg.mode, question_ids: ids, duration_minutes: Number(cfg.minutes) }).select("id").single();
      if (error) throw error;
      return { id: data.id, title, qs, minutes: Math.max(1, Number(cfg.minutes)), started: Date.now() };
    },
    onSuccess: (r) => { setRun(r); setAns({}); setTimes({}); setMarked(new Set()); setI(0); setEnter(Date.now()); setReport(null); },
    onError: (e) => toast.error(e.message),
  });

  function go(n: number) { if (!run) return; const id = run.qs[i]?.id ?? ""; setTimes((t) => ({ ...t, [id]: (t[id] ?? 0) + Math.round((Date.now() - enter) / 1000) })); setEnter(Date.now()); setI(n); }

  const finishM = useMutation({
    mutationFn: async () => {
      if (!run) return;
      const id = run.qs[i]?.id ?? ""; const tt = { ...times, [id]: (times[id] ?? 0) + Math.round((Date.now() - enter) / 1000) };
      const user = await uid();
      const rows = run.qs.filter((q) => ans[q.id]).map((q) => ({ user_id: user, question_id: q.id, chosen_label: ans[q.id] ?? "", is_correct: ans[q.id] === q.correct_label, time_seconds: tt[q.id] ?? 0, simulation_id: run.id }));
      if (rows.length) { const { error } = await supabase.from("answers").insert(rows); if (error) throw error; }
      await supabase.from("simulations").update({ finished_at: new Date().toISOString(), correct: rows.filter((r) => r.is_correct).length, total: run.qs.length }).eq("id", run.id);
      return { qs: run.qs, ans, times: tt };
    },
    onSuccess: (r) => { if (r) setReport(r); setRun(null); ["answers", "profile", "sims"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); },
    onError: (e) => toast.error(e.message),
  });

  const q = run?.qs[i];
  if (run && q) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Card>
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Questão {i + 1}/{run.qs.length}</span>
            <Button size="sm" variant={marked.has(q.id) ? "secondary" : "ghost"} onClick={() => setMarked((m) => { const n = new Set(m); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}><Flag />{marked.has(q.id) ? "Marcada" : "Marcar"}</Button></div>
          <QuestionCard key={q.id} q={q} practice={false} chosen={ans[q.id] ?? null} revealed={false} onAnswer={(l) => setAns((a) => ({ ...a, [q.id]: l }))} />
          <div className="mt-6 flex justify-between"><Button variant="outline" disabled={i === 0} onClick={() => go(i - 1)}>Anterior</Button>
            {i < run.qs.length - 1 ? <Button onClick={() => go(i + 1)}>Próxima</Button> : <Button variant="brand" onClick={() => finishM.mutate()}>Finalizar</Button>}</div>
        </Card>
        <Card title="Tempo restante">
          <div className={`font-mono text-3xl font-bold ${left < 60 ? "text-destructive" : "text-brand"}`}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
          <div className="mt-4 grid grid-cols-6 gap-1.5">{run.qs.map((x, n) => (
            <button key={x.id} onClick={() => go(n)} className={`aspect-square rounded-md border text-xs font-semibold ${n === i ? "ring-2 ring-brand" : ""} ${marked.has(x.id) ? "border-warning bg-warning/20" : ans[x.id] ? "bg-brand text-brand-foreground" : ""}`}>{n + 1}</button>))}</div>
          <Button variant="brand" className="mt-4 w-full" onClick={() => finishM.mutate()} disabled={finishM.isPending}>Finalizar simulado</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Desafios Decifra" subtitle="Monte um simulado, resolva com cronômetro e receba o relatório." />
      {report && <Report r={report} subjects={cat?.subjects ?? []} topics={cat?.topics ?? []} />}
      <Card title="Novo simulado">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Sel label="Modalidade" value={cfg.mode} onChange={(v) => setCfg({ ...cfg, mode: v })} items={MODES} />
          {cfg.mode === "area" && <Sel label="Área" value={cfg.area} onChange={(v) => setCfg({ ...cfg, area: v })} items={cat?.areas.map((a) => [a.id, a.name]) ?? []} />}
          {(cfg.mode === "materia" || cfg.mode === "assunto") && <Sel label="Matéria" value={cfg.subject} onChange={(v) => setCfg({ ...cfg, subject: v, topic: "" })} items={cat?.subjects.map((a) => [a.id, a.name]) ?? []} />}
          {cfg.mode === "assunto" && <Sel label="Assunto" value={cfg.topic} onChange={(v) => setCfg({ ...cfg, topic: v })} items={cat?.topics.filter((t) => t.subject_id === cfg.subject).map((a) => [a.id, a.name]) ?? []} />}
          <div><Label className="mb-1 block text-xs text-muted-foreground">Nº de questões</Label><Input type="number" min={1} max={90} value={cfg.n} onChange={(e) => setCfg({ ...cfg, n: e.target.value })} /></div>
          <div><Label className="mb-1 block text-xs text-muted-foreground">Duração (min)</Label><Input type="number" min={1} value={cfg.minutes} onChange={(e) => setCfg({ ...cfg, minutes: e.target.value })} /></div>
        </div>
        <Button variant="brand" className="mt-4" onClick={() => startM.mutate()} disabled={startM.isPending}>{startM.isPending ? "Montando..." : "Iniciar simulado"}</Button>
        <p className="mt-3 text-xs text-muted-foreground">O simulado completo do ENEM tem 180 questões e 2 redações em dois dias. Aqui você escolhe o tamanho conforme as questões disponíveis no banco.</p>
      </Card>
      <Card title="Histórico">
        {history.data?.length ? <ul className="divide-y text-sm">{history.data.map((s) => <li key={s.id} className="flex justify-between py-2"><span>{s.title} · {new Date(s.created_at!).toLocaleDateString("pt-BR")}</span><b>{s.correct}/{s.total}</b></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum simulado concluído ainda.</p>}
      </Card>
    </div>
  );
}

function Report({ r, subjects, topics }: { r: { qs: Q[]; ans: Record<string, string>; times: Record<string, number> }; subjects: { id: string; name: string }[]; topics: { id: string; name: string }[] }) {
  const c = r.qs.filter((q) => r.ans[q.id] === q.correct_label).length;
  const pct = Math.round((c / r.qs.length) * 100);
  const avg = Math.round(Object.values(r.times).reduce((a, b) => a + b, 0) / r.qs.length);
  const byT = useMemo(() => { const s: Record<string, { c: number; t: number }> = {}; for (const q of r.qs) { const k = q.topic_id ?? q.subject_id ?? "?"; s[k] ??= { c: 0, t: 0 }; s[k].t++; if (r.ans[q.id] === q.correct_label) s[k].c++; } return s; }, [r]);
  const name = (id: string) => topics.find((t) => t.id === id)?.name ?? subjects.find((s) => s.id === id)?.name ?? "Outros";
  const good = Object.entries(byT).filter(([, v]) => v.c / v.t >= 0.7), bad = Object.entries(byT).filter(([, v]) => v.c / v.t < 0.7);
  return (
    <Card title="Relatório do simulado">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={CheckCircle2} label="Acertos" value={c} tone="success" /><Stat icon={XCircle} label="Erros / em branco" value={r.qs.length - c} tone="destructive" />
        <Stat icon={Percent} label="Aproveitamento" value={`${pct}%`} /><Stat icon={Clock} label="Tempo médio/questão" value={`${avg}s`} tone="warning" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
        <div><div className="mb-1 font-semibold text-success">Assuntos dominados</div>{good.length ? good.map(([k]) => <div key={k}>{name(k)}</div>) : "—"}</div>
        <div><div className="mb-1 font-semibold text-destructive">Assuntos com dificuldade</div>{bad.length ? bad.map(([k, v]) => <div key={k}>{name(k)} ({v.c}/{v.t})</div>) : "—"}</div>
      </div>
      {bad.length > 0 && <p className="mt-4 text-sm">Recomendação: revise a teoria de <b>{bad.map(([k]) => name(k)).slice(0, 3).join(", ")}</b> com o Decifra IA e refaça as questões erradas no banco.</p>}
      <div className="mt-4"><Notice tone="warn">Estimativa TRI não exibida: a nota pela TRI depende dos parâmetros oficiais de cada item (calibrados pelo INEP), que questões de treino não possuem. O aproveitamento acima não equivale à nota oficial do ENEM.</Notice></div>
    </Card>
  );
}
