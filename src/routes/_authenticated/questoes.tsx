import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogQ, answersQ, uid } from "@/lib/data";
import { Q_SELECT, type Q } from "@/lib/questions";
import { generatePracticeQuestions } from "@/lib/ai.functions";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { QuestionCard } from "@/components/app/QuestionCard";
import { Button } from "@/components/ui/button";
import { Sel } from "@/components/app/Sel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/questoes")({
  head: () => ({ meta: [{ title: "Central de Questões — WW DECIFRA" }, { name: "description", content: "Resolva questões por matéria, assunto e dificuldade." }] }),
  component: Bank,
});

const ALL = "all";
function Bank() {
  const qc = useQueryClient();
  const { data: cat } = useQuery(catalogQ);
  const { data: answers = [] } = useQuery(answersQ);
  const [f, setF] = useState({ subject: ALL, topic: ALL, difficulty: ALL, origin: ALL, list: "todas" });
  const [timed, setTimed] = useState(false);
  const [idx, setIdx] = useState(0);
  const start = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const favQ = useQuery({ queryKey: ["favorites"], queryFn: async () => { const { data } = await supabase.from("favorites").select("question_id").eq("user_id", await uid()); return new Set((data ?? []).map((d) => d.question_id)); } });
  const wrongIds = useMemo(() => { const last = new Map<string, boolean>(); for (const a of answers) last.set(a.question_id, a.is_correct); return [...last].filter(([, c]) => !c).map(([id]) => id); }, [answers]);

  const list = useQuery({
    queryKey: ["bank", f, f.list === "erradas" ? wrongIds.join() : "", f.list === "favoritas" ? [...(favQ.data ?? [])].join() : ""],
    queryFn: async () => {
      let q = supabase.from("questions").select(Q_SELECT).limit(200).order("created_at", { ascending: false });
      if (f.subject !== ALL) q = q.eq("subject_id", f.subject);
      if (f.topic !== ALL) q = q.eq("topic_id", f.topic);
      if (f.difficulty !== ALL) q = q.eq("difficulty", Number(f.difficulty));
      if (f.origin !== ALL) q = q.eq("origin", f.origin as Q["origin"]);
      if (f.list === "erradas") q = q.in("id", wrongIds.length ? wrongIds : ["00000000-0000-0000-0000-000000000000"]);
      if (f.list === "favoritas") { const ids = [...(favQ.data ?? [])]; q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]); }
      const { data, error } = await q; if (error) throw error; return data as unknown as Q[];
    },
  });
  useEffect(() => { setIdx(0); }, [f]);
  const cur = list.data?.[idx];
  useEffect(() => { start.current = Date.now(); setElapsed(0); if (!timed) return; const t = setInterval(() => setElapsed(Math.floor((Date.now() - start.current) / 1000)), 1000); return () => clearInterval(t); }, [cur?.id, timed]);

  const answerM = useMutation({
    mutationFn: async ({ label, correct }: { label: string; correct: boolean }) => {
      const { error } = await supabase.from("answers").insert({ user_id: await uid(), question_id: cur!.id, chosen_label: label, is_correct: correct, time_seconds: Math.round((Date.now() - start.current) / 1000) });
      if (error) throw error; return correct;
    },
    onSuccess: (c) => { toast[c ? "success" : "error"](c ? "Acertou! +10 XP" : "Não foi dessa vez. +3 XP pela tentativa"); qc.invalidateQueries({ queryKey: ["answers"] }); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e) => toast.error(e.message),
  });
  const favM = useMutation({
    mutationFn: async () => { const id = await uid(); if (favQ.data?.has(cur!.id)) await supabase.from("favorites").delete().eq("user_id", id).eq("question_id", cur!.id); else await supabase.from("favorites").insert({ user_id: id, question_id: cur!.id }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
  const gen = useServerFn(generatePracticeQuestions);
  const genM = useMutation({
    mutationFn: () => gen({ data: { topicId: f.topic, difficulty: f.difficulty === ALL ? 2 : Number(f.difficulty), count: 3 } }),
    onSuccess: (r) => { toast.success(`${r.ids.length} questões de treino criadas`); qc.invalidateQueries({ queryKey: ["bank"] }); }, onError: (e) => toast.error(e.message),
  });

  const topics = cat?.topics.filter((t) => f.subject === ALL || t.subject_id === f.subject) ?? [];
  const topicStats = useMemo(() => { const s: Record<string, { c: number; t: number }> = {}; for (const a of answers) { const k = a.questions?.topic_id; if (!k) continue; s[k] ??= { c: 0, t: 0 }; s[k].t++; if (a.is_correct) s[k].c++; } return s; }, [answers]);
  const ts = f.topic !== ALL ? topicStats[f.topic] : undefined;

  return (
    <div>
      <PageHeader title="Central de Questões" subtitle="Filtre, resolva e acompanhe seus acertos por assunto." />
      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Sel label="Matéria" value={f.subject} onChange={(v) => setF({ ...f, subject: v, topic: ALL })} items={[[ALL, "Todas"], ...(cat?.subjects.map((s) => [s.id, s.name] as [string, string]) ?? [])]} />
          <Sel label="Assunto" value={f.topic} onChange={(v) => setF({ ...f, topic: v })} items={[[ALL, "Todos"], ...topics.map((t) => [t.id, t.name] as [string, string])]} />
          <Sel label="Dificuldade" value={f.difficulty} onChange={(v) => setF({ ...f, difficulty: v })} items={[[ALL, "Todas"], ["1", "Fácil"], ["2", "Média"], ["3", "Difícil"]]} />
          <Sel label="Origem" value={f.origin} onChange={(v) => setF({ ...f, origin: v })} items={[[ALL, "Todas"], ["oficial", "Oficial"], ["autoral", "Autoral"], ["ia", "Treino IA"]]} />
          <Sel label="Lista" value={f.list} onChange={(v) => setF({ ...f, list: v })} items={[["todas", "Todas"], ["erradas", "Refazer erradas"], ["favoritas", "Favoritas"]]} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Switch id="t" checked={timed} onCheckedChange={setTimed} /><Label htmlFor="t">Cronometrar</Label>{timed && <span className="font-mono text-sm text-brand">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>}</div>
          {ts && <span className="text-sm text-muted-foreground">Seu acerto neste assunto: <b>{Math.round((ts.c / ts.t) * 100)}%</b> ({ts.t} questões)</span>}
          <Button variant="outline" size="sm" disabled={f.topic === ALL || genM.isPending} onClick={() => genM.mutate()}><Sparkles />{genM.isPending ? "Gerando..." : "Gerar 3 questões de treino (IA)"}</Button>
        </div>
      </Card>

      {list.isLoading ? <p className="text-muted-foreground">Carregando...</p> : !cur ? (
        <Notice>Nenhuma questão para estes filtros. Questões oficiais são adicionadas pela administração somente após validação com a fonte (INEP/instituição). Você pode escolher um assunto e gerar questões de <b>treino</b> com IA — elas ficam marcadas como não oficiais.</Notice>
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span>Questão {idx + 1} de {list.data!.length}</span>
            <div className="flex gap-1"><Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft /></Button><Button size="icon" variant="ghost" disabled={idx >= list.data!.length - 1} onClick={() => setIdx(idx + 1)}><ChevronRight /></Button></div></div>
          <QuestionCard key={cur.id} q={cur} favorite={favQ.data?.has(cur.id)} onToggleFav={() => favM.mutate()} onAnswer={(label, correct) => answerM.mutate({ label, correct })} />
        </Card>
      )}
    </div>
  );
}

