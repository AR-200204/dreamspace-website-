export type Visibility = "public" | "anonymous" | "private";

export interface DreamRow {
  id: string;
  slug: string;
  title: string;
  body: string;
  mood: string | null;
  dream_date: string;
  visibility: Visibility;
  view_count: number;
  created_at: string;
  author_id: string | null;
  author_username: string | null;
  author_avatar: string | null;
  tags: string[];
  reaction_count: number;
  comment_count: number;
  image_url: string | null;
}

export interface CommentRow {
  id: string;
  dream_id: string;
  parent_id: string | null;
  body: string;
  is_interpretation: boolean;
  created_at: string;
  is_dream_author: boolean;
  is_mine: boolean;
  author_id: string | null;
  author_username: string | null;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  type: "reaction" | "comment" | "reply" | "follow" | "mention";
  created_at: string;
  read_at: string | null;
  reaction_type: string | null;
  actor_username: string | null;
  dream_slug: string | null;
  dream_title: string | null;
  comment_id: string | null;
}

export interface ProfileStats {
  dreams: number;
  comments: number;
  reactions_received: number;
  reactions_given: number;
  best_dream_reactions: number;
  recurring_dreams: number;
  followers: number;
  following: number;
}
