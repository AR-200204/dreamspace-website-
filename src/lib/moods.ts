export const MOODS = [
  { value: "scared", color: "#ff7a6b", label: "Scared", emoji: "😨" },
  { value: "peaceful", color: "#5fd6c4", label: "Peaceful", emoji: "😌" },
  { value: "sad", color: "#6b8cff", label: "Sad", emoji: "😢" },
  { value: "happy", color: "#ffd27a", label: "Happy", emoji: "😍" },
  { value: "confused", color: "#c08bff", label: "Confused", emoji: "😮" },
  { value: "excited", color: "#ff8fd0", label: "Excited", emoji: "🤩" },
  { value: "neutral", color: "#9aa0c8", label: "Neutral", emoji: "😐" },
  { value: "mysterious", color: "#8a84ff", label: "Mysterious", emoji: "🌑" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export const DEFAULT_MOOD_COLOR = "#b9a8ff";

export function getMood(value: string | null | undefined) {
  return MOODS.find((m) => m.value === value) ?? null;
}

export const REACTIONS = [
  { value: "love", label: "Love", emoji: "❤️" },
  { value: "interesting", label: "Interesting", emoji: "😮" },
  { value: "scary", label: "Scary", emoji: "😨" },
  { value: "funny", label: "Funny", emoji: "😂" },
  { value: "thoughtful", label: "Thought-provoking", emoji: "🤔" },
] as const;

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "sexual", label: "Sexual content" },
  { value: "violence", label: "Violence" },
  { value: "hate", label: "Hate speech" },
  { value: "self_harm", label: "Self-harm" },
  { value: "illegal", label: "Illegal content" },
  { value: "other", label: "Other" },
] as const;
