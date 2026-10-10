import { Bookmark, UserCheck, UserPlus } from "lucide-react";
import { toggleBookmark, toggleFollow } from "@/app/actions";
import { cn } from "@/lib/utils";

export function SaveButton({ dreamId, saved, back = "/feed", className }: { dreamId: string; saved: boolean; back?: string; className?: string }) {
  return (
    <form action={toggleBookmark} className={cn("relative z-10", className)}>
      <input type="hidden" name="dream_id" value={dreamId} />
      <input type="hidden" name="back" value={back} />
      <button
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors",
          saved ? "text-violet" : "text-mist hover:text-moon"
        )}
      >
        <Bookmark size={16} aria-hidden fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
      </button>
    </form>
  );
}

export function FollowButton({ userId, username, following }: { userId: string; username: string; following: boolean }) {
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="followee_id" value={userId} />
      <input type="hidden" name="username" value={username} />
      <button className={following ? "btn-ghost !py-1.5" : "btn-primary !py-1.5"} aria-pressed={following}>
        {following ? <UserCheck size={15} aria-hidden /> : <UserPlus size={15} aria-hidden />}
        {following ? "Following" : "Follow"}
      </button>
    </form>
  );
}
