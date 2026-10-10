import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { EmptyState } from "@/components/DreamCard";
import { REACTIONS } from "@/lib/moods";
import type { NotificationRow } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

function describe(n: NotificationRow) {
  const who = n.actor_username ? `@${n.actor_username}` : "Someone";
  const title = n.dream_title ? `“${n.dream_title}”` : "your dream";
  const emoji = REACTIONS.find((r) => r.value === n.reaction_type)?.emoji ?? "❤️";
  switch (n.type) {
    case "reaction":
      return { text: `Someone reacted ${emoji} to ${title}`, href: `/dreams/${n.dream_slug}` };
    case "comment":
      return { text: `${who} commented on ${title}`, href: `/dreams/${n.dream_slug}#c-${n.comment_id}` };
    case "reply":
      return { text: `${who} replied to your comment on ${title}`, href: `/dreams/${n.dream_slug}#c-${n.comment_id}` };
    case "mention":
      return { text: `${who} mentioned you on ${title}`, href: `/dreams/${n.dream_slug}#c-${n.comment_id}` };
    case "follow":
      return { text: `${who} started following you`, href: `/u/${n.actor_username}` };
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);
  if (!profile) redirect("/login?next=/notifications");

  const { data } = await supabase.from("my_notifications").select("*").order("created_at", { ascending: false }).limit(50);
  const items = (data ?? []) as NotificationRow[];
  // Show what was unread, then mark everything as read.
  if (items.some((n) => !n.read_at)) await supabase.rpc("mark_notifications_read");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl">Notifications</h1>
      {items.length === 0 ? (
        <EmptyState title="Nothing yet">When people react, comment or follow, you&apos;ll see it here.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const { text, href } = describe(n);
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={cn("card card-link flex items-center gap-3 px-5 py-4", !n.read_at && "border-violet/50 bg-violet/10")}
                >
                  <span className="flex-1">{text}</span>
                  <time dateTime={n.created_at} className="shrink-0 text-xs text-mist">{timeAgo(n.created_at)}</time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
