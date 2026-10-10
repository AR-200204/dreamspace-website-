import { ImageUpload } from "./ImageUpload";
import { LocalDateInput } from "./LocalDateInput";
import { MOODS } from "@/lib/moods";
import type { DreamRow } from "@/lib/types";

export function DreamForm({
  action,
  dream,
  defaultTags,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  dream?: DreamRow;
  defaultTags?: string;
  submitLabel: string;
}) {
  const editing = Boolean(dream);

  return (
    <form action={action} className="mt-7 space-y-6">
      {dream && (
        <>
          <input type="hidden" name="id" value={dream.id} />
          <input type="hidden" name="slug" value={dream.slug} />
        </>
      )}

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" required minLength={3} maxLength={120} defaultValue={dream?.title} className="input font-display text-xl" placeholder="I was being chased through a strange city" />
      </div>

      <div>
        <label className="label" htmlFor="body">Your dream</label>
        <textarea id="body" name="body" required minLength={10} maxLength={10000} rows={10} defaultValue={dream?.body} className="input font-display text-lg leading-relaxed" placeholder="I was running through a city I had never seen before…" />
      </div>

      <fieldset>
        <legend className="label">How did it feel?</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <label key={m.value} className="cursor-pointer">
              <input type="radio" name="mood" value={m.value} defaultChecked={dream?.mood === m.value} className="peer sr-only" />
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
          <input id="tags" name="tags" defaultValue={dream ? dream.tags.join(", ") : defaultTags ?? ""} className="input" placeholder="flying, childhood, ocean" />
          <p className="mt-1.5 text-xs text-mist/80">Separate with commas. Up to 8.</p>
        </div>
        <div>
          <label className="label" htmlFor="dream_date">When did you dream it?</label>
          <LocalDateInput id="dream_date" name="dream_date" defaultValue={dream?.dream_date} />
        </div>
      </div>

      <ImageUpload bucket="dream-images" name="image_url" initialUrl={dream?.image_url} label="Image (optional)" />

      <fieldset>
        <legend className="label">Who can see it?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { v: "anonymous", t: "Anonymous", d: "Shown as “Anonymous Dreamer”. Your username is hidden." },
            { v: "public", t: "With my username", d: "Appears on your profile." },
            { v: "private", t: "Only me", d: "A private journal entry. Publish it later." },
          ].map((o) => (
            <label key={o.v} className="cursor-pointer">
              <input type="radio" name="visibility" value={o.v} defaultChecked={(dream?.visibility ?? "anonymous") === o.v} className="peer sr-only" />
              <span className="card block h-full p-4 text-sm transition-colors peer-checked:border-violet peer-checked:bg-violet/10 peer-focus-visible:outline-2 peer-focus-visible:outline-violet">
                <span className="block font-medium text-moon">{o.t}</span>
                <span className="mt-1 block text-mist">{o.d}</span>
              </span>
            </label>
          ))}
        </div>
        {editing && (
          <p className="mt-2 text-xs text-mist/80">Switching to “With my username” will show your username on this dream.</p>
        )}
      </fieldset>

      <button className="btn-primary !px-8 !py-3.5 text-base">{submitLabel}</button>
    </form>
  );
}
