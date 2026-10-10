import type { Metadata } from "next";
import { createDream } from "@/app/actions";
import { DreamForm } from "@/components/DreamForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Share a dream" };

export default async function NewDreamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prompt?: string }>;
}) {
  const { error, prompt } = await searchParams;
  const supabase = await createClient();

  let promptText: string | null = null;
  if (prompt && /^\d+$/.test(prompt)) {
    const { data } = await supabase.from("daily_prompts").select("question").eq("id", Number(prompt)).maybeSingle();
    promptText = data?.question ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">What did you dream?</h1>
      <p className="mt-2 text-mist">Write it down before it fades. Only the title and story are required.</p>

      {promptText && (
        <p className="card mt-5 px-5 py-4 font-display text-lg">
          <span className="block text-sm text-violet">Dream of the Day</span>
          {promptText}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <DreamForm action={createDream} defaultTags={promptText ? "dream-of-the-day" : ""} submitLabel="Publish dream" />
    </div>
  );
}
