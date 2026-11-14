import { useState } from "react";
import { Star, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "./Markdown";
import { ORIGIN_LABEL, type Q } from "@/lib/questions";

export function QuestionMeta({ q }: { q: Q }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      <Badge variant={q.origin === "oficial" ? "default" : "secondary"}>{ORIGIN_LABEL[q.origin]}</Badge>
      {q.exams && <Badge variant="outline">{q.exams.institutions?.name} {q.exams.year}</Badge>}
      {q.difficulty && <Badge variant="outline">{["", "Fácil", "Média", "Difícil"][q.difficulty]}</Badge>}
      {q.skill && <Badge variant="outline" className="max-w-[16rem] truncate">{q.skill}</Badge>}
      {q.validation !== "validado" && <Badge variant="outline" className="border-warning/60">Não validada</Badge>}
    </div>
  );
}

export function QuestionCard({ q, onAnswer, favorite, onToggleFav, revealed: revealedProp, chosen: chosenProp, practice = true }: {
  q: Q; onAnswer?: ((label: string, correct: boolean) => void) | undefined; favorite?: boolean | undefined; onToggleFav?: (() => void) | undefined; revealed?: boolean | undefined; chosen?: string | null | undefined; practice?: boolean | undefined;
}) {
  const [chosen, setChosen] = useState<string | null>(chosenProp ?? null);
  const [revealed, setRevealed] = useState(false);
  const show = revealedProp ?? revealed;
  const sel = chosenProp !== undefined ? chosenProp : chosen;
  const opts = [...q.question_options].sort((a, b) => a.label.localeCompare(b.label));
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2"><QuestionMeta q={q} />
        {onToggleFav && <Button variant="ghost" size="icon" onClick={onToggleFav} aria-label="Favoritar"><Star className={favorite ? "fill-warning text-warning" : ""} /></Button>}</div>
      <div className="whitespace-pre-line text-[15px] leading-relaxed">{q.statement}</div>
      <div className="space-y-2">
        {opts.map((o) => {
          const isC = o.label === q.correct_label; const isSel = sel === o.label;
          const cls = show ? (isC ? "border-success bg-success/10" : isSel ? "border-destructive bg-destructive/10" : "opacity-70") : isSel ? "border-brand bg-brand/10" : "hover:border-brand/50";
          return (
            <button key={o.label} disabled={show && practice} onClick={() => { if (practice && show) return; setChosen(o.label); if (!practice) onAnswer?.(o.label, isC); }}
              className={`flex w-full gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${cls}`}>
              <span className="font-display font-bold">{o.label}</span><span className="flex-1">{o.text}</span>
              {show && isC && <CheckCircle2 className="size-4 text-success" />}{show && isSel && !isC && <XCircle className="size-4 text-destructive" />}
            </button>);
        })}
      </div>
      {practice && !show && <Button variant="brand" disabled={!sel} onClick={() => { setRevealed(true); onAnswer?.(sel!, sel === q.correct_label); }}>Responder</Button>}
      {show && q.explanation && <div className="rounded-xl bg-muted p-4"><div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Resolução comentada</div><Markdown text={q.explanation} /></div>}
      {show && q.source_url && <a href={q.source_url} target="_blank" rel="noreferrer" className="text-xs text-brand underline">Fonte original</a>}
    </div>
  );
}
