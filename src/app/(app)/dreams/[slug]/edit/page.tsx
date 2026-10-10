import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { updateDream } from "@/app/actions";
import { DreamForm } from "@/components/DreamForm";
import { createClient } from "@/lib/supabase/server";
import type { DreamRow } from "@/lib/types";

export const metadata: Metadata = { title: "Edit dream", robots: { index: false } };

export default async function EditDreamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  // my_dreams only ever returns the signed-in user's own dreams.
  const { data } = await supabase.from("my_dreams").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">Edit your dream</h1>
      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <DreamForm action={updateDream} dream={data as DreamRow} submitLabel="Save changes" />
    </div>
  );
}
