// Shown instantly while a page loads, so navigating never feels stuck.
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-mist">
        <span aria-hidden className="moon moon-pulse block h-6 w-6" style={{ boxShadow: "0 0 18px 2px rgb(243 236 216 / 0.35)" }} />
        <span className="font-display text-2xl">Dreaming…</span>
      </div>
      <div className="skeleton h-14 w-2/3" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-52" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  );
}
