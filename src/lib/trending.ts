import type { DreamRow } from "./types";

export function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// "Hot" ranking: engagement divided by age, so fresh dreams rise and old ones fade.
export function rankByHeat(rows: DreamRow[], limit: number) {
  const now = Date.now();
  const score = (d: DreamRow) => {
    const hours = (now - new Date(d.created_at).getTime()) / 3_600_000;
    return (1 + d.reaction_count + d.comment_count * 2 + d.view_count * 0.1) / Math.pow(hours + 2, 1.3);
  };
  return [...rows].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
