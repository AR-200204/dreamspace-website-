import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, Sparkles } from "lucide-react";
import { generatePatternReport } from "@/app/actions";
import { aiConfigured, AI_DISCLAIMER } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { getMood } from "@/lib/moods";
import { analyzeDreams, toneShift, THEMES, type PatternDream, type ThemeGroup } from "@/lib/patterns";
import { formatDate } from "@/lib/utils";

// AI replies can take a while, so allow up to 60 seconds for the actions on this page.
export const maxDuration = 60;

export const metadata: Metadata = { title: "Your dream patterns", robots: { index: false } };

const GROUPS: ThemeGroup[] = ["Situations", "People", "Places", "Creatures & elements", "Body"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const AI_MESSAGES: Record<string, string> = {
  unavailable: "The AI report isn't available right now.",
  consent: "Please tick the box to confirm you're happy for your dream text to be sent to the AI service.",
  limit: "You've already created a report in the last 24 hours. Try again tomorrow.",
  few: "You need at least 3 dreams (that match your choices above) to create a report.",
  busy: "AI reports are very popular today and have reached the daily limit. Please try again tomorrow.",
  auth: "AI is temporarily unavailable. Please try again later.",
  credits: "AI is temporarily unavailable. Please try again later.",
  policy: "AI is temporarily unavailable. Please try again later.",
  ratelimit: "The AI service is busy right now. Please try again in a minute.",
  empty: "The AI didn't manage to answer that time. Please try again.",
  error: "The AI service didn't respond. Please try again in a moment.",
};

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/8" role="img" aria-label={label}>
      <div className="h-1.5 rounded-full bg-gradient-to-r from-violet to-dawn" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ ai?: string; detail?: string }> }) {
  const { ai, detail } = await searchParams;
  const supabase = await createClient();
  const { user } = await getCurrentProfile(supabase);
  if (!user) redirect("/login?next=/insights");

  const { data } = await supabase
    .from("my_dreams")
    .select("id, slug, title, body, mood, dream_date, created_at, tags")
    .order("dream_date", { ascending: false })
    .limit(150);
  const dreams = (data ?? []) as PatternDream[];

  if (dreams.length < 3) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-3xl">Your dream patterns</h1>
        <div className="card px-6 py-10 text-center">
          <p className="font-display text-3xl">Patterns appear after a few dreams</p>
          <p className="mx-auto mt-3 max-w-md text-mist">
            You have {dreams.length} so far. Log {3 - dreams.length} more and we&apos;ll start showing the themes, feelings and
            echoes that keep coming back. Private and anonymous dreams count too, and only you can see this page.
          </p>
          <Link href="/dreams/new" className="btn-primary mt-6">Share a dream</Link>
        </div>
      </div>
    );
  }

  const r = analyzeDreams(dreams);
  const shift = toneShift(r.weekly);
  const topTheme = r.themes[0];
  const recurringThemes = r.themes.filter((t) => t.count >= 3).length;
  const maxWeekday = Math.max(...r.weekdays, 1);
  const maxWeek = Math.max(...r.weekly.map((w) => w.total), 1);

  // How the community compares, using public tag counts for the top themes that have a tag.
  const communityThemes = r.themes.filter((t) => t.theme.tags.length > 0).slice(0, 3);
  const communityCounts = await Promise.all(
    communityThemes.map(async (t) => {
      const { count } = await supabase.from("public_dreams").select("id", { count: "exact", head: true }).contains("tags", [t.theme.tags[0]]);
      return { theme: t.theme, tag: t.theme.tags[0], count: count ?? 0 };
    })
  );

  const { data: report } = await supabase
    .from("ai_pattern_reports")
    .select("answer, dream_count, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const aiOn = aiConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <h1 className="font-display text-3xl">Your dream patterns</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-mist">
          What keeps coming back in your own dreams. Only you can see this. It&apos;s worked out from your {r.total} most recent dreams
          (including anonymous and private ones) and nothing is sent anywhere unless you ask for the AI report below.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Dreams analysed", String(r.total)],
          ["Recurring themes", String(recurringThemes)],
          ["Most common mood", r.moods[0] ? `${getMood(r.moods[0].mood)?.emoji ?? ""} ${getMood(r.moods[0].mood)?.label ?? r.moods[0].mood}` : "—"],
          ["Top theme", topTheme ? `${topTheme.theme.emoji} ${topTheme.theme.label}` : "—"],
        ].map(([label, value]) => (
          <div key={label} className="card px-4 py-4">
            <dd className="font-display text-[1.7rem] leading-tight">{value}</dd>
            <dt className="mt-1 text-xs text-mist">{label}</dt>
          </div>
        ))}
      </dl>

      {/* Themes */}
      <section aria-labelledby="themes">
        <h2 id="themes" className="font-display text-2xl">Themes in your dreams</h2>
        <p className="mt-1 text-sm text-mist">Found by looking for common words and tags. A theme seen in 3+ dreams counts as recurring.</p>
        {r.themes.length === 0 ? (
          <p className="mt-4 text-mist">No clear themes yet. Adding a few more details to your dreams helps.</p>
        ) : (
          <div className="mt-5 space-y-6">
            {GROUPS.map((g) => {
              const items = r.themes.filter((t) => t.theme.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g}>
                  <h3 className="mb-3 font-display text-2xl text-moon/80">{g}</h3>
                  <ul className="divide-y divide-line border-y border-line">
                    {items.map((t) => (
                      <li key={t.theme.id} className="py-4">
                        <details>
                          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium"><span aria-hidden>{t.theme.emoji}</span> {t.theme.label}
                                {t.count >= 3 && <span className="chip ml-2 !cursor-default">recurring</span>}
                              </span>
                              <span className="text-sm text-mist">{t.count} of {r.total}</span>
                            </div>
                            <div className="mt-2"><Bar value={t.count} max={r.themes[0].count} label={`${t.count} of ${r.total} dreams`} /></div>
                          </summary>
                          <ul className="mt-3 space-y-1 text-sm">
                            {t.dreams.slice(0, 8).map((d) => (
                              <li key={d.id}>
                                <Link href={`/dreams/${d.slug}`} className="text-mist hover:text-moon hover:underline">{d.title}</Link>
                                <span className="text-mist/60"> · {formatDate(d.dream_date)}</span>
                              </li>
                            ))}
                            {t.dreams.length > 8 && <li className="text-mist/60">and {t.dreams.length - 8} more</li>}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Words */}
      {r.words.length > 0 && (
        <section aria-labelledby="words">
          <h2 id="words" className="font-display text-2xl">Words that keep coming back</h2>
          <p className="mt-1 text-sm text-mist">Words used in two or more different dreams.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {r.words.map((w) => (
              <li key={w.word}>
                <Link href={`/search?q=${encodeURIComponent(w.word)}`} className="chip !text-sm">
                  {w.word} <span className="ml-1.5 text-mist/60">{w.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Feelings */}
      <section aria-labelledby="feelings">
        <h2 id="feelings" className="font-display text-2xl">How your dreams have felt</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="card space-y-3 p-5">
            <h3 className="text-sm text-mist">Moods you chose</h3>
            {r.moods.length === 0 ? <p className="text-mist">You haven&apos;t picked moods yet.</p> : r.moods.map((m) => (
              <div key={m.mood}>
                <div className="flex justify-between text-sm"><span>{getMood(m.mood)?.emoji} {getMood(m.mood)?.label ?? m.mood}</span><span className="text-mist">{m.count}</span></div>
                <Bar value={m.count} max={r.moods[0].count} label={`${m.count} dreams`} />
              </div>
            ))}
          </div>
          <div className="card space-y-3 p-5">
            <h3 className="text-sm text-mist">Feelings mentioned in the stories</h3>
            {r.emotions.length === 0 ? <p className="text-mist">No feeling words found yet.</p> : r.emotions.map((e) => (
              <div key={e.id}>
                <div className="flex justify-between text-sm"><span>{e.label}</span><span className="text-mist">{e.count}</span></div>
                <Bar value={e.count} max={r.emotions[0].count} label={`${e.count} dreams`} />
              </div>
            ))}
          </div>
        </div>

        {r.weekly.length >= 2 && (
          <div className="card mt-4 p-5">
            <h3 className="text-sm text-mist">Week by week</h3>
            <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label="Dreams per week, split by harder and gentler moods">
              {r.weekly.map((w) => (
                <div key={w.start} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${formatDate(w.start)}: ${w.total} dreams, ${w.hard} with harder moods, ${w.gentle} with gentler moods`}>
                  <div className="flex flex-col justify-end overflow-hidden rounded-t" style={{ height: `${Math.round((w.total / maxWeek) * 100)}%` }}>
                    <div className="bg-ember/70" style={{ flexGrow: w.hard }} />
                    <div className="bg-violet/40" style={{ flexGrow: Math.max(w.total - w.hard - w.gentle, 0) }} />
                    <div className="bg-violet" style={{ flexGrow: w.gentle }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-mist">
              <span className="text-ember">■</span> scared / sad / confused · <span className="text-violet">■</span> peaceful / happy / excited · other moods in between
            </p>
            {shift && (
              <p className="mt-3 text-sm leading-relaxed">
                In your last 4 weeks of dreams, {shift.recentHard}% had a harder mood (scared, sad or confused), compared with {shift.beforeHard}% in the 4 weeks before.
                {shift.recentHard > shift.beforeHard + 15 && " If that matches how life has felt, it may be worth noticing what has changed."}
              </p>
            )}
          </div>
        )}
      </section>

      {/* When */}
      <section aria-labelledby="when">
        <h2 id="when" className="font-display text-2xl">When you log dreams</h2>
        <div className="card mt-4 grid grid-cols-7 gap-2 p-5 text-center">
          {r.weekdays.map((n, i) => (
            <div key={DAYS[i]} className="flex flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end">
                <div className="w-full rounded-t bg-violet/70" style={{ height: `${Math.max((n / maxWeekday) * 100, n ? 6 : 2)}%` }} title={`${n} dreams`} />
              </div>
              <span className="text-xs text-mist">{DAYS[i]}</span>
              <span className="text-xs">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Echoes */}
      {r.echoes.length > 0 && (
        <section aria-labelledby="echoes">
          <h2 id="echoes" className="font-display text-2xl">Dreams that echo each other</h2>
          <ul className="mt-4 space-y-3">
            {r.echoes.map((e) => (
              <li key={`${e.a.id}-${e.b.id}`} className="card px-5 py-4">
                <p>
                  <Link href={`/dreams/${e.a.slug}`} className="hover:underline">{e.a.title}</Link>
                  <span className="text-mist"> &amp; </span>
                  <Link href={`/dreams/${e.b.slug}`} className="hover:underline">{e.b.title}</Link>
                </p>
                <p className="mt-1 text-sm text-mist">
                  Shared: {e.shared.map((s) => (s.startsWith("#") ? s : THEMES.find((t) => t.id === s)?.label ?? s)).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reflect */}
      {r.themes.length > 0 && (
        <section aria-labelledby="reflect">
          <h2 id="reflect" className="font-display text-2xl">Questions to reflect on</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-mist">
            Research suggests dreams often continue what is on our minds when awake, while no dream symbol has been shown to have one fixed meaning.
            So instead of telling you what a dream &ldquo;means&rdquo;, here are questions linking your top themes to your waking life.
          </p>
          <ul className="mt-4 space-y-3">
            {r.themes.slice(0, 3).map((t) => (
              <li key={t.theme.id} className="card px-5 py-4">
                <p className="font-medium"><span aria-hidden>{t.theme.emoji}</span> {t.theme.label}</p>
                <p className="mt-1 leading-relaxed">{t.theme.question}</p>
                <details className="mt-2 text-sm text-mist">
                  <summary className="cursor-pointer hover:text-moon">A popular reading</summary>
                  <p className="mt-1 leading-relaxed">{t.theme.popular} This is a common idea, not a scientific finding, and your own associations matter more.</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Community */}
      {communityCounts.some((c) => c.count > 0) && (
        <section aria-labelledby="community">
          <h2 id="community" className="font-display text-2xl">You&apos;re not the only one</h2>
          <ul className="mt-4 space-y-2">
            {communityCounts.filter((c) => c.count > 0).map((c) => (
              <li key={c.tag}>
                <Link href={`/search?tag=${c.tag}`} className="card card-link block px-5 py-3">
                  <span aria-hidden>{c.theme.emoji}</span> <span className="text-moon">{c.count}</span> {c.count === 1 ? "dream" : "dreams"} on DreamSpace are tagged <span className="text-violet">#{c.tag}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AI report */}
      <section id="report" aria-labelledby="ai-report" className="scroll-mt-20">
        <h2 id="ai-report" className="flex items-center gap-2 font-display text-2xl">
          <Sparkles size={20} className="text-violet" aria-hidden /> Written pattern report (AI)
        </h2>
        {ai && AI_MESSAGES[ai] && (
          <p role="status" className="mt-4 rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">
            {AI_MESSAGES[ai]}
            {process.env.AI_DEBUG === "1" && detail && <code className="mt-2 block break-words text-xs text-mist">AI_DEBUG: {detail}</code>}
          </p>
        )}

        {report && (
          <div className="card mt-4 p-5">
            <p className="whitespace-pre-wrap leading-relaxed">{report.answer}</p>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-mist">
              {AI_DISCLAIMER} Based on {report.dream_count} dreams, created {formatDate(report.created_at)}. Only you can see this.
            </p>
          </div>
        )}

        {aiOn ? (
          <form action={generatePatternReport} className="card mt-4 space-y-3 p-5">
            <p className="text-sm leading-relaxed text-mist">
              An AI service reads excerpts of your recent dreams and writes a short reflection on the patterns. One report per day.
            </p>
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" name="consent" className="mt-1" />
              <span>I understand that the text of my dreams will be sent to an AI service to create this report.</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm text-mist">
              <input type="checkbox" name="include_private" className="mt-1" />
              <span>Also include my <strong className="text-moon">private</strong> dreams (anonymous ones are included by default; your username is never sent).</span>
            </label>
            <button className="btn-ghost">✨ {report ? "Create a new report" : "Create my pattern report"}</button>
          </form>
        ) : (
          !report && <p className="mt-3 text-sm text-mist">The AI report is switched off on this site. The patterns above work without it.</p>
        )}
      </section>

      <aside className="card flex gap-3 p-5 text-sm leading-relaxed text-mist">
        <BookOpen size={18} className="mt-0.5 shrink-0 text-violet" aria-hidden />
        <p>
          <strong className="text-moon">About this page.</strong> Dream researchers have long studied what dreams contain and found that they often reflect
          waking concerns (the &ldquo;continuity hypothesis&rdquo;). This page counts patterns in your own words. It can&apos;t tell you what a dream means,
          can&apos;t diagnose anything, and can miss things. Learn more:{" "}
          <a className="underline underline-offset-2 hover:text-moon" href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7481704/" target="_blank" rel="noopener noreferrer">automatic analysis of dream reports</a>.
        </p>
      </aside>
    </div>
  );
}
