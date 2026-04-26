/**
 * Display labels and accent colors for interview difficulty levels.
 * Shared between the dashboard, the live interview screen and the results page
 * so the badge looks identical everywhere.
 */
export interface DifficultyDisplay {
  label: string;
  color: string;
  bg: string;
}

export const DIFFICULTY_LABELS: Record<string, DifficultyDisplay> = {
  junior: { label: "Junior", color: "#4ade80", bg: "rgba(34, 197, 94, 0.12)" },
  intermediate: {
    label: "Mid-Level",
    color: "#facc15",
    bg: "rgba(234, 179, 8, 0.12)",
  },
  senior: { label: "Senior", color: "#f87171", bg: "rgba(239, 68, 68, 0.12)" },
};

export function getDifficultyDisplay(value?: string | null): DifficultyDisplay | null {
  if (!value) return null;
  return DIFFICULTY_LABELS[value] ?? { label: value, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)" };
}
