import type React from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Sparkles, CalendarDays, BookOpen, BarChart3, ListChecks, Timer, PenLine, Landmark, TrendingUp, User, Shield, Newspaper, LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminQ, profileQ, level } from "@/lib/data";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const NAV = [
  { to: "/dashboard", label: "Painel", short: "Painel", icon: Home },
  { to: "/plano", label: "Minha Jornada", icon: CalendarDays },
  { to: "/materias", label: "Matérias", icon: BookOpen },
  { to: "/analise", label: "Inteligência de Provas", icon: BarChart3 },
  { to: "/questoes", label: "Central de Questões", short: "Questões", icon: ListChecks },
  { to: "/simulados", label: "Desafios Decifra", icon: Timer },
  { to: "/redacao", label: "Laboratório de Redação", icon: PenLine },
  { to: "/professor", label: "Decifra IA", short: "Decifra IA", icon: Sparkles },
  { to: "/outras-provas", label: "Outras provas", icon: Landmark },
  { to: "/atualidades", label: "Radar de Atualidades", icon: Newspaper },
  { to: "/desempenho", label: "Minha Evolução", short: "Evolução", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

const BOTTOM = ["/dashboard", "/questoes", "/professor", "/desempenho"] as const;

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { data: isAdmin } = useQuery(isAdminQ);
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}>
          <Icon className="size-4" />{label}
        </Link>
      ))}
      {isAdmin && (
        <Link to="/admin" onClick={onNavigate} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-primary hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent" }}>
          <Shield className="size-4" />Administração
        </Link>
      )}
    </nav>
  );
}

export function AppShell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQ);
  const [open, setOpen] = useState(false);
  const lv = level(profile?.xp ?? 0);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
      <Link to="/dashboard" className="px-2 pt-1 text-sidebar-accent-foreground" onClick={onNavigate}><Logo /></Link>
      <div className="flex-1 overflow-y-auto"><NavLinks onNavigate={onNavigate} /></div>
      <div className="rounded-xl bg-sidebar-accent p-3 text-xs">
        <div className="flex justify-between font-semibold text-sidebar-accent-foreground"><span>Nível {lv.lvl}</span><span>{profile?.xp ?? 0} XP</span></div>
        <div className="mt-2 h-1.5 rounded-full bg-sidebar-border"><div className="h-full rounded-full bg-sidebar-primary transition-all" style={{ width: `${lv.progress}%` }} /></div>
        <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"><LogOut className="size-3.5" />Sair</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar()}</aside>
      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-2.5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Menu"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 p-0">{sidebar(() => setOpen(false))}</SheetContent>
            </Sheet>
            <Logo />
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">Olá, <span className="font-semibold text-foreground">{profile?.full_name?.split(" ")[0] ?? "estudante"}</span></div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 backdrop-blur lg:hidden">
        {NAV.filter((n) => (BOTTOM as readonly string[]).includes(n.to)).map((n) => { const { to, icon: Icon } = n; const label = "short" in n ? n.short : n.label; return (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-brand" }}>
            <Icon className="size-5" />{label}
          </Link>
        ); })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"><Menu className="size-5" />Mais</button>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 animate-rise sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>
      {children}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tone === "warn" ? "border-warning/50 bg-warning/10" : "border-brand/30 bg-brand/5"}`}>{children}</div>;
}
