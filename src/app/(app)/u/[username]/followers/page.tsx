import type { Metadata } from "next";
import { Connections } from "@/components/Connections";

export const metadata: Metadata = { title: "Followers" };

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  return <Connections username={decodeURIComponent((await params).username)} kind="followers" />;
}
