import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Clock, ListChecks, Target, Flame, Sparkles, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { answersQ, catalogQ, profileQ, sessionsQ, streak, uid } from "@/lib/data";
import { todayRecommendations } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Stat, Card } from "@/components/app/Stat";
import { Notice } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel WW DECIFRA — WW DECIFRA" }, { name: "description", content: "Seu painel de estudos." }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { data: p } = useQuery(profileQ);
  const { data: answers = [] } = useQuery(answersQ);
  const { data: sessions = [] } = useQuery(sessionsQ);
  const { data: cat } = useQuery(catalogQ);
  const rec = useServerFn(todayRecommendations);
  const recM = useMutation({ mutationFn: () => rec(), onError: (e) => toast.error(e.message) });
  const [mins, setMins] = useState("30");

  const logM = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("study_sessions").insert({ user_id: await uid(), minutes: Number(mins) }); if (error) throw error; },
    onSuccess: () => { toast.success("Tempo registrado!"); qc.invalidateQueries({ queryKey: ["sessions"] }); }, onError: (e) => toast.error(e.message),
  });

  const total = answers.length, correct = answers.filter((a) => a.is_correct).length;
  const rate = total ? Math.round((correct / total) * 100) : 0;
  const hours = (sessions.reduce((s, x) => s + x.minutes, 0) / 60).toFixed(1);
  const today = new Date().toISOString().slice(0, 10);
  const todayMin = sessions.filter((s) => s.studied_on === today).reduce((s, x) => s + x.minutes, 0);
  const st = streak([...sessions.map((s) => s.studied_on), ...answers.map((a) => a.created_at)]);
  const days = p?.exam_date ? Math.ceil((new Date(p.exam_date).getTime() - Date.now()) / 86400000) : null;

  const bySubj: Record<string, { c: number; t: number }> = {};
  for (const a of answers) { const s = a.questions?.subject_id; if (!s) continue; bySubj[s] ??= { c: 0, t: 0 }; bySubj[s].t++; if (a.is_correct) bySubj[s].c++; }
  const ranked = Object.entries(bySubj).filter(([, v]) => v.t >= 3).map(([id, v]) => ({ name: cat?.subjects.find((s) => s.id === id)?.name ?? "—", pct: Math.round((v.c / v.t) * 100), t: v.t })).sort((a, b) => b.pct - a.pct);

  const weekly = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - (7 - i) * 7); const start = new Date(end); start.setDate(start.getDate() - 7);
    const w = answers.filter((a) => { const d = new Date(a.created_at); return d > start && d <= end; });
    return { semana: `${end.getDate()}/${end.getMonth() + 1}`, acertos: w.length ? Math.round((w.filter((a) => a.is_correct).length / w.length) * 100) : null };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-hero p-6 text-hero-foreground shadow-glow animate-rise sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">Painel WW DECIFRA</p>
        <p className="text-sm opacity-75">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Olá, {p?.full_name?.split(" ")[0] ?? "estudante"}!</h1>
        <p className="mt-2 max-w-xl text-sm opacity-85">{p?.goal ? `Objetivo: ${p.goal}` : "Defina seu objetivo e sua prova no plano de estudos."} · Prova: <b>{p?.exam_name ?? "ENEM"}</b></p>
        {!p?.exam_date && <Button asChild variant="hero" size="sm" className="mt-4"><Link to="/plano">Configurar meu plano</Link></Button>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={CalendarClock} label="Dias até a prova" value={days ?? "—"} />
        <Stat icon={Clock} label="Horas estudadas" value={hours} />
        <Stat icon={ListChecks} label="Questões resolvidas" value={total} />
        <Stat icon={Target} label="Taxa de acertos" value={`${rate}%`} tone={rate >= 60 ? "success" : total ? "destructive" : "brand"} />
        <Stat icon={Flame} label="Dias seguidos" value={st} tone="warning" />
        <Stat icon={Sparkles} label="XP" value={p?.xp ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="O que decifrar hoje?" className="lg:col-span-2" action={<Button size="sm" variant="brand" onClick={() => recM.mutate()} disabled={recM.isPending}>{recM.isPending ? "Analisando..." : recM.data ? "Atualizar" : "Gerar recomendações"}</Button>}>
          {recM.data ? (
            <ul className="space-y-3">{recM.data.itens.map((it, i) => (
              <li key={i} className="flex gap-3 rounded-xl border p-3"><div className="font-display text-lg font-bold text-brand">{i + 1}</div>
                <div className="flex-1"><div className="font-medium">{it.assunto} <span className="text-xs text-muted-foreground">· {it.materia} · {it.minutos} min · {it.acao}</span></div><p className="text-sm text-muted-foreground">{it.motivo}</p></div></li>))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">A IA cruza suas dificuldades e seu desempenho real nas questões para sugerir o foco de hoje.</p>}
          <p className="mt-3 text-[11px] text-muted-foreground">Recomendação da Decifra IA — não é uma previsão do que cairá na prova.</p>
        </Card>

        <Card title="Meta diária">
          <div className="text-sm text-muted-foreground">{todayMin} de {p?.daily_goal_minutes ?? 120} min</div>
          <Progress value={Math.min(100, (todayMin / (p?.daily_goal_minutes || 120)) * 100)} className="mt-2" />
          <div className="mt-4 flex gap-2"><Input type="number" min={1} max={720} value={mins} onChange={(e) => setMins(e.target.value)} aria-label="Minutos" />
            <Button onClick={() => logM.mutate()} disabled={logM.isPending}><Plus />Registrar</Button></div>
        </Card>

        <Card title="Evolução semanal de acertos" className="lg:col-span-2">
          {total ? (
            <div className="h-56"><ResponsiveContainer><AreaChart data={weekly}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--brand)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="semana" fontSize={11} stroke="var(--muted-foreground)" /><YAxis domain={[0, 100]} fontSize={11} stroke="var(--muted-foreground)" /><Tooltip />
              <Area dataKey="acertos" stroke="var(--brand)" fill="url(#g)" strokeWidth={2} connectNulls /></AreaChart></ResponsiveContainer></div>
          ) : <Notice>Resolva questões no <Link to="/questoes" className="font-semibold text-brand">banco de questões</Link> para ver sua evolução.</Notice>}
        </Card>

        <Card title="Matérias">
          {ranked.length ? (<div className="space-y-4 text-sm">
            <div><div className="mb-2 text-xs font-semibold text-success">Melhor desempenho</div>{ranked.slice(0, 3).map((r) => <div key={r.name} className="flex justify-between py-0.5"><span>{r.name}</span><b>{r.pct}%</b></div>)}</div>
            <div><div className="mb-2 text-xs font-semibold text-destructive">Precisam de atenção</div>{ranked.slice(-3).reverse().filter((r) => r.pct < 70).map((r) => <div key={r.name} className="flex justify-between py-0.5"><span>{r.name}</span><b>{r.pct}%</b></div>)}</div>
          </div>) : <p className="text-sm text-muted-foreground">Resolva pelo menos 3 questões de uma matéria para ver o ranking.</p>}
        </Card>
      </div>
    </div>
  );
}
