import Link from "next/link";
import { Avatar } from "./Avatar";
import { FollowButton } from "./ActionButtons";
import { excerpt } from "@/lib/utils";

export interface Person {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  followers?: number;
  public_dreams?: number;
  shared_tags?: string[];
}

export function PersonList({
  people,
  followingIds,
  meId,
}: {
  people: Person[];
  followingIds: Set<string>;
  meId: string | null;
}) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {people.map((p) => (
        <li key={p.id} className="flex items-start gap-4 py-5">
          <Link href={`/u/${p.username}`} aria-label={`@${p.username}`}>
            <Avatar url={p.avatar_url} name={p.username} className="h-12 w-12 text-2xl" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/u/${p.username}`} className="font-medium text-moon hover:underline">
              @{p.username}
            </Link>
            {p.bio && <p className="mt-0.5 text-sm leading-relaxed text-mist">{excerpt(p.bio, 110)}</p>}
            <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-mist/70">
              {typeof p.public_dreams === "number" && <span>{p.public_dreams} public {p.public_dreams === 1 ? "dream" : "dreams"}</span>}
              {typeof p.followers === "number" && <span>{p.followers} {p.followers === 1 ? "follower" : "followers"}</span>}
            </p>
            {p.shared_tags && p.shared_tags.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-mist">
                You both dream about
                {p.shared_tags.slice(0, 3).map((t) => (
                  <Link key={t} href={`/search?tag=${t}`} className="chip">#{t}</Link>
                ))}
              </p>
            )}
          </div>
          {meId !== p.id && <FollowButton userId={p.id} username={p.username} following={followingIds.has(p.id)} />}
        </li>
      ))}
    </ul>
  );
}
