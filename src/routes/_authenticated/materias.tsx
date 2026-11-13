import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { answersQ, catalogQ, mastery } from "@/lib/data";
import { PageHeader } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/materias")({
  head: () => ({ meta: [{ title: "Matérias — APROVA+" }, { name: "description", content: "Áreas, matérias e assuntos do ENEM com seu domínio em cada um." }] }),
  component: Subjects,
});

function Subjects() {
  const { data: cat } = useQuery(catalogQ); const { data: answers = [] } = useQuery(answersQ);
  const [area, setArea] = useState<string | null>(null);
  const s: Record<string, { c: number; t: number }> = {};
  for (const a of answers) { const k = a.questions?.topic_id; if (!k) continue; s[k] ??= { c: 0, t: 0 }; s[k].t++; if (a.is_correct) s[k].c++; }
  const areas = cat?.areas ?? []; const cur = area ?? areas[0]?.id;
  return (
    <div>
      <PageHeader title="Matérias" subtitle="Seu indicador de domínio é atualizado a cada questão e simulado." />
      <div className="mb-6 flex flex-wrap gap-2">{areas.map((a) => <Button key={a.id} size="sm" variant={a.id === cur ? "default" : "outline"} onClick={() => setArea(a.id)}>{a.name}</Button>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{cat?.subjects.filter((x) => x.area_id === cur).map((sub) => (
        <Card key={sub.id} title={sub.name}><ul className="space-y-2.5">{cat.topics.filter((t) => t.subject_id === sub.id).map((t) => { const st = s[t.id]; const m = mastery(st?.c ?? 0, st?.t ?? 0);
          return <li key={t.id} className="text-sm"><div className="flex justify-between gap-2"><span>{t.name}</span><span className={`text-xs ${m.label === "Dominado" ? "text-success" : m.label === "Precisa de atenção" ? "text-destructive" : "text-muted-foreground"}`}>{st ? `${m.pct}% · ${m.label}` : "Sem dados"}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className={`h-full rounded-full ${m.pct >= 80 ? "bg-success" : m.pct >= 60 ? "bg-brand" : "bg-destructive"}`} style={{ width: `${m.pct}%` }} /></div></li>; })}</ul>
          <div className="mt-4 flex gap-2"><Button asChild size="sm" variant="outline"><Link to="/questoes">Praticar</Link></Button><Button asChild size="sm" variant="ghost"><Link to="/professor">Estudar com IA</Link></Button></div></Card>))}</div>
    </div>
  );
}
