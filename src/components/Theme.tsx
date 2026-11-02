// Marks a page with its own sky and accent colour. The colours live in globals.css (THEMES).
// It renders nothing visible; CSS reads it with :has(), so it works on the server with no flash.
export type ThemeName =
  | "night" | "aurora" | "ember" | "observatory" | "twilight" | "lantern" | "dawn" | "slate"
  | `mood-${"scared" | "peaceful" | "sad" | "happy" | "confused" | "excited" | "neutral" | "mysterious"}`;

export function Theme({ name }: { name: ThemeName }) {
  return <span hidden data-theme={name} />;
}

// A dream's mood, as a theme name.
export function moodTheme(mood: string | null | undefined): ThemeName {
  const known = ["scared", "peaceful", "sad", "happy", "confused", "excited", "neutral", "mysterious"];
  return known.includes(mood ?? "") ? (`mood-${mood}` as ThemeName) : "night";
}
