import type { Metadata } from "next";
import { Connections } from "@/components/Connections";

export const metadata: Metadata = { title: "Following" };

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  return <Connections username={decodeURIComponent((await params).username)} kind="following" />;
}
