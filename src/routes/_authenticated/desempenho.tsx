import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { answersQ, catalogQ, sessionsQ, uid, mastery } from "@/lib/data";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";

export const Route = createFileRoute("/_authenticated/desempenho")({
  head: () => ({ meta: [{ title: "Desempenho — APROVA+" }, { name: "description", content: "Gráficos da sua evolução." }] }),
  component: Perf,
});

function Perf() {
  const { data: answers = [] } = useQuery(answersQ); const { data: cat } = useQuery(catalogQ); const { data: sessions = [] } = useQuery(sessionsQ);
  const sims = useQuery({ queryKey: ["sims"], queryFn: async () => (await supabase.from("simulations").select("*").eq("user_id", await uid()).not("finished_at", "is", null).order("created_at", { ascending: false }).limit(10)).data ?? [] });
  const days: Record<string, { c: number; t: number }> = {};
  for (const a of answers) { const d = a.created_at.slice(5, 10); days[d] ??= { c: 0, t: 0 }; days[d].t++; if (a.is_correct) days[d].c++; }
  const evo = Object.entries(days).slice(-30).map(([d, v]) => ({ d, pct: Math.round((v.c / v.t) * 100) }));
  const subj: Record<string, { c: number; t: number }> = {}; const top: Record<string, { c: number; t: number }> = {};
  for (const a of answers) { const s = a.questions?.subject_id, t = a.questions?.topic_id; if (s) { subj[s] ??= { c: 0, t: 0 }; subj[s].t++; if (a.is_correct) subj[s].c++; } if (t) { top[t] ??= { c: 0, t: 0 }; top[t].t++; if (a.is_correct) top[t].c++; } }
  const bySubj = Object.entries(subj).map(([id, v]) => ({ name: cat?.subjects.find((s) => s.id === id)?.name ?? "?", pct: Math.round((v.c / v.t) * 100) }));
  const time: Record<string, number> = {}; for (const s of sessions) time[s.studied_on.slice(5)] = (time[s.studied_on.slice(5)] ?? 0) + s.minutes;
  const timeD = Object.entries(time).slice(-14).map(([d, m]) => ({ d, m }));
  const simD = [...(sims.data ?? [])].reverse().map((s, i) => ({ n: `#${i + 1}`, pct: s.total ? Math.round(((s.correct ?? 0) / s.total) * 100) : 0 }));
  if (!answers.length && !sessions.length) return <div><PageHeader title="Desempenho" /><Notice>Resolva questões ou registre tempo de estudo para ver seus gráficos.</Notice></div>;
  return (
    <div className="space-y-6">
      <PageHeader title="Desempenho" subtitle="Sua evolução real, calculada a partir das suas respostas." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Evolução de acertos (%)"><div className="h-56"><ResponsiveContainer><LineChart data={evo}><XAxis dataKey="d" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><Line dataKey="pct" stroke="var(--brand)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Card>
        <Card title="Desempenho por matéria (%)"><div className="h-56"><ResponsiveContainer><BarChart data={bySubj}><XAxis dataKey="name" fontSize={10} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><Bar dataKey="pct" fill="var(--success)" radius={4} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Tempo de estudo (min/dia)"><div className="h-56"><ResponsiveContainer><BarChart data={timeD}><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="m" fill="var(--brand)" radius={4} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Comparação entre simulados (%)">{simD.length ? <div className="h-56"><ResponsiveContainer><BarChart data={simD}><XAxis dataKey="n" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><Bar dataKey="pct" fill="var(--warning)" radius={4} /></BarChart></ResponsiveContainer></div> : <p className="text-sm text-muted-foreground">Nenhum simulado concluído.</p>}</Card>
      </div>
      <Card title="Domínio por assunto"><ul className="grid gap-2 sm:grid-cols-2">{Object.entries(top).map(([id, v]) => { const m = mastery(v.c, v.t); return <li key={id} className="flex justify-between rounded-lg border p-2 text-sm"><span>{cat?.topics.find((t) => t.id === id)?.name}</span><span>{m.pct}% · {m.label}</span></li>; })}</ul></Card>
    </div>
  );
}
