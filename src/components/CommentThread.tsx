import { Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import { addComment, deleteComment } from "@/app/actions";
import type { CommentRow } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { ReportForm } from "./ReportForm";

type Node = CommentRow & { children: Node[] };

function buildTree(rows: CommentRow[]): Node[] {
  const map = new Map<string, Node>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: Node[] = [];
  map.forEach((n) => {
    const parent = n.parent_id ? map.get(n.parent_id) : null;
    (parent ? parent.children : roots).push(n);
  });
  return roots;
}

export function CommentThread({
  comments,
  dreamId,
  slug,
  signedIn,
  anonymousDream,
}: {
  comments: CommentRow[];
  dreamId: string;
  slug: string;
  signedIn: boolean;
  anonymousDream: boolean;
}) {
  const tree = buildTree(comments);
  if (tree.length === 0)
    return <p className="text-mist">No interpretations yet. Be the first to share what you think it might mean.</p>;
  return (
    <ul className="space-y-5">
      {tree.map((n) => (
        <CommentItem key={n.id} node={n} depth={0} dreamId={dreamId} slug={slug} signedIn={signedIn} anonymousDream={anonymousDream} />
      ))}
    </ul>
  );
}

function CommentItem({
  node,
  depth,
  dreamId,
  slug,
  signedIn,
  anonymousDream,
}: {
  node: Node;
  depth: number;
  dreamId: string;
  slug: string;
  signedIn: boolean;
  anonymousDream: boolean;
}) {
  const name = node.author_username ? (
    <Link href={`/u/${node.author_username}`} className="font-medium text-moon hover:underline">
      @{node.author_username}
    </Link>
  ) : (
    <span className="font-medium text-moon">{anonymousDream ? "The dreamer" : "Dreamer"}</span>
  );

  return (
    <li id={`c-${node.id}`}>
      <div className={depth > 0 ? "border-l border-line pl-4 sm:pl-5" : ""}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mist">
          {name}
          {node.is_dream_author && node.author_username && <span className="chip !cursor-default">Dreamer</span>}
          {node.is_interpretation && (
            <span className="inline-flex items-center gap-1 text-violet">
              <Sparkles size={13} aria-hidden /> Interpretation
            </span>
          )}
          <span aria-hidden>•</span>
          <time dateTime={node.created_at}>{timeAgo(node.created_at)}</time>
        </div>
        <p className="mt-1.5 max-w-[68ch] whitespace-pre-wrap leading-relaxed">{node.body}</p>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          {signedIn && depth < 3 && (
            <details className="group">
              <summary className="cursor-pointer list-none text-mist hover:text-moon [&::-webkit-details-marker]:hidden">Reply</summary>
              <form action={addComment} className="mt-3 w-[min(32rem,80vw)] space-y-2">
                <input type="hidden" name="dream_id" value={dreamId} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="parent_id" value={node.id} />
                <textarea name="body" required maxLength={2000} rows={3} className="input" placeholder="Write a reply…" aria-label="Reply" />
                <button className="btn-primary !py-1.5">Reply</button>
              </form>
            </details>
          )}
          {!node.is_mine && <ReportForm slug={slug} commentId={node.id} />}
          {node.is_mine && (
            <form action={deleteComment}>
              <input type="hidden" name="id" value={node.id} />
              <input type="hidden" name="slug" value={slug} />
              <button className="inline-flex items-center gap-1.5 text-mist hover:text-red-300">
                <Trash2 size={14} aria-hidden /> Delete
              </button>
            </form>
          )}
        </div>

        {node.children.length > 0 && (
          <ul className="mt-4 space-y-4">
            {node.children.map((c) => (
              <CommentItem key={c.id} node={c} depth={depth + 1} dreamId={dreamId} slug={slug} signedIn={signedIn} anonymousDream={anonymousDream} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
