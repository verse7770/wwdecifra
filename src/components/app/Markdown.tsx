// Minimal safe markdown renderer (no HTML injection): headings, bold, italics, lists, code.
import type React from "react";
function inline(t: string): React.ReactNode[] {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("`") ? <code key={i} className="rounded bg-muted px-1">{p.slice(1, -1)}</code> : p.startsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p);
}
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n"); const out: React.ReactNode[] = []; let list: string[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={out.length} className="ml-5 list-disc space-y-1">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  for (const l of lines) {
    const m = l.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (m) { list.push(m[1] ?? ""); continue; }
    flush();
    if (/^#{1,6}\s/.test(l)) out.push(<h4 key={out.length} className="mt-3 font-semibold">{inline(l.replace(/^#+\s/, ""))}</h4>);
    else if (l.trim()) out.push(<p key={out.length}>{inline(l)}</p>);
  }
  flush();
  return <div className="space-y-2 text-sm leading-relaxed">{out}</div>;
}
