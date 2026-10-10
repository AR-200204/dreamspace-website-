import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  adminBanUser, adminDeleteDream, adminDeleteTag, adminHideComment,
  adminSetReportStatus, adminSetTagFeatured, adminUnbanUser,
} from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { REPORT_REASONS } from "@/lib/moods";
import { cn, excerpt, formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "reports", label: "Reports" },
  { key: "dreams", label: "Dreams" },
  { key: "users", label: "Users" },
  { key: "tags", label: "Tags" },
];

// A tiny form with one button, so every admin action is a plain server action.
function Act({
  action, fields, label, danger, back,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  danger?: boolean;
  back: string;
}) {
  return (
    <form action={action} className="inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="back" value={back} />
      <button className={cn(danger ? "btn-danger" : "btn-ghost", "!px-3 !py-1 text-xs")}>{label}</button>
    </form>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; error?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "overview";
  const supabase = await createClient();

  // Everything below is double-checked inside the database too.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();

  const back = `/admin?tab=${tab}`;
  const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

  type Stats = { total_users: number; total_dreams: number; dreams_today: number; comments_today: number; active_users: number; open_reports: number; top_tags: Array<{ name: string; uses: number }> };
  type Report = { id: string; reason: string; details: string | null; status: string; created_at: string; reporter_username: string; dream_id: string | null; dream_slug: string | null; dream_title: string | null; comment_id: string | null; comment_body: string | null; comment_dream_slug: string | null; target_user_id: string | null; target_username: string | null };
  type AdminDream = { id: string; slug: string; title: string; visibility: string; created_at: string; author_id: string; author_username: string; report_count: number };
  type AdminUser = { id: string; username: string; created_at: string; dream_count: number; comment_count: number; banned: boolean; is_admin: boolean };
  type AdminTag = { name: string; featured: boolean; uses: number };

  let stats: Stats | null = null;
  let reports: Report[] = [];
  let dreams: AdminDream[] = [];
  let users: AdminUser[] = [];
  let tags: AdminTag[] = [];
  const status = ["open", "reviewed", "dismissed", "all"].includes(sp.status ?? "") ? sp.status! : "open";

  if (tab === "overview") stats = (await supabase.rpc("admin_stats")).data as Stats;
  if (tab === "reports") reports = ((await supabase.rpc("admin_reports", { p_status: status })).data ?? []) as Report[];
  if (tab === "dreams") dreams = ((await supabase.rpc("admin_dreams", { p_limit: 50, p_offset: 0 })).data ?? []) as AdminDream[];
  if (tab === "users") users = ((await supabase.rpc("admin_users", { p_q: sp.q ?? "", p_limit: 50, p_offset: 0 })).data ?? []) as AdminUser[];
  if (tab === "tags") tags = ((await supabase.rpc("admin_tags")).data ?? []) as AdminTag[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Admin</h1>
      {sp.error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{sp.error}</p>}

      <nav className="flex flex-wrap gap-2" aria-label="Admin sections">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
            className={cn("rounded-full border px-4 py-1.5 text-sm", tab === t.key ? "border-violet bg-violet/15 text-moon" : "border-line text-mist hover:text-moon")}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && stats && (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              ["Total users", stats.total_users], ["Total dreams", stats.total_dreams], ["Dreams today", stats.dreams_today],
              ["Comments today", stats.comments_today], ["Active users (7 days)", stats.active_users], ["Open reports", stats.open_reports],
            ] as Array<[string, number]>).map(([label, value]) => (
              <div key={label} className="card px-4 py-4">
                <dd className="font-display text-3xl">{value}</dd>
                <dt className="mt-1 text-xs text-mist">{label}</dt>
              </div>
            ))}
          </dl>
          <section className="card p-5">
            <h2 className="font-display text-xl">Most popular tags</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {stats.top_tags.map((t) => (
                <li key={t.name} className="chip">#{t.name} · {t.uses}</li>
              ))}
              {stats.top_tags.length === 0 && <li className="text-mist">No tags yet.</li>}
            </ul>
          </section>
        </>
      )}

      {tab === "reports" && (
        <>
          <div className="flex gap-2 text-sm">
            {["open", "reviewed", "dismissed", "all"].map((s) => (
              <Link key={s} href={`/admin?tab=reports&status=${s}`} className={cn("capitalize", status === s ? "text-moon underline underline-offset-4" : "text-mist hover:text-moon")}>{s}</Link>
            ))}
          </div>
          {reports.length === 0 && <p className="text-mist">No reports here.</p>}
          <ul className="space-y-4">
            {reports.map((r) => {
              const slug = r.dream_slug ?? r.comment_dream_slug;
              return (
                <li key={r.id} className="card space-y-3 p-5">
                  <p className="text-sm text-mist">
                    <span className="text-moon">{reasonLabel(r.reason)}</span> · reported by @{r.reporter_username} · {timeAgo(r.created_at)} · {r.status}
                  </p>
                  {r.details && <p className="text-sm">“{r.details}”</p>}
                  {r.dream_title && <p>Dream: <Link href={`/dreams/${r.dream_slug}`} className="underline underline-offset-2">{r.dream_title}</Link></p>}
                  {r.comment_body && <p>Comment: “{excerpt(r.comment_body, 200)}” {slug && <Link href={`/dreams/${slug}#c-${r.comment_id}`} className="text-violet">view</Link>}</p>}
                  <p className="text-xs text-mist">Author: {r.target_username ? `@${r.target_username}` : "unknown"} (visible to admins only)</p>
                  <div className="flex flex-wrap gap-2">
                    {r.dream_id && <Act action={adminDeleteDream} fields={{ id: r.dream_id }} label="Delete dream" danger back={back} />}
                    {r.comment_id && <Act action={adminHideComment} fields={{ id: r.comment_id, hidden: "true" }} label="Hide comment" danger back={back} />}
                    {r.target_user_id && <Act action={adminBanUser} fields={{ id: r.target_user_id, reason: `Report: ${r.reason}` }} label="Ban author" danger back={back} />}
                    <Act action={adminSetReportStatus} fields={{ id: r.id, status: "reviewed" }} label="Mark reviewed" back={back} />
                    <Act action={adminSetReportStatus} fields={{ id: r.id, status: "dismissed" }} label="Dismiss" back={back} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === "dreams" && (
        <ul className="space-y-3">
          {dreams.map((d) => (
            <li key={d.id} className="card flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/dreams/${d.slug}`} className="font-medium hover:underline">{d.title}</Link>
                <p className="text-xs text-mist">@{d.author_username} · {d.visibility} · {formatDate(d.created_at)}{d.report_count > 0 && ` · ${d.report_count} report(s)`}</p>
              </div>
              <Act action={adminDeleteDream} fields={{ id: d.id }} label="Delete" danger back={back} />
            </li>
          ))}
          {dreams.length === 0 && <p className="text-mist">No dreams yet.</p>}
        </ul>
      )}

      {tab === "users" && (
        <>
          <form action="/admin" className="flex gap-2">
            <input type="hidden" name="tab" value="users" />
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Search username" className="input" aria-label="Search users" />
            <button className="btn-ghost">Search</button>
          </form>
          <ul className="space-y-3">
            {users.map((u) => (
              <li key={u.id} className="card flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${u.username}`} className="font-medium hover:underline">@{u.username}</Link>
                  {u.is_admin && <span className="chip ml-2 !cursor-default">admin</span>}
                  {u.banned && <span className="chip ml-2 !cursor-default text-red-300">banned</span>}
                  <p className="text-xs text-mist">Joined {formatDate(u.created_at)} · {u.dream_count} dreams · {u.comment_count} comments</p>
                </div>
                {!u.is_admin && (u.banned
                  ? <Act action={adminUnbanUser} fields={{ id: u.id }} label="Unban" back={back} />
                  : <Act action={adminBanUser} fields={{ id: u.id, reason: "Banned by admin" }} label="Ban" danger back={back} />)}
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "tags" && (
        <ul className="space-y-2">
          {tags.map((t) => (
            <li key={t.name} className="card flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex-1">#{t.name} <span className="text-xs text-mist">· {t.uses} uses{t.featured && " · featured category"}</span></span>
              <Act action={adminSetTagFeatured} fields={{ name: t.name, featured: String(!t.featured) }} label={t.featured ? "Unfeature" : "Feature"} back={back} />
              <Act action={adminDeleteTag} fields={{ name: t.name }} label="Delete" danger back={back} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
