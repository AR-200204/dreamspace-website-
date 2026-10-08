export const MOODS = [
  { value: "scared", label: "Scared", emoji: "😨" },
  { value: "peaceful", label: "Peaceful", emoji: "😌" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "happy", label: "Happy", emoji: "😍" },
  { value: "confused", label: "Confused", emoji: "😮" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "mysterious", label: "Mysterious", emoji: "🌑" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

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
