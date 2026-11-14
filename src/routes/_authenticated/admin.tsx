import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { catalogQ, uid } from "@/lib/data";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Sel } from "@/components/app/Sel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const id = await uid();
    const { data } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Administração — APROVA+" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const ok = (qc: ReturnType<typeof useQueryClient>, k: string) => () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: [k] }); };
async function run<T>(p: PromiseLike<{ error: { message: string } | null; data?: T }>) { const r = await p; if (r.error) throw new Error(r.error.message); return r.data; }

function Admin() {
  return (
    <div>
      <PageHeader title="Administração" subtitle="Acesso protegido por permissão no banco de dados." />
      <Tabs defaultValue="stats"><TabsList className="mb-4 flex h-auto flex-wrap">
        {[["stats", "Estatísticas"], ["questoes", "Questões"], ["provas", "Provas"], ["incidencia", "Incidência"], ["inst", "Instituições"], ["materias", "Matérias"], ["news", "Notícias"], ["users", "Estudantes"], ["ia", "IA"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}</TabsList>
        <TabsContent value="stats"><Stats /></TabsContent><TabsContent value="questoes"><Questions /></TabsContent><TabsContent value="provas"><Exams /></TabsContent>
        <TabsContent value="incidencia"><Incidence /></TabsContent><TabsContent value="inst"><Inst /></TabsContent><TabsContent value="materias"><Topics /></TabsContent>
        <TabsContent value="news"><NewsAdmin /></TabsContent><TabsContent value="users"><Users /></TabsContent>
        <TabsContent value="ia"><Card title="Configuração da IA"><p className="text-sm text-muted-foreground">A IA roda no servidor pelo Lovable AI (nenhuma chave exposta no navegador). Uso e créditos são gerenciados nas configurações do workspace. Assinaturas ainda não foram implementadas.</p></Card></TabsContent>
      </Tabs>
    </div>
  );
}

function Stats() {
  const s = useQuery({ queryKey: ["admin-stats"], queryFn: async () => {
    const c = async (t: "profiles" | "answers" | "simulations" | "essays" | "questions" | "study_plans") => (await supabase.from(t).select("*", { count: "exact", head: true })).count ?? 0;
    const [u, a, si, e, q, p] = await Promise.all([c("profiles"), c("answers"), c("simulations"), c("essays"), c("questions"), c("study_plans")]);
    return { "Estudantes": u, "Respostas": a, "Simulados": si, "Redações": e, "Questões": q, "Planos": p };
  } });
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Object.entries(s.data ?? {}).map(([k, v]) => <Card key={k}><div className="font-display text-2xl font-bold">{v}</div><div className="text-xs text-muted-foreground">{k}</div></Card>)}</div>;
}

function Questions() {
  const qc = useQueryClient(); const { data: cat } = useQuery(catalogQ);
  const exams = useQuery({ queryKey: ["exams"], queryFn: async () => (await supabase.from("exams").select("*,institutions(name)").order("year")).data ?? [] });
  const list = useQuery({ queryKey: ["admin-q"], queryFn: async () => (await supabase.from("questions").select("id,statement,origin,validation,created_at").order("created_at", { ascending: false }).limit(50)).data ?? [] });
  const blank = { subject: "", topic: "", exam: "none", number: "", statement: "", A: "", B: "", C: "", D: "", E: "", correct: "A", explanation: "", skill: "", difficulty: "2", origin: "oficial", source: "", validation: "pendente" };
  const [f, setF] = useState(blank);
  const add = useMutation({ mutationFn: async () => {
    if (f.origin === "oficial" && !f.source) throw new Error("Questões oficiais exigem a fonte original.");
    const q = await run(supabase.from("questions").insert({ subject_id: f.subject || null, topic_id: f.topic || null, exam_id: f.exam === "none" ? null : f.exam, number: f.number ? Number(f.number) : null, statement: f.statement, correct_label: f.correct, explanation: f.explanation, skill: f.skill || null, difficulty: Number(f.difficulty), origin: f.origin as "oficial", source_url: f.source || null, validation: f.validation as "pendente" }).select("id").single());
    await run(supabase.from("question_options").insert(["A", "B", "C", "D", "E"].filter((l) => f[l as "A"]).map((l) => ({ question_id: q!.id, label: l, text: f[l as "A"] }))));
  }, onSuccess: () => { ok(qc, "admin-q")(); setF(blank); }, onError: (e) => toast.error(e.message) });
  const setVal = useMutation({ mutationFn: async ({ id, v }: { id: string; v: string }) => run(supabase.from("questions").update({ validation: v as "validado" }).eq("id", id)), onSuccess: ok(qc, "admin-q") });
  const del = useMutation({ mutationFn: async (id: string) => run(supabase.from("questions").delete().eq("id", id)), onSuccess: ok(qc, "admin-q") });
  return (
    <div className="space-y-4">
      <Card title="Nova questão">
        <div className="grid gap-3 sm:grid-cols-3">
          <Sel label="Matéria" value={f.subject} onChange={(v) => setF({ ...f, subject: v, topic: "" })} items={cat?.subjects.map((s) => [s.id, s.name]) ?? []} />
          <Sel label="Assunto" value={f.topic} onChange={(v) => setF({ ...f, topic: v })} items={cat?.topics.filter((t) => t.subject_id === f.subject).map((t) => [t.id, t.name]) ?? []} />
          <Sel label="Prova" value={f.exam} onChange={(v) => setF({ ...f, exam: v })} items={[["none", "Nenhuma"], ...(exams.data ?? []).map((e) => [e.id, `${(e.institutions as { name: string } | null)?.name} ${e.year}`] as [string, string])]} />
          <Sel label="Origem" value={f.origin} onChange={(v) => setF({ ...f, origin: v })} items={[["oficial", "Oficial"], ["autoral", "Autoral"]]} />
          <Sel label="Dificuldade" value={f.difficulty} onChange={(v) => setF({ ...f, difficulty: v })} items={[["1", "Fácil"], ["2", "Média"], ["3", "Difícil"]]} />
          <Sel label="Validação" value={f.validation} onChange={(v) => setF({ ...f, validation: v })} items={[["pendente", "Pendente"], ["validado", "Validado"]]} />
          <Input placeholder="Nº na prova" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} />
          <Input placeholder="Habilidade avaliada" value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value })} />
          <Input placeholder="URL da fonte original" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} />
        </div>
        <Textarea className="mt-3" rows={4} placeholder="Enunciado" value={f.statement} onChange={(e) => setF({ ...f, statement: e.target.value })} />
        <div className="mt-3 grid gap-2">{["A", "B", "C", "D", "E"].map((l) => <Input key={l} placeholder={`Alternativa ${l}`} value={f[l as "A"]} onChange={(e) => setF({ ...f, [l]: e.target.value })} />)}</div>
        <div className="mt-3 max-w-[160px]"><Sel label="Gabarito" value={f.correct} onChange={(v) => setF({ ...f, correct: v })} items={["A", "B", "C", "D", "E"].map((l) => [l, l])} /></div>
        <Textarea className="mt-3" rows={3} placeholder="Resolução comentada" value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
        <Button className="mt-3" onClick={() => add.mutate()} disabled={!f.statement || !f.A || add.isPending}>Adicionar</Button>
      </Card>
      <Card title="Últimas questões"><ul className="divide-y text-sm">{list.data?.map((q) => <li key={q.id} className="flex items-center gap-2 py-2"><span className="flex-1 truncate">{q.statement}</span><Badge variant="outline">{q.origin}</Badge>
        <Button size="sm" variant="ghost" onClick={() => setVal.mutate({ id: q.id, v: q.validation === "validado" ? "pendente" : "validado" })}>{q.validation}</Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(q.id)}>Excluir</Button></li>)}</ul></Card>
    </div>
  );
}

