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
