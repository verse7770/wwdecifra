import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Notice } from "@/components/app/AppShell";
import { Card } from "@/components/app/Stat";
import { Sel } from "@/components/app/Sel";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/outras-provas")({
  head: () => ({ meta: [{ title: "Outras provas — WW DECIFRA" }, { name: "description", content: "Vestibulares e concursos públicos." }] }),
  component: Other,
});

function Other() {
  const [kind, setKind] = useState("all"); const [board, setBoard] = useState("all");
  const inst = useQuery({ queryKey: ["institutions"], queryFn: async () => (await supabase.from("institutions").select("*,exams(id,year,data_available,validation,source_url)").order("name")).data ?? [] });
  const boards = [...new Set((inst.data ?? []).map((i) => i.board).filter(Boolean))] as string[];
  const list = (inst.data ?? []).filter((i) => (kind === "all" || i.kind === kind) && (board === "all" || i.board === board));
  return (
    <div className="space-y-6">
      <PageHeader title="Outras provas" subtitle="Vestibulares, concursos federais, estaduais e municipais." />
      <div className="grid max-w-lg gap-3 sm:grid-cols-2">
        <Sel label="Tipo" value={kind} onChange={setKind} items={[["all", "Todos"], ["enem", "ENEM"], ["vestibular", "Vestibular"], ["concurso", "Concurso"]]} />
        <Sel label="Banca" value={board} onChange={setBoard} items={[["all", "Todas"], ...boards.map((b) => [b, b] as [string, string])]} />
      </div>
      <Notice tone="warn">Nenhum edital é exibido como vigente sem verificação. Consulte sempre o site oficial da instituição ou banca antes de se inscrever.</Notice>
      <div className="grid gap-4 md:grid-cols-2">{list.map((i) => (
        <Card key={i.id} title={i.name} action={<Badge variant="outline">{i.kind}</Badge>}>
          <p className="text-sm text-muted-foreground">Banca: {i.board ?? "—"}</p>
          <p className="mt-2 text-sm">Edições cadastradas: {(i.exams as { year: number }[]).map((e) => e.year).join(", ") || "nenhuma ainda"}</p>
          {i.website && <a href={i.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand">Site oficial <ExternalLink className="size-3" /></a>}
        </Card>))}
        {!list.length && <p className="text-sm text-muted-foreground">Nenhuma prova cadastrada com esses filtros. A administração adiciona concursos após verificar o edital oficial.</p>}
      </div>
    </div>
  );
}
