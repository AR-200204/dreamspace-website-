import { moonIcon } from "@/lib/icon";

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const n = Number(size);
  // Only the sizes we advertise, so nobody can ask for a giant image.
  if (![192, 512].includes(n)) return new Response("Not found", { status: 404 });
  return moonIcon(n);
}