function Exams() {
  const qc = useQueryClient();
  const inst = useQuery({ queryKey: ["institutions"], queryFn: async () => (await supabase.from("institutions").select("*").order("name")).data ?? [] });
  const exams = useQuery({ queryKey: ["exams"], queryFn: async () => (await supabase.from("exams").select("*,institutions(name)").order("year")).data ?? [] });
  const [f, setF] = useState({ inst: "", year: "", source: "" });
  const add = useMutation({ mutationFn: () => run(supabase.from("exams").insert({ institution_id: f.inst, year: Number(f.year), source_url: f.source || null })), onSuccess: ok(qc, "exams"), onError: (e) => toast.error(e.message) });
  const upd = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => run(supabase.from("exams").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id)), onSuccess: ok(qc, "exams") });
  return (
    <div className="space-y-4">
      <Card title="Nova edição"><div className="grid gap-3 sm:grid-cols-4 sm:items-end"><Sel label="Instituição" value={f.inst} onChange={(v) => setF({ ...f, inst: v })} items={inst.data?.map((i) => [i.id, i.name]) ?? []} />
        <Input placeholder="Ano" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /><Input placeholder="URL oficial" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /><Button onClick={() => add.mutate()} disabled={!f.inst || !f.year}>Adicionar</Button></div></Card>
      <Card title="Edições"><ul className="divide-y text-sm">{exams.data?.map((e) => <li key={e.id} className="flex flex-wrap items-center gap-2 py-2"><span className="flex-1">{(e.institutions as { name: string } | null)?.name} {e.year}</span>
        <Button size="sm" variant="outline" onClick={() => upd.mutate({ id: e.id, patch: { data_available: !e.data_available } })}>{e.data_available ? "Dados disponíveis" : "Indisponível"}</Button>
        <Button size="sm" variant="outline" onClick={() => upd.mutate({ id: e.id, patch: { validation: e.validation === "validado" ? "pendente" : "validado" } })}>{e.validation}</Button></li>)}</ul></Card>
    </div>
  );
}

