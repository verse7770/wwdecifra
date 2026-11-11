import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return data.user.id;
}

export const profileQ = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
});

export const isAdminQ = queryOptions({
  queryKey: ["isAdmin"],
  queryFn: async () => {
    const id = await uid();
    const { data } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
    return !!data;
  },
});

export const catalogQ = queryOptions({
  queryKey: ["catalog"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const [areas, subjects, topics] = await Promise.all([
      supabase.from("areas").select("*").order("sort"),
      supabase.from("subjects").select("*").order("sort"),
      supabase.from("topics").select("*").order("sort"),
    ]);
    return { areas: areas.data ?? [], subjects: subjects.data ?? [], topics: topics.data ?? [] };
  },
});

export type AnswerRow = { is_correct: boolean; time_seconds: number | null; created_at: string; question_id: string; simulation_id: string | null; questions: { subject_id: string | null; topic_id: string | null } | null };

export const answersQ = queryOptions({
  queryKey: ["answers"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("answers").select("is_correct,time_seconds,created_at,question_id,simulation_id,questions(subject_id,topic_id)").eq("user_id", id).order("created_at").limit(5000);
    if (error) throw error;
    return (data ?? []) as unknown as AnswerRow[];
  },
});

export const sessionsQ = queryOptions({
  queryKey: ["sessions"],
  queryFn: async () => {
    const id = await uid();
    const { data } = await supabase.from("study_sessions").select("*").eq("user_id", id).order("studied_on");
    return data ?? [];
  },
});

export function level(xp: number) {
  const lvl = Math.floor(Math.sqrt(xp / 50)) + 1;
  const cur = (lvl - 1) ** 2 * 50, next = lvl ** 2 * 50;
  return { lvl, progress: Math.round(((xp - cur) / (next - cur)) * 100), next };
}

export function streak(dates: string[]) {
  const set = new Set(dates.map((d) => d.slice(0, 10)));
  let n = 0; const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function mastery(correct: number, total: number) {
  if (total === 0) return { label: "Sem dados", pct: 0 };
  // Laplace-smoothed so 1/1 doesn't read as full mastery
  const pct = Math.round(((correct + 1) / (total + 2)) * 100);
  return { pct, label: pct >= 80 ? "Dominado" : pct >= 60 ? "Em progresso" : "Precisa de atenção" };
}

export function priorityFromIncidence(editionsWith: number, editionsTotal: number, totalQuestions: number) {
  if (editionsTotal === 0) return null;
  const share = editionsWith / editionsTotal;
  if (share >= 1 && totalQuestions >= editionsTotal * 3) return "Muito alta";
  if (share >= 0.66) return "Alta";
  if (share >= 0.33) return "Média";
  return "Baixa";
}
