import type React from "react";
import type { LucideIcon } from "lucide-react";
export function Stat({ icon: Icon, label, value, hint, tone = "brand" }: { icon: LucideIcon; label: string; value: string | number; hint?: string; tone?: "brand" | "success" | "destructive" | "warning" }) {
  const c = { brand: "text-brand bg-brand/10", success: "text-success bg-success/10", destructive: "text-destructive bg-destructive/10", warning: "text-warning bg-warning/15" }[tone];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card animate-rise">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${c}`}><Icon className="size-4" /></div>
      <div className="text-2xl font-bold font-display">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
export function Card({ title, children, action, className = "" }: { title?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-card p-5 shadow-card animate-rise ${className}`}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}