function Incidence() {
  const qc = useQueryClient(); const { data: cat } = useQuery(catalogQ);
  const exams = useQuery({ queryKey: ["exams"], queryFn: async () => (await supabase.from("exams").select("*,institutions(name)").order("year")).data ?? [] });
  const list = useQuery({ queryKey: ["incidence-admin"], queryFn: async () => (await supabase.from("topic_incidence").select("*,topics(name),exams(year)").order("updated_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ subject: "", topic: "", exam: "", count: "", source: "" });
  const add = useMutation({ mutationFn: () => { if (!f.source) throw new Error("Informe a fonte."); return run(supabase.from("topic_incidence").upsert({ topic_id: f.topic, exam_id: f.exam, question_count: Number(f.count), source_url: f.source, validation: "validado", updated_at: new Date().toISOString() }, { onConflict: "topic_id,exam_id" })); }, onSuccess: ok(qc, "incidence-admin"), onError: (e) => toast.error(e.message) });
  return (
    <div className="space-y-4">
      <Notice>Registre apenas contagens verificadas na prova e gabarito oficiais. Esses dados alimentam a Análise do ENEM.</Notice>
      <Card title="Registrar incidência"><div className="grid gap-3 sm:grid-cols-3">
        <Sel label="Matéria" value={f.subject} onChange={(v) => setF({ ...f, subject: v, topic: "" })} items={cat?.subjects.map((s) => [s.id, s.name]) ?? []} />
        <Sel label="Assunto" value={f.topic} onChange={(v) => setF({ ...f, topic: v })} items={cat?.topics.filter((t) => t.subject_id === f.subject).map((t) => [t.id, t.name]) ?? []} />
        <Sel label="Prova" value={f.exam} onChange={(v) => setF({ ...f, exam: v })} items={(exams.data ?? []).map((e) => [e.id, `${(e.institutions as { name: string } | null)?.name} ${e.year}`] as [string, string])} />
        <Input type="number" placeholder="Nº de questões" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /><Input className="sm:col-span-2" placeholder="URL da fonte" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></div>
        <Button className="mt-3" onClick={() => add.mutate()} disabled={!f.topic || !f.exam || !f.count}>Salvar</Button></Card>
      <Card title="Registros"><ul className="divide-y text-sm">{list.data?.map((r) => <li key={r.id} className="py-2">{(r.topics as { name: string } | null)?.name} · {(r.exams as { year: number } | null)?.year}: <b>{r.question_count}</b></li>)}</ul></Card>
    </div>
  );
}

function Inst() {
  const qc = useQueryClient(); const [f, setF] = useState({ name: "", kind: "vestibular", board: "", website: "" });
  const add = useMutation({ mutationFn: () => run(supabase.from("institutions").insert({ name: f.name, kind: f.kind as "vestibular", board: f.board || null, website: f.website || null })), onSuccess: ok(qc, "institutions"), onError: (e) => toast.error(e.message) });
  return <Card title="Nova instituição / concurso"><div className="grid gap-3 sm:grid-cols-5 sm:items-end"><Input placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
    <Sel label="Tipo" value={f.kind} onChange={(v) => setF({ ...f, kind: v })} items={[["enem", "ENEM"], ["vestibular", "Vestibular"], ["concurso", "Concurso"]]} />
    <Input placeholder="Banca" value={f.board} onChange={(e) => setF({ ...f, board: e.target.value })} /><Input placeholder="Site oficial" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /><Button onClick={() => add.mutate()} disabled={!f.name}>Adicionar</Button></div></Card>;
}

function Topics() {
  const qc = useQueryClient(); const { data: cat } = useQuery(catalogQ); const [f, setF] = useState({ subject: "", name: "" });
  const add = useMutation({ mutationFn: () => run(supabase.from("topics").insert({ subject_id: f.subject, name: f.name })), onSuccess: () => { ok(qc, "catalog")(); setF({ ...f, name: "" }); }, onError: (e) => toast.error(e.message) });
  return <Card title="Novo assunto"><div className="grid gap-3 sm:grid-cols-3 sm:items-end"><Sel label="Matéria" value={f.subject} onChange={(v) => setF({ ...f, subject: v })} items={cat?.subjects.map((s) => [s.id, s.name]) ?? []} />
    <Input placeholder="Nome do assunto" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><Button onClick={() => add.mutate()} disabled={!f.subject || !f.name}>Adicionar</Button></div></Card>;
}

function NewsAdmin() {
  const qc = useQueryClient(); const [f, setF] = useState({ title: "", summary: "", category: "Sociedade", source_name: "", source_url: "", published_at: "" });
  const add = useMutation({ mutationFn: () => run(supabase.from("news").insert(f)), onSuccess: ok(qc, "news"), onError: (e) => toast.error(e.message) });
  return <Card title="Nova notícia"><div className="grid gap-3 sm:grid-cols-2">
    <Input placeholder="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
    <Sel label="Categoria" value={f.category} onChange={(v) => setF({ ...f, category: v })} items={["Redação", "Ciências Humanas", "Geopolítica", "Meio ambiente", "Tecnologia", "Economia", "Sociedade", "Ciência"].map((c) => [c, c])} />
    <Input placeholder="Fonte (ex.: Agência Brasil)" value={f.source_name} onChange={(e) => setF({ ...f, source_name: e.target.value })} /><Input placeholder="URL da fonte" value={f.source_url} onChange={(e) => setF({ ...f, source_url: e.target.value })} />
    <Input type="date" value={f.published_at} onChange={(e) => setF({ ...f, published_at: e.target.value })} /></div>
    <Textarea className="mt-3" placeholder="Resumo" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
    <Button className="mt-3" onClick={() => add.mutate()} disabled={!f.title || !f.source_url || !f.published_at || !f.summary}>Publicar</Button></Card>;
}

function Users() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: async () => {
    const [p, r] = await Promise.all([supabase.from("profiles").select("id,full_name,xp,exam_name,created_at").order("created_at", { ascending: false }), supabase.from("user_roles").select("user_id,role")]);
    return (p.data ?? []).map((u) => ({ ...u, admin: (r.data ?? []).some((x) => x.user_id === u.id && x.role === "admin") }));
  } });
  const toggle = useMutation({ mutationFn: async (u: { id: string; admin: boolean }) => u.admin ? run(supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin")) : run(supabase.from("user_roles").insert({ user_id: u.id, role: "admin" })), onSuccess: ok(qc, "admin-users"), onError: (e) => toast.error(e.message) });
  return <Card title="Estudantes"><ul className="divide-y text-sm">{users.data?.map((u) => <li key={u.id} className="flex items-center gap-2 py-2"><span className="flex-1">{u.full_name}</span><span className="text-xs text-muted-foreground">{u.exam_name} · {u.xp} XP</span>
    <Button size="sm" variant="outline" onClick={() => toggle.mutate(u)}>{u.admin ? "Remover admin" : "Tornar admin"}</Button></li>)}</ul></Card>;
}
