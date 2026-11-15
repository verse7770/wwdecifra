import { describe, expect, it } from "vitest";
import { mastery, priorityFromIncidence, level } from "@/lib/data";

describe("study rules", () => {
  it("never assigns a priority without validated editions", () => {
    expect(priorityFromIncidence(0, 0, 0)).toBeNull();
  });
  it("assigns Muito alta when a topic appears in every edition with 3+ questions each", () => {
    expect(priorityFromIncidence(3, 3, 9)).toBe("Muito alta");
  });
  it("assigns Alta for 2 of 3 editions and Baixa for under a third", () => {
    expect(priorityFromIncidence(2, 3, 4)).toBe("Alta");
    expect(priorityFromIncidence(0, 3, 0)).toBe("Baixa");
  });
  it("does not mark a topic as mastered after a single correct answer", () => {
    expect(mastery(1, 1).label).not.toBe("Dominado");
    expect(mastery(0, 0).label).toBe("Sem dados");
  });
  it("starts at level 1 and reaches level 2 at 50 XP", () => {
    expect(level(0).lvl).toBe(1);
    expect(level(50).lvl).toBe(2);
  });
});
