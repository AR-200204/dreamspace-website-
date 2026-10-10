"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

export function ShareButtons({ url, title, storyUrl }: { url: string; title: string; storyUrl?: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`${title} — a dream on DreamSpace`);
  const u = encodeURIComponent(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  const btnCls = "btn-ghost !px-3.5 !py-1.5";
  const linkCls = "text-sm text-mist transition-colors hover:text-moon";
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <button type="button" onClick={nativeShare} className={btnCls}>
        <Share2 size={15} aria-hidden /> Share
      </button>
      <button type="button" onClick={copy} className={btnCls} aria-live="polite">
        <Link2 size={15} aria-hidden /> {copied ? "Copied" : "Copy link"}
      </button>
      <a className={linkCls} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${text}%20${u}`}>
        WhatsApp
      </a>
      <a className={linkCls} target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${text}&url=${u}`}>
        X
      </a>
      <a className={linkCls} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}>
        Facebook
      </a>
      {storyUrl && (
        <a className={linkCls} href={storyUrl} target="_blank" rel="noopener noreferrer" title="Save this picture, then add it to an Instagram Story">
          Instagram Story image
        </a>
      )}
    </div>
  );
}
