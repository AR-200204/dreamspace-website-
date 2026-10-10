import Link from "next/link";

export interface Streak {
  current: number;
  longest: number;
  days: number;
  has_today: boolean;
}

// Private to the signed-in user. Counts every day a dream was logged, including anonymous and private ones.
export function StreakCard({ streak }: { streak: Streak }) {
  if (streak.days === 0) return null;
  const message =
    streak.current === 0
      ? "Start a new streak by writing today's dream."
      : streak.has_today
        ? "Come back tomorrow to keep it going."
        : "Write this morning's dream to keep it going.";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-3xl border border-line bg-white/3 py-2 pl-3 pr-5 sm:rounded-full text-sm" role="status">
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-dawn/15">🔥</span>
      <span className="text-moon">{streak.current > 0 ? `${streak.current}-day streak` : "No active streak"}</span>
      <span className="text-mist">
        {message}{" "}
        {streak.days >= 3 && <Link href="/insights" className="text-violet hover:underline">See your patterns</Link>}
      </span>
      <span className="ml-auto text-xs text-mist/70">Longest {streak.longest}</span>
    </div>
  );
}
