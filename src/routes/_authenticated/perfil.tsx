import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { answersQ, level, profileQ, sessionsQ, streak, uid } from "@/lib/data";
import { PageHeader } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — WW DECIFRA" }, { name: "description", content: "Seu perfil, nível e conquistas." }] }),
  component: Profile,
});

function Profile() {
  const qc = useQueryClient();
  const { data: p } = useQuery(profileQ); const { data: answers = [] } = useQuery(answersQ); const { data: sessions = [] } = useQuery(sessionsQ);
  const [f, setF] = useState({ full_name: "", avatar_url: "", goal: "" });
  useEffect(() => { if (p) setF({ full_name: p.full_name ?? "", avatar_url: p.avatar_url ?? "", goal: p.goal ?? "" }); }, [p]);
  const essays = useQuery({ queryKey: ["essays-count"], queryFn: async () => (await supabase.from("essays").select("id", { count: "exact", head: true }).eq("user_id", await uid())).count ?? 0 });
  const plans = useQuery({ queryKey: ["plans-count"], queryFn: async () => (await supabase.from("study_plans").select("id", { count: "exact", head: true }).eq("user_id", await uid())).count ?? 0 });
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from("profiles").update(f).eq("id", await uid()); if (error) throw error; }, onSuccess: () => { toast.success("Perfil salvo"); qc.invalidateQueries({ queryKey: ["profile"] }); }, onError: (e) => toast.error(e.message) });
  const lv = level(p?.xp ?? 0); const correct = answers.filter((a) => a.is_correct).length;
  const st = streak([...sessions.map((s) => s.studied_on), ...answers.map((a) => a.created_at)]);
  const ach = [
    ["Primeira questão", answers.length >= 1], ["Dez acertos", correct >= 10], ["Cem questões", answers.length >= 100],
    ["Primeira redação", (essays.data ?? 0) >= 1], ["Planejado", (plans.data ?? 0) >= 1], ["Constância (3 dias)", st >= 3], ["Semana completa (7 dias)", st >= 7],
  ] as [string, boolean][];
  const week = answers.filter((a) => Date.now() - new Date(a.created_at).getTime() < 7 * 86400000).length;
  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Dados">
          <div className="space-y-3">
            {f.avatar_url && <img src={f.avatar_url} alt="" className="size-16 rounded-full object-cover" />}
            <div><Label>Nome</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div><Label>Foto (URL, opcional)</Label><Input value={f.avatar_url} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} /></div>
            <div><Label>Objetivo</Label><Input value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} /></div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
          </div>
        </Card>
        <Card title={`Nível ${lv.lvl} · ${p?.xp ?? 0} XP`}>
          <Progress value={lv.progress} /><p className="mt-2 text-xs text-muted-foreground">Próximo nível em {lv.next} XP. Acerto = 10 XP, tentativa = 3 XP.</p>
          <div className="mt-5 rounded-xl border p-3 text-sm"><b>Desafio semanal:</b> resolver 50 questões — {Math.min(week, 50)}/50<Progress value={(week / 50) * 100} className="mt-2" /></div>
          <div className="mt-5 grid grid-cols-2 gap-2">{ach.map(([n, ok]) => <div key={n} className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${ok ? "border-success/50 bg-success/10" : "opacity-60"}`}>{ok ? <Trophy className="size-4 text-success" /> : <Lock className="size-4" />}{n}</div>)}</div>
        </Card>
      </div>
    </div>
  );
}
