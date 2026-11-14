import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { explainNews } from "@/lib/ai.functions";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/atualidades")({
  head: () => ({ meta: [{ title: "Atualidades — APROVA+" }, { name: "description", content: "Temas atuais explicados para a prova." }] }),
  component: News,
});
const CATS: string[] = ["Todas", "Redação", "Ciências Humanas", "Geopolítica", "Meio ambiente", "Tecnologia", "Economia", "Sociedade", "Ciência"];

function News() {
  const [cat, setCat] = useState("Todas"); const [exp, setExp] = useState<Record<string, string>>({});
  const news = useQuery({ queryKey: ["news"], queryFn: async () => (await supabase.from("news").select("*").order("published_at", { ascending: false })).data ?? [] });
  const fn = useServerFn(explainNews);
  const m = useMutation({ mutationFn: (n: { id: string; title: string; summary: string }) => fn({ data: n }).then((r) => ({ id: n.id, r: r.reply })), onSuccess: ({ id, r }) => setExp((e) => ({ ...e, [id]: r })), onError: (e) => toast.error(e.message) });
  const list = (news.data ?? []).filter((n) => cat === "Todas" || n.category === cat);
  return (
    <div className="space-y-6">
      <PageHeader title="Atualidades" subtitle="Notícias de fontes confiáveis conectadas aos conteúdos da prova." />
      <div className="flex flex-wrap gap-2">{CATS.map((c) => <Button key={c} size="sm" variant={c === cat ? "default" : "outline"} onClick={() => setCat(c)}>{c}</Button>)}</div>
      {!list.length ? <Notice>Nenhuma notícia publicada ainda. A equipe adiciona notícias com fonte e data pelo painel administrativo.</Notice> :
        list.map((n) => (
          <Card key={n.id} title={n.title}>
            <p className="text-xs text-muted-foreground">{n.category} · {new Date(n.published_at).toLocaleDateString("pt-BR")} · <a href={n.source_url} target="_blank" rel="noreferrer" className="text-brand underline">{n.source_name}</a></p>
            <p className="mt-2 text-sm">{n.summary}</p>
            {exp[n.id] ? <div className="mt-3 rounded-xl bg-muted p-4"><Markdown text={exp[n.id]} /></div> :
              <Button size="sm" variant="outline" className="mt-3" disabled={m.isPending} onClick={() => m.mutate(n)}>Como isso cai na prova?</Button>}
          </Card>))}
    </div>
  );
}
