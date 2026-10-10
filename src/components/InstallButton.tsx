"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <p className="text-mist">Installed. Look for it on your home screen.</p>;

  return (
    <div className="space-y-3">
      {promptEvent ? (
        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            await promptEvent.prompt();
            setPromptEvent(null);
          }}
        >
          <Download size={16} aria-hidden /> Install the app
        </button>
      ) : (
        <p className="text-sm leading-relaxed text-mist">
          On <strong className="text-moon">iPhone</strong>: tap Share, then <em>Add to Home Screen</em>. On{" "}
          <strong className="text-moon">Android or desktop Chrome</strong>: open the browser menu and choose{" "}
          <em>Install app</em>. The app opens straight to writing a dream.
        </p>
      )}
    </div>
  );
}
