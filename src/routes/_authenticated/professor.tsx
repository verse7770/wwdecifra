import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uid } from "@/lib/data";
import { tutorChat, learnFromZero } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sel } from "@/components/app/Sel";

export const Route = createFileRoute("/_authenticated/professor")({
  head: () => ({ meta: [{ title: "Decifra IA — WW DECIFRA" }, { name: "description", content: "Seu professor particular com inteligência artificial." }] }),
  component: Tutor,
});

const MODES: [string, string][] = [["explicar", "Explicar matéria"], ["passo a passo", "Resolver passo a passo"], ["exercícios", "Criar exercícios"], ["resumo", "Criar resumo"], ["mapa mental", "Mapa mental (em tópicos)"], ["revisão", "Revisão personalizada"], ["por que errei", "Por que a alternativa está errada"]];
type M = { role: "user" | "assistant"; content: string };

function Tutor() {
  return (
    <div>
      <PageHeader title="Decifra IA" subtitle="Disponível 24h. Ele ensina o raciocínio, não só a resposta." />
      <Tabs defaultValue="chat"><TabsList className="mb-4"><TabsTrigger value="chat">Conversa</TabsTrigger><TabsTrigger value="zero">Aprender do Zero</TabsTrigger></TabsList>
        <TabsContent value="chat"><Chat /></TabsContent><TabsContent value="zero"><Zero /></TabsContent></Tabs>
    </div>
  );
}

function Chat() {
  const [msgs, setMsgs] = useState<M[]>([]); const [input, setInput] = useState(""); const [mode, setMode] = useState("explicar");
  const end = useRef<HTMLDivElement>(null);
  const hist = useQuery({ queryKey: ["tutor"], queryFn: async () => (await supabase.from("tutor_messages").select("role,content").eq("user_id", await uid()).order("created_at", { ascending: false }).limit(20)).data ?? [] });
  useEffect(() => { if (hist.data && !msgs.length) setMsgs([...hist.data].reverse() as M[]); }, [hist.data]); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const fn = useServerFn(tutorChat);
  const m = useMutation({ mutationFn: (all: M[]) => fn({ data: { messages: all, mode } }), onSuccess: (r) => setMsgs((x) => [...x, { role: "assistant", content: r.reply }]), onError: (e) => toast.error(e.message) });
  function send() { if (!input.trim()) return; const all = [...msgs, { role: "user" as const, content: input }]; setMsgs(all); setInput(""); m.mutate(all); }
  return (
    <Card>
      <div className="mb-3 max-w-xs"><Sel label="Modo" value={mode} onChange={setMode} items={MODES} /></div>
      <div className="h-[50vh] space-y-3 overflow-y-auto rounded-xl bg-muted/50 p-3">
        {!msgs.length && <p className="p-6 text-center text-sm text-muted-foreground">Pergunte qualquer coisa: "Me explique funções do 2º grau com um exemplo do dia a dia".</p>}
        {msgs.map((x, i) => <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${x.role === "user" ? "ml-auto bg-brand text-brand-foreground" : "bg-card shadow-card"}`}>{x.role === "user" ? <p className="whitespace-pre-wrap text-sm">{x.content}</p> : <Markdown text={x.content} />}</div>)}
        {m.isPending && <div className="text-sm text-muted-foreground">Decifra IA pensando...</div>}<div ref={end} />
      </div>
      <div className="mt-3 flex gap-2"><Textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Digite sua dúvida..." />
        <Button variant="brand" onClick={send} disabled={m.isPending} aria-label="Enviar"><Send /></Button></div>
    </Card>
  );
}

type Ex = { enunciado: string; alternativas: Record<string, string>; correta: string; resolucao: string };
function Zero() {
  const [topic, setTopic] = useState(""); const [lvl, setLvl] = useState("básico");
  const fn = useServerFn(learnFromZero);
  const m = useMutation({ mutationFn: () => fn({ data: { topic, level: lvl } }), onError: (e) => toast.error(e.message) });
  const l = m.data;
  return (
    <div className="space-y-4">
      <Card><div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <div><label className="text-xs text-muted-foreground">Assunto</label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex.: Estequiometria" /></div>
        <Sel label="Nível" value={lvl} onChange={setLvl} items={[["básico", "Básico"], ["intermediário", "Intermediário"], ["avançado", "Avançado"]]} />
        <Button variant="brand" disabled={!topic || m.isPending} onClick={() => m.mutate()}><GraduationCap />{m.isPending ? "Preparando aula..." : "Começar aula"}</Button></div></Card>
      {l && <>
        <Card title={l.titulo}><Markdown text={l.explicacao} /></Card>
        <Card title="Exemplos"><div className="space-y-3">{l.exemplos.map((e, i) => <div key={i} className="rounded-xl bg-muted p-3"><Markdown text={e} /></div>)}</div></Card>
        <Card title="Exercícios"><ExList list={l.exercicios} /></Card>
        <Card title="Avaliação final"><ExList list={l.avaliacao} /></Card>
        <Card title="Resumo"><Markdown text={l.resumo} /></Card>
      </>}
    </div>
  );
}
function ExList({ list }: { list: Ex[] }) {
  const [ch, setCh] = useState<Record<number, string>>({});
  return <div className="space-y-5">{list.map((x, i) => (
    <div key={i}><p className="mb-2 text-sm font-medium">{i + 1}. {x.enunciado}</p>
      <div className="grid gap-1.5">{Object.entries(x.alternativas).map(([k, v]) => { const s = ch[i]; const cls = s ? (k === x.correta ? "border-success bg-success/10" : s === k ? "border-destructive bg-destructive/10" : "opacity-70") : "hover:border-brand/50";
        return <button key={k} disabled={!!s} onClick={() => setCh({ ...ch, [i]: k })} className={`rounded-lg border p-2 text-left text-sm ${cls}`}><b>{k})</b> {v}</button>; })}</div>
      {ch[i] && <div className="mt-2 rounded-lg bg-muted p-3"><Markdown text={x.resolucao} /></div>}</div>))}</div>;
}
