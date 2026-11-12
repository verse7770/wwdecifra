import { supabase } from "@/integrations/supabase/client";
export type Q = { id: string; statement: string; correct_label: string; explanation: string | null; difficulty: number | null; skill: string | null; origin: "oficial" | "autoral" | "ia"; validation: string; source_url: string | null; subject_id: string | null; topic_id: string | null; exam_id: string | null; question_options: { label: string; text: string }[]; exams: { year: number; institutions: { name: string } | null } | null };
export const Q_SELECT = "id,statement,correct_label,explanation,difficulty,skill,origin,validation,source_url,subject_id,topic_id,exam_id,question_options(label,text),exams(year,institutions(name))";
export async function fetchQuestionsByIds(ids: string[]) {
  if (!ids.length) return [] as Q[];
  const { data, error } = await supabase.from("questions").select(Q_SELECT).in("id", ids);
  if (error) throw error;
  const m = new Map((data as unknown as Q[]).map((q) => [q.id, q]));
  return ids.map((i) => m.get(i)).filter(Boolean) as Q[];
}
export const ORIGIN_LABEL = { oficial: "Oficial", autoral: "Autoral", ia: "Treino gerado por IA" } as const;
