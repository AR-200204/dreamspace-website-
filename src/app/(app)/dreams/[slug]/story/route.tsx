import { renderDreamImage } from "@/lib/og";

// A tall 1080x1920 picture people can save and post to Instagram Stories.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderDreamImage(slug, "story");
}
