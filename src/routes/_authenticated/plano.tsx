import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogQ, profileQ, uid } from "@/lib/data";
import { generateStudyPlan } from "@/lib/ai.functions";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Sel } from "@/components/app/Sel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({ meta: [{ title: "Plano de estudos — APROVA+" }, { name: "description", content: "Cronograma personalizado que se adapta ao seu desempenho." }] }),
  component: Plan,
});

type Bloco = { materia: string; assunto: string; minutos: number; tipo: string; prioridade: string; motivo: string };
type PlanT = { resumo?: string; dias?: { dia: string; blocos: Bloco[] }[]; revisao_espacada?: string[]; dicas?: string[] };
const PRI: Record<string, string> = { "muito alta": "bg-destructive text-destructive-foreground", alta: "bg-warning", "média": "bg-brand/15 text-brand", baixa: "bg-muted" };

function Plan() {
  const qc = useQueryClient();
  const { data: p } = useQuery(profileQ); const { data: cat } = useQuery(catalogQ);
  const [f, setF] = useState({ exam: "ENEM", examDate: "", hours: "3", level: "intermediario", goal: "", diff: [] as string[] });
  useEffect(() => { if (p) setF((x) => ({ ...x, exam: p.exam_name ?? "ENEM", examDate: p.exam_date ?? "", hours: String((p.daily_goal_minutes ?? 120) / 60), level: p.level ?? "intermediario", goal: p.goal ?? "", diff: p.difficult_subjects ?? [] })); }, [p]);
  const latest = useQuery({ queryKey: ["plan"], queryFn: async () => (await supabase.from("study_plans").select("*").eq("user_id", await uid()).order("created_at", { ascending: false }).limit(1).maybeSingle()).data });
  const fn = useServerFn(generateStudyPlan);
  const m = useMutation({ mutationFn: () => fn({ data: { exam: f.exam, examDate: f.examDate, hoursPerDay: Number(f.hours), difficulties: f.diff, level: f.level, goal: f.goal } }),
    onSuccess: () => { toast.success("Plano gerado!"); qc.invalidateQueries({ queryKey: ["plan"] }); qc.invalidateQueries({ queryKey: ["profile"] }); }, onError: (e) => toast.error(e.message) });
  const plan = latest.data?.plan as PlanT | undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Plano de estudos" subtitle="A IA monta sua semana e reforça o que você mais erra." />
      <Card title="Seus dados">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div><Label className="mb-1 block text-xs text-muted-foreground">Prova</Label><Input value={f.exam} onChange={(e) => setF({ ...f, exam: e.target.value })} /></div>
          <div><Label className="mb-1 block text-xs text-muted-foreground">Data da prova</Label><Input type="date" value={f.examDate} onChange={(e) => setF({ ...f, examDate: e.target.value })} /></div>
          <div><Label className="mb-1 block text-xs text-muted-foreground">Horas por dia</Label><Input type="number" step="0.5" min={0.5} max={14} value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></div>
          <Sel label="Nível atual" value={f.level} onChange={(v) => setF({ ...f, level: v })} items={[["iniciante", "Iniciante"], ["intermediario", "Intermediário"], ["avancado", "Avançado"]]} />
          <div className="sm:col-span-2"><Label className="mb-1 block text-xs text-muted-foreground">Meta</Label><Input value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} placeholder="Ex.: Medicina na UFMG, 780+ no ENEM" /></div>
        </div>
        <Label className="mb-2 mt-4 block text-xs text-muted-foreground">Matérias com mais dificuldade</Label>
        <div className="flex flex-wrap gap-2">{cat?.subjects.map((s) => { const on = f.diff.includes(s.name); return <button key={s.id} onClick={() => setF({ ...f, diff: on ? f.diff.filter((d) => d !== s.name) : [...f.diff, s.name] })} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-brand bg-brand text-brand-foreground" : ""}`}>{s.name}</button>; })}</div>
        <Button variant="brand" className="mt-5" onClick={() => m.mutate()} disabled={m.isPending}><CalendarDays />{m.isPending ? "Gerando cronograma..." : latest.data ? "Recalcular com meu desempenho" : "Gerar plano"}</Button>
      </Card>
      {plan?.dias ? (<>
        {plan.resumo && <Notice>{plan.resumo}</Notice>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plan.dias.map((d) => (
          <Card key={d.dia} title={d.dia}><ul className="space-y-3">{d.blocos.map((b, i) => (
            <li key={i} className="rounded-xl border p-3 text-sm"><div className="flex items-center justify-between gap-2"><b>{b.materia}</b><span className="text-xs text-muted-foreground">{b.minutos} min</span></div>
              <div>{b.assunto}</div><div className="mt-1.5 flex flex-wrap gap-1"><Badge variant="outline">{b.tipo}</Badge><Badge className={PRI[b.prioridade] ?? ""}>{b.prioridade}</Badge></div>
              <p className="mt-1 text-xs text-muted-foreground">{b.motivo}</p></li>))}</ul></Card>))}</div>
        {plan.revisao_espacada && <Card title="Revisão espaçada"><ul className="ml-5 list-disc text-sm">{plan.revisao_espacada.map((r, i) => <li key={i}>{r}</li>)}</ul></Card>}
        <p className="text-xs text-muted-foreground">Gerado em {new Date(latest.data!.created_at!).toLocaleString("pt-BR")}. Recalcule após resolver questões para o plano refletir seu desempenho real.</p>
      </>) : !latest.isLoading && <p className="text-sm text-muted-foreground">Preencha seus dados e gere seu primeiro plano.</p>}
    </div>
  );
}
