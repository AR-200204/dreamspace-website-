import type { ProfileStats } from "./types";

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

// Badges are calculated from PUBLIC activity only, so they never hint at anonymous dreams.
export function earnedBadges(s: ProfileStats): Badge[] {
  const all: Array<Badge & { earned: boolean }> = [
    { id: "first", emoji: "🌙", name: "First Dream", description: "Shared a first public dream", earned: s.dreams >= 1 },
    { id: "ten", emoji: "📝", name: "10 Dreams", description: "Shared 10 public dreams", earned: s.dreams >= 10 },
    { id: "talk", emoji: "💬", name: "Conversation Starter", description: "Joined 10 discussions", earned: s.comments >= 10 },
    { id: "explorer", emoji: "🔮", name: "Dream Explorer", description: "Reacted to 20 dreams", earned: s.reactions_given >= 20 },
    { id: "trending", emoji: "🔥", name: "Trending Dream", description: "A dream got 10+ reactions", earned: s.best_dream_reactions >= 10 },
    { id: "recurring", emoji: "🌌", name: "Recurring Dreamer", description: "Shared 3 recurring dreams", earned: s.recurring_dreams >= 3 },
  ];
  return all.filter((b) => b.earned).map((b) => ({ id: b.id, emoji: b.emoji, name: b.name, description: b.description }));
}
