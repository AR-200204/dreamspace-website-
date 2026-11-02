import type { Metadata } from "next";
import { createDream } from "@/app/actions";
import { DreamForm } from "@/components/DreamForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { Theme } from "@/components/Theme";

export const metadata: Metadata = { title: "Share a dream" };

export default async function NewDreamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prompt?: string }>;
}) {
  const { error, prompt } = await searchParams;
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);
  const goals = profile?.goals ?? [];

  let promptText: string | null = null;
  if (prompt && /^\d+$/.test(prompt)) {
    const { data } = await supabase.from("daily_prompts").select("question").eq("id", Number(prompt)).maybeSingle();
    promptText = data?.question ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Theme name="dawn" />
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

      {goals.includes("lucid") && (
        <p className="mt-5 text-sm leading-relaxed text-mist">
          <span className="text-violet">Lucid tip:</span> did you realise you were dreaming at any point? Add the tag <span className="text-moon">lucid</span>, even for a brief moment.
        </p>
      )}
      {goals.includes("remember") && !goals.includes("lucid") && (
        <p className="mt-5 text-sm leading-relaxed text-mist">
          <span className="text-violet">Tip:</span> a single image or feeling is enough. More comes back as you write.
        </p>
      )}

      <DreamForm
        action={createDream}
        defaultTags={promptText ? "dream-of-the-day" : ""}
        defaultVisibility={profile?.default_visibility ?? "anonymous"}
        submitLabel="Publish dream"
      />
    </div>
  );
}
