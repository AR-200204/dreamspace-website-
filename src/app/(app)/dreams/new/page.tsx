import type { Metadata } from "next";
import { createDream } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { MOODS } from "@/lib/moods";

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
  const today = new Date().toISOString().slice(0, 10);

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

      <form action={createDream} className="mt-7 space-y-6">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" required minLength={3} maxLength={120} className="input font-display text-xl" placeholder="I was being chased through a strange city" />
        </div>

        <div>
          <label className="label" htmlFor="body">Your dream</label>
          <textarea id="body" name="body" required minLength={10} maxLength={10000} rows={10} className="input font-display text-lg leading-relaxed" placeholder="I was running through a city I had never seen before…" />
        </div>

        <fieldset>
          <legend className="label">How did it feel?</legend>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <label key={m.value} className="cursor-pointer">
                <input type="radio" name="mood" value={m.value} className="peer sr-only" />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm text-mist transition-colors peer-checked:border-violet peer-checked:bg-violet/15 peer-checked:text-moon peer-focus-visible:outline-2 peer-focus-visible:outline-violet">
                  <span aria-hidden>{m.emoji}</span> {m.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tags">Tags</label>
            <input id="tags" name="tags" defaultValue={promptText ? "dream-of-the-day" : ""} className="input" placeholder="flying, childhood, ocean" />
            <p className="mt-1.5 text-xs text-mist/80">Separate with commas. Up to 8.</p>
          </div>
          <div>
            <label className="label" htmlFor="dream_date">When did you dream it?</label>
            <input id="dream_date" name="dream_date" type="date" defaultValue={today} max={today} className="input" />
          </div>
        </div>

        <fieldset>
          <legend className="label">Who can see it?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { v: "anonymous", t: "Anonymous", d: "Shown as “Anonymous Dreamer”. Your username is hidden." },
              { v: "public", t: "With my username", d: "Appears on your profile." },
              { v: "private", t: "Only me", d: "A private journal entry. Publish it later." },
            ].map((o) => (
              <label key={o.v} className="cursor-pointer">
                <input type="radio" name="visibility" value={o.v} defaultChecked={o.v === "anonymous"} className="peer sr-only" />
                <span className="card block h-full p-4 text-sm transition-colors peer-checked:border-violet peer-checked:bg-violet/10 peer-focus-visible:outline-2 peer-focus-visible:outline-violet">
                  <span className="block font-medium text-moon">{o.t}</span>
                  <span className="mt-1 block text-mist">{o.d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="btn-primary !px-8 !py-3.5 text-base">Publish dream</button>
      </form>
    </div>
  );
}
