import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uid } from "@/lib/data";
import { correctEssay } from "@/lib/ai.functions";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/redacao")({
  head: () => ({ meta: [{ title: "Redação — APROVA+" }, { name: "description", content: "Guia da redação do ENEM e correção por competência com IA." }] }),
  component: Essay,
});

const COMP = [
  ["1", "Domínio da norma padrão", "Escrita formal, ortografia, concordância, regência e pontuação."],
  ["2", "Compreensão da proposta", "Abordar o tema completo no tipo dissertativo-argumentativo, com repertório legitimado e produtivo."],
  ["3", "Seleção e organização de argumentos", "Projeto de texto claro, argumentos desenvolvidos e em defesa de um ponto de vista."],
  ["4", "Coesão", "Uso de conectivos e mecanismos linguísticos entre e dentro dos parágrafos."],
  ["5", "Proposta de intervenção", "Agente, ação, modo/meio, finalidade e detalhamento, respeitando os direitos humanos."],
];
// Official ENEM themes (publicly announced by INEP)
const PAST = [
  [2024, "Desafios para a valorização da herança africana no Brasil"],
  [2023, "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil"],
  [2022, "Desafios para a valorização de comunidades e povos tradicionais no Brasil"],
  [2021, "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil"],
  [2020, "O estigma associado às doenças mentais na sociedade brasileira"],
  [2019, "Democratização do acesso ao cinema no Brasil"],
];
const TRAIN = ["Os impactos da inteligência artificial no mercado de trabalho brasileiro", "Caminhos para combater a insegurança alimentar no Brasil", "Desafios da mobilidade urbana nas grandes cidades brasileiras", "A desinformação nas redes sociais e seus efeitos na democracia", "Saúde mental dos jovens na era digital"];
const CONN = { "Adição": "além disso, ademais, outrossim", "Oposição": "entretanto, contudo, todavia, no entanto", "Causa": "porque, visto que, uma vez que", "Conclusão": "portanto, logo, dessa forma, assim", "Exemplificação": "por exemplo, a saber, como" };

type Result = { total: number; competencias: { numero: number; nome: string; nota: number; comentario: string; melhorias: string[] }[]; comentario_geral: string; pontos_fortes: string[] };

function Essay() {
  const qc = useQueryClient();
  const [theme, setTheme] = useState(TRAIN[0]); const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const fn = useServerFn(correctEssay);
  const m = useMutation({ mutationFn: () => fn({ data: { theme, content: text } }), onSuccess: (r) => { setRes(r as Result); qc.invalidateQueries({ queryKey: ["essays"] }); }, onError: (e) => toast.error(e.message) });
  const hist = useQuery({ queryKey: ["essays"], queryFn: async () => (await supabase.from("essays").select("id,theme,total,created_at,scores,content").eq("user_id", await uid()).order("created_at", { ascending: false })).data ?? [] });
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <PageHeader title="Redação ENEM" subtitle="Aprenda a estrutura e treine com correção por competência." />
      <Tabs defaultValue="corrigir">
        <TabsList className="mb-4 flex-wrap"><TabsTrigger value="corrigir">Corretor IA</TabsTrigger><TabsTrigger value="guia">Guia</TabsTrigger><TabsTrigger value="temas">Temas</TabsTrigger><TabsTrigger value="historico">Minhas redações</TabsTrigger></TabsList>
        <TabsContent value="corrigir" className="space-y-4">
          <Card>
            <label className="text-xs text-muted-foreground">Tema</label><Input value={theme} onChange={(e) => setTheme(e.target.value)} className="mb-3" />
            <Textarea rows={16} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua redação dissertativo-argumentativa (até 30 linhas)..." />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{words} palavras</span>
              <Button variant="brand" onClick={() => m.mutate()} disabled={m.isPending || text.length < 300}>{m.isPending ? "Corrigindo..." : "Corrigir redação"}</Button></div>
          </Card>
          <Notice tone="warn">A avaliação da IA é uma <b>estimativa</b> para treino e não substitui nem equivale à nota oficial do INEP.</Notice>
          {res && <ResultView r={res} />}
        </TabsContent>
        <TabsContent value="guia" className="grid gap-4 md:grid-cols-2">
          <Card title="Estrutura"><div className="space-y-2 text-sm"><p><b>Introdução:</b> contextualização + tese + anúncio dos argumentos.</p><p><b>Desenvolvimento (2 parágrafos):</b> tópico frasal, repertório sociocultural, explicação e fechamento.</p><p><b>Conclusão:</b> retomada da tese + proposta de intervenção completa (agente, ação, meio, finalidade, detalhamento).</p></div></Card>
          <Card title="As cinco competências"><ul className="space-y-2 text-sm">{COMP.map(([n, t, d]) => <li key={n}><b>C{n} — {t}:</b> <span className="text-muted-foreground">{d}</span></li>)}</ul></Card>
          <Card title="Conectivos"><ul className="space-y-1 text-sm">{Object.entries(CONN).map(([k, v]) => <li key={k}><b>{k}:</b> {v}</li>)}</ul></Card>
          <Card title="Repertório e redações nota 1000"><p className="text-sm text-muted-foreground">Use repertório legitimado (leis, dados de órgãos oficiais, obras, pensadores) e relacione-o ao argumento. Exemplos de redações nota 1000 são divulgados pelo INEP na <a className="text-brand underline" target="_blank" rel="noreferrer" href="https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica">Cartilha do Participante</a> — consulte a fonte oficial.</p></Card>
        </TabsContent>
        <TabsContent value="temas" className="grid gap-4 md:grid-cols-2">
          <Card title="Temas anteriores do ENEM"><ul className="space-y-2 text-sm">{PAST.map(([y, t]) => <li key={y}><b>{y}:</b> {t} <button className="text-xs text-brand" onClick={() => setTheme(String(t))}>usar</button></li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Temas de 2025 e 2026 serão adicionados após confirmação na fonte oficial do INEP.</p></Card>
          <Card title="Temas de treinamento (não oficiais)"><ul className="space-y-2 text-sm">{TRAIN.map((t) => <li key={t}>{t} <button className="text-xs text-brand" onClick={() => setTheme(t)}>usar</button></li>)}</ul></Card>
        </TabsContent>
        <TabsContent value="historico">
          <Card>{hist.data?.length ? <ul className="divide-y text-sm">{hist.data.map((e) => <li key={e.id} className="flex justify-between gap-3 py-2"><span className="truncate">{e.theme}</span><span className="whitespace-nowrap"><b>{e.total}</b> · {new Date(e.created_at!).toLocaleDateString("pt-BR")}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma redação ainda.</p>}</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultView({ r }: { r: Result }) {
  return (
    <Card title={`Estimativa: ${r.total} / 1000`}>
      <div className="space-y-4">{r.competencias.map((c) => (
        <div key={c.numero}><div className="flex justify-between text-sm font-medium"><span>C{c.numero} — {c.nome}</span><span>{c.nota}/200</span></div>
          <Progress value={(c.nota / 200) * 100} className="my-1.5" /><p className="text-sm text-muted-foreground">{c.comentario}</p>
          {c.melhorias?.length > 0 && <ul className="ml-5 mt-1 list-disc text-sm">{c.melhorias.map((m, i) => <li key={i}>{m}</li>)}</ul>}</div>))}
        <div className="rounded-xl bg-muted p-4 text-sm">{r.comentario_geral}</div>
      </div>
    </Card>
  );
}
