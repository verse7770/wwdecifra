import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, BarChart3, CalendarDays, PenLine, ListChecks, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { ThemeToggle } from "@/components/app/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "APROVA+ — Estude para ENEM, vestibulares e concursos com IA" },
    { name: "description", content: "Professor particular com IA, banco de questões, simulados, correção de redação e plano de estudos adaptativo." },
    { property: "og:title", content: "APROVA+ — Estude com inteligência" },
    { property: "og:description", content: "Professor IA, simulados, redação e plano adaptativo para ENEM e vestibulares." },
  ] }),
  component: Landing,
});

const F = [
  { i: Bot, t: "Professor IA 24h", d: "Explicações do básico ao avançado e o modo Aprender do Zero." },
  { i: BarChart3, t: "Análise de provas", d: "Incidência por assunto baseada apenas em dados oficiais validados." },
  { i: CalendarDays, t: "Plano adaptativo", d: "Cronograma que reforça o que você mais erra, com revisão espaçada." },
  { i: ListChecks, t: "Banco de questões", d: "Filtros por matéria, assunto e dificuldade, com resolução comentada." },
  { i: Timer, t: "Simulados", d: "Cronômetro, navegação, marcação e relatório detalhado." },
  { i: PenLine, t: "Correção de redação", d: "Estimativa por competência (0–200) com sugestões de melhoria." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-hero-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Logo /><div className="flex items-center gap-2"><ThemeToggle /><Button asChild variant="heroOutline" size="sm"><Link to="/auth" search={{ redirect: undefined }}>Entrar</Link></Button></div></div>
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-14 sm:pt-20">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl animate-rise">Sua aprovação, estudada com método.</h1>
          <p className="mt-6 max-w-xl text-lg opacity-80">Cursinho, professor particular e planejador inteligente em um só lugar — para ENEM, vestibulares e concursos.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild variant="hero" size="lg"><Link to="/auth" search={{ redirect: undefined }}>Começar grátis</Link></Button></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {F.map(({ i: I, t, d }) => (
          <div key={t} className="rounded-2xl border bg-card p-6 shadow-card"><I className="size-6 text-brand" /><h3 className="mt-4 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">APROVA+ · Estimativas da IA não equivalem a notas oficiais do INEP.</footer>
    </div>
  );
}
