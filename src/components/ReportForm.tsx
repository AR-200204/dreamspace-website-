import { Flag } from "lucide-react";
import { report } from "@/app/actions";
import { REPORT_REASONS } from "@/lib/moods";

export function ReportForm({ slug, dreamId, commentId }: { slug: string; dreamId?: string; commentId?: string }) {
  return (
    <details className="group relative inline-block text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-mist hover:text-moon [&::-webkit-details-marker]:hidden">
        <Flag size={14} aria-hidden /> Report
      </summary>
      <form action={report} className="card absolute left-0 z-20 mt-2 w-72 space-y-3 p-4 shadow-xl">
        <input type="hidden" name="slug" value={slug} />
        {dreamId && <input type="hidden" name="dream_id" value={dreamId} />}
        {commentId && <input type="hidden" name="comment_id" value={commentId} />}
        <label className="label" htmlFor={`reason-${commentId ?? dreamId}`}>
          What&apos;s wrong with this {commentId ? "comment" : "dream"}?
        </label>
        <select id={`reason-${commentId ?? dreamId}`} name="reason" className="input" defaultValue="other">
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <textarea name="details" rows={2} maxLength={1000} placeholder="Anything we should know? (optional)" className="input" />
        <button className="btn-primary w-full">Send report</button>
      </form>
    </details>
  );
}
