import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { answersQ, catalogQ, mastery, priorityFromIncidence } from "@/lib/data";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/analise")({
  head: () => ({ meta: [{ title: "Análise do ENEM — APROVA+" }, { name: "description", content: "Incidência histórica por assunto baseada em dados oficiais validados." }] }),
  component: Analysis,
});

function Analysis() {
  const { data: cat } = useQuery(catalogQ); const { data: answers = [] } = useQuery(answersQ);
  const exams = useQuery({ queryKey: ["exams"], queryFn: async () => (await supabase.from("exams").select("*,institutions(name)").order("year")).data ?? [] });
  const inc = useQuery({ queryKey: ["incidence"], queryFn: async () => (await supabase.from("topic_incidence").select("*").eq("validation", "validado")).data ?? [] });
  const enem = (exams.data ?? []).filter((e) => (e.institutions as { name: string } | null)?.name === "INEP / ENEM" && [2024, 2025, 2026].includes(e.year));
  const validExams = enem.filter((e) => e.data_available && e.validation === "validado");

  const rows = useMemo(() => {
    const ids = new Set(validExams.map((e) => e.id));
    const by: Record<string, { q: number; eds: Set<string>; perYear: Record<number, number> }> = {};
    for (const r of inc.data ?? []) { if (!ids.has(r.exam_id)) continue; const b = (by[r.topic_id] ??= { q: 0, eds: new Set(), perYear: {} }); b.q += r.question_count; b.eds.add(r.exam_id); const y = validExams.find((e) => e.id === r.exam_id)?.year ?? 0; b.perYear[y] = r.question_count; }
    return Object.entries(by).map(([tid, v]) => { const t = cat?.topics.find((x) => x.id === tid); const sub = cat?.subjects.find((s) => s.id === t?.subject_id);
      const years = Object.keys(v.perYear).map(Number).sort(); const trend = years.length >= 2 ? (v.perYear[years[years.length - 1] ?? 0] ?? 0) - (v.perYear[years[0] ?? 0] ?? 0) : 0;
      return { tid, name: t?.name ?? "?", subject: sub?.name ?? "", q: v.q, eds: v.eds.size, trend, pri: priorityFromIncidence(v.eds.size, validExams.length, v.q) };
    }).sort((a, b) => b.q - a.q);
  }, [inc.data, validExams, cat]);

  const my: Record<string, { c: number; t: number }> = {};
  for (const a of answers) { const k = a.questions?.topic_id; if (!k) continue; my[k] ??= { c: 0, t: 0 }; my[k].t++; if (a.is_correct) my[k].c++; }

  return (
    <div className="space-y-6">
      <PageHeader title="Análise do ENEM (2024–2026)" subtitle="Frequência histórica baseada somente em dados oficiais validados." />
      <Card title="Edições analisadas">
        <div className="grid gap-3 sm:grid-cols-3">{enem.map((e) => (
          <div key={e.id} className="rounded-xl border p-4"><div className="flex items-center justify-between"><b className="font-display text-lg">ENEM {e.year}</b>
            <Badge variant={e.data_available && e.validation === "validado" ? "default" : "outline"}>{e.data_available && e.validation === "validado" ? "Dados validados" : "Dados indisponíveis"}</Badge></div>
            <p className="mt-2 text-xs text-muted-foreground">{e.notes}</p>{e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand">Fonte oficial <ExternalLink className="size-3" /></a>}</div>))}</div>
      </Card>
      {rows.length === 0 ? (
        <Notice tone="warn">Ainda não há dados de incidência validados para as edições 2024–2026. A plataforma <b>não exibe estatísticas estimadas ou inventadas</b>: assim que a equipe importar e validar as provas e gabaritos oficiais do INEP (painel administrativo → Incidência), a classificação por prioridade aparecerá aqui automaticamente.</Notice>
      ) : (<>
        <Card title="1. Dados históricos confirmados — questões por assunto">
          <div className="h-72"><ResponsiveContainer><BarChart data={rows.slice(0, 12)} layout="vertical" margin={{ left: 40 }}><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" width={140} fontSize={11} /><Tooltip /><Bar dataKey="q" fill="var(--brand)" radius={4} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="2–3. Análise estatística e tendências · Prioridade">
          <ul className="divide-y">{rows.map((r) => { const m = my[r.tid]; return (
            <li key={r.tid} className="py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><b>{r.subject.toUpperCase()} — {r.name}</b><Badge>{r.pri}</Badge></div>
              <p className="mt-1 text-muted-foreground">Justificativa: presente em {r.eds} de {validExams.length} edições analisadas, somando {r.q} questões. {r.trend > 0 ? "Ganhou frequência no período." : r.trend < 0 ? "Perdeu frequência no período." : "Frequência estável."}</p>
              <p className="mt-1 text-xs">{m ? `4. Seu domínio: ${mastery(m.c, m.t).pct}% (${m.t} questões)${mastery(m.c, m.t).pct < 60 ? " — conteúdo que você ainda precisa dominar." : ""}` : "4. Você ainda não praticou este assunto."}</p></li>); })}</ul>
        </Card>
      </>)}
      <p className="text-xs text-muted-foreground">Frequência histórica não é previsão: a plataforma aponta recorrência nas provas analisadas, mas nunca garante que um conteúdo cairá na próxima prova.</p>
    </div>
  );
}
