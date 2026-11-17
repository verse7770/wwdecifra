export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="var(--logo-tile)" />
      <path d="M10 20 L18 44 L25 26 L32 44 L39 26" fill="none" stroke="var(--brand)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 20 L32 40 L39 22 L46 44 L54 20" fill="none" stroke="var(--logo-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
    </svg>
  );
}

export function Logo({ className = "", showMark = true }: { className?: string; showMark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight ${className}`}>
      {showMark && <LogoMark className="size-8 shrink-0" />}
      <span><span className="text-brand">WW</span> DECIFRA</span>
    </span>
  );
}
