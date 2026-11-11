export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight ${className}`}>
      APROVA<span className="text-brand">+</span>
    </span>
  );
}
