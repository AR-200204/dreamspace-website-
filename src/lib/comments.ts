import type { CommentRow } from "./types";

export type CommentNode = CommentRow & { children: CommentNode[] };

// Builds the comment thread. The newest top-level comment comes FIRST, so a comment you just posted
// appears right under the form. Replies stay oldest-first inside each thread, so a conversation reads in order.
export function buildCommentTree(rows: CommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));

  const roots: CommentNode[] = [];
  map.forEach((n) => {
    const parent = n.parent_id ? map.get(n.parent_id) : null;
    (parent ? parent.children : roots).push(n);
  });

  const time = (n: CommentNode) => new Date(n.created_at).getTime();
  roots.sort((a, b) => time(b) - time(a));
  const sortReplies = (n: CommentNode) => {
    n.children.sort((a, b) => time(a) - time(b));
    n.children.forEach(sortReplies);
  };
  roots.forEach(sortReplies);
  return roots;
}
