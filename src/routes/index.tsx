import { createFileRoute, Link } from "@tanstack/react-router";
import { Radar, BarChart3, Route as RouteIcon, ListChecks, Crosshair, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { ThemeToggle } from "@/components/app/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "WW DECIFRA — Não decore. Decifre." },
    { name: "description", content: "Plataforma inteligente para ENEM, vestibulares e concursos: saiba o que mais cai, onde você erra e como evoluir." },
    { property: "og:title", content: "WW DECIFRA — Não decore. Decifre." },
    { property: "og:description", content: "Inteligência de Provas, Decifra IA e uma jornada de estudos que se adapta ao seu desempenho." },
  ] }),
  component: Landing,
});

const QUESTIONS = ["O que preciso estudar?", "O que mais cai na prova?", "Onde estou errando?", "Como organizo minha preparação?"];
const F = [
  { i: BarChart3, t: "Inteligência de Provas", d: "Frequência por matéria e assunto nas edições analisadas, com fonte oficial — sem estatística inventada." },
  { i: Sparkles, t: "Decifra IA", d: "Seu professor particular: explica do zero, resolve passo a passo e identifica suas dificuldades." },
  { i: RouteIcon, t: "Minha Jornada", d: "Cronograma que dá mais peso ao que você erra, com revisão espaçada." },
  { i: ListChecks, t: "Central de Questões", d: "Filtros por matéria, assunto e dificuldade, com resolução comentada." },
  { i: Crosshair, t: "Desafios Decifra", d: "Simulados cronometrados com relatório do que você domina e do que precisa revisar." },
  { i: PenLine, t: "Laboratório de Redação", d: "Estimativa por competência (0–200) com sugestões objetivas de melhoria." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero text-hero-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Logo /><div className="flex items-center gap-2"><ThemeToggle /><Button asChild variant="heroOutline" size="sm"><Link to="/auth" search={{ redirect: undefined }}>Entrar</Link></Button></div></div>
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 sm:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-hero-foreground/20 px-3 py-1 text-xs uppercase tracking-[0.2em] opacity-80"><Radar className="size-3.5" />ENEM · Vestibulares · Concursos</p>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl animate-rise">Não decore.<br /><span className="text-brand">Decifre.</span></h1>
          <p className="mt-6 max-w-xl text-lg opacity-80">A WW DECIFRA lê as provas, entende seu desempenho e mostra exatamente onde focar.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild variant="hero" size="lg"><Link to="/auth" search={{ redirect: undefined }}>Começar minha jornada</Link></Button></div>
          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">{QUESTIONS.map((q) => <div key={q} className="rounded-xl border border-hero-foreground/15 bg-hero-foreground/5 p-3 text-sm">{q}</div>)}</div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {F.map(({ i: I, t, d }) => (
          <div key={t} className="rounded-2xl border bg-card p-6 shadow-card"><I className="size-6 text-brand" /><h3 className="mt-4 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">WW DECIFRA — Não decore. Decifre. · Frequência histórica não é previsão; estimativas da IA não equivalem a notas oficiais.</footer>
    </div>
  );
}
