"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Shrinks the picture in the browser BEFORE uploading (faster, cheaper, and it
// strips hidden camera data such as GPS location).
async function compress(file: File, maxSide: number): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85);
  if (!blob) throw new Error("That image couldn't be processed.");
  return { blob, ext: blob.type === "image/webp" ? "webp" : "jpg" };
}

export function ImageUpload({
  bucket,
  name,
  initialUrl,
  maxSide = 1600,
  label,
  round = false,
}: {
  bucket: "dream-images" | "avatars";
  name: string;
  initialUrl?: string | null;
  maxSide?: number;
  label: string;
  round?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    setBusy(true);
    try {
      const { blob, ext } = await compress(file, maxSide);
      const supabase = createClient();
      const path = `${crypto.randomUUID()}.${ext}`; // random name: never contains your user id
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type });
      if (upErr) throw upErr;
      setUrl(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Selected upload preview"
            className={round ? "h-20 w-20 rounded-full object-cover" : "max-h-48 rounded-xl border border-line object-cover"}
          />
          <button type="button" onClick={() => setUrl("")} className="btn-ghost !py-1.5">
            <X size={14} aria-hidden /> Remove
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-ghost">
          <ImagePlus size={16} aria-hidden /> {busy ? "Uploading…" : "Choose an image"}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" onChange={onPick} className="sr-only" tabIndex={-1} aria-label={label} />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
