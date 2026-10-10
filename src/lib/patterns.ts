// Dream pattern finder. Pure functions, no AI, no network: everything runs on the server
// using only the signed-in person's own dreams, so nothing leaves their account.
//
// It is loosely modelled on how dream researchers code dream reports (who appears, where it
// happens, what happens, how it feels), but it is a simple keyword approach and
// it finds PATTERNS, not "answers".

export interface PatternDream {
  id: string;
  slug: string;
  title: string;
  body: string;
  mood: string | null;
  dream_date: string;
  created_at: string;
  tags: string[];
}

export type ThemeGroup = "Situations" | "People" | "Places" | "Creatures & elements" | "Body";

export interface Theme {
  id: string;
  label: string;
  emoji: string;
  group: ThemeGroup;
  words: string; // regex alternatives (matched as whole words)
  tags: string[];
  question: string; // a reflection question (the main output)
  popular: string; // a popular reading, always shown as "not scientific"
}

export const THEMES: Theme[] = [
  { id: "falling", label: "Falling", emoji: "🪂", group: "Situations", tags: ["falling"],
    words: "fall|falls|falling|fell|fallen|plummet\\w*|tumbl\\w*|dropp?ed|dropping",
    question: "Where in your life does it feel like you might lose your footing, or that things are out of your hands?",
    popular: "Often read as a sense of losing control or security." },
  { id: "flying", label: "Flying", emoji: "🕊️", group: "Situations", tags: ["flying"],
    words: "fly|flies|flying|flew|flown|float\\w*|soar\\w*|hover\\w*",
    question: "What would more freedom, or a wider view, look like for you right now?",
    popular: "Often read as freedom, ambition or rising above something." },
  { id: "chased", label: "Being chased", emoji: "🏃", group: "Situations", tags: ["chasing"],
    words: "chase\\w*|chasing|pursu\\w*|hunted|running away|escap\\w*|followed me|following me",
    question: "Is there something you have been avoiding, or a worry you keep running from?",
    popular: "Often read as avoiding a worry, task or feeling." },
  { id: "unprepared", label: "Late or unprepared", emoji: "⏰", group: "Situations", tags: [],
    words: "late|missed|unprepared|forgot|forgotten|not ready|deadline|out of time|running out of time",
    question: "Is there an expectation or deadline that feels bigger than your preparation?",
    popular: "Often read as pressure or worry about being judged." },
  { id: "trapped", label: "Trapped or stuck", emoji: "🔒", group: "Situations", tags: [],
    words: "trapped|stuck|paraly\\w*|can't move|cannot move|couldn't move|could not move|can't scream|couldn't scream|could not scream|frozen|locked|cage\\w*|can't breathe",
    question: "Is there a situation where you feel unable to move forward, or to speak up?",
    popular: "Often read as feeling stuck or powerless." },
  { id: "exposed", label: "Exposed or embarrassed", emoji: "🫣", group: "Situations", tags: [],
    words: "naked|nude|exposed|embarrass\\w*|humiliat\\w*",
    question: "Where do you worry about being seen, or judged by others?",
    popular: "Often read as vulnerability or fear of judgment." },
  { id: "death", label: "Death or endings", emoji: "🕯️", group: "Situations", tags: ["death"],
    words: "die|died|dying|dead|death|funeral|grave|corpse|killed|murder\\w*",
    question: "Is something ending or changing in your life, or is someone or something on your mind?",
    popular: "Often read as endings and transitions rather than literal death." },
  { id: "lucid", label: "Lucid moments", emoji: "👁️", group: "Situations", tags: ["lucid"],
    words: "lucid|realized i was dreaming|realised i was dreaming|knew i was dreaming|knew it was a dream",
    question: "What did you do once you realised you were dreaming, and what would you try next time?",
    popular: "Awareness inside a dream is a skill many people practise." },

  { id: "family", label: "Family", emoji: "👪", group: "People", tags: ["family"],
    words: "mother|mom|mum|mama|father|dad|sister|brother|parents?|family|grandmother|grandfather|grandma|grandpa|aunt|uncle|cousin|son|daughter",
    question: "How have your family relationships been feeling lately?",
    popular: "Often read as how you relate to the people closest to you." },
  { id: "partner", label: "Love and partners", emoji: "💞", group: "People", tags: ["love"],
    words: "boyfriend|girlfriend|husband|wife|partner|crush|kiss\\w*|ex|love\\w*|wedding",
    question: "What are you hoping for, or worried about, in your close relationships?",
    popular: "Often read as longing, closeness or unresolved feelings." },
  { id: "friends", label: "Friends", emoji: "🧑‍🤝‍🧑", group: "People", tags: [],
    words: "friend\\w*|classmates?|roommate\\w*",
    question: "Who matters most to you right now, and are you in touch with them?",
    popular: "Often read as your social life and sense of belonging." },
  { id: "strangers", label: "Strangers and shadows", emoji: "👤", group: "People", tags: [],
    words: "stranger\\w*|unknown (?:man|woman|person)|faceless|shadow\\w*|figure",
    question: "Who or what feels unfamiliar to you at the moment?",
    popular: "Often read as parts of yourself or situations you do not yet understand." },
  { id: "authority", label: "Authority figures", emoji: "🧑‍⚖️", group: "People", tags: [],
    words: "teacher|police|principal|doctor|judge|officer|king|president|professor",
    question: "Is anyone's judgment or authority weighing on you?",
    popular: "Often read as feeling evaluated or controlled." },

  { id: "water", label: "Water", emoji: "🌊", group: "Places", tags: ["water", "ocean"],
    words: "water|ocean|sea|river|lake|waves?|flood\\w*|swim\\w*|drown\\w*|rain\\w*|beach|pool|tsunami|boat|dive|diving",
    question: "How have your emotions been moving lately: calm, rising, or overwhelming?",
    popular: "Water is often read as emotion, with calm or stormy water matching mood." },
  { id: "home", label: "Houses and rooms", emoji: "🏠", group: "Places", tags: [],
    words: "house|home|room|kitchen|bedroom|door|stairs|staircase|basement|attic|apartment|hallway",
    question: "What does home, or safety, mean to you right now?",
    popular: "Often read as the self, or a sense of safety." },
  { id: "unfamiliar", label: "Unfamiliar places", emoji: "🗺️", group: "Places", tags: ["unknown-places"],
    words: "strange|unfamiliar|unknown|never seen|lost|maze|labyrinth|wander\\w*|different city",
    question: "Are you in a stage of change or uncertainty at the moment?",
    popular: "Often read as stepping into the unknown." },
  { id: "travel", label: "Travel and journeys", emoji: "🚆", group: "Places", tags: ["travel"],
    words: "car|bus|train|plane|airport|flight|driving|drive|road|journey|station|ship|bike|motorcycle|bridge",
    question: "Where do you feel you are heading, or wish you were going?",
    popular: "Often read as direction and the path you are on." },
  { id: "school", label: "School and study", emoji: "🎓", group: "Places", tags: ["school"],
    words: "school|class|classroom|exam\\w*|university|college|lecture|homework|assignment|campus",
    question: "What part of your studies, or of your past school years, is on your mind?",
    popular: "Often linked to being evaluated or learning something new." },
  { id: "work", label: "Work", emoji: "💼", group: "Places", tags: ["work"],
    words: "work|office|boss|job|meeting|colleague\\w*|coworker\\w*|manager|career|client|interview",
    question: "What about work, or your future career, has been taking up space in your mind?",
    popular: "Often linked to responsibility, ambition or pressure." },

  { id: "animals", label: "Animals", emoji: "🐾", group: "Creatures & elements", tags: ["animals"],
    words: "dog|dogs|cat|cats|snake\\w*|spider\\w*|bird\\w*|horse\\w*|wolf|wolves|bear|fish|tiger|lion|animal\\w*|insect\\w*|bat|rat|elephant|cow|monkey|crocodile",
    question: "What qualities do you personally associate with that animal? Your own associations matter most.",
    popular: "Often read as instincts, or traits you link to that animal." },
  { id: "supernatural", label: "Supernatural", emoji: "👻", group: "Creatures & elements", tags: ["supernatural"],
    words: "ghost\\w*|monster\\w*|demon\\w*|witch\\w*|magic\\w*|spirit\\w*|vampire\\w*|zombie\\w*|alien\\w*|angel\\w*|devil|haunt\\w*",
    question: "What feels bigger than you, or hard to explain, right now?",
    popular: "Often read as fears or forces that feel beyond your control." },
  { id: "fire", label: "Fire and intensity", emoji: "🔥", group: "Creatures & elements", tags: [],
    words: "fire|flames?|burn\\w*|smoke|explosion|explod\\w*",
    question: "Where is intensity or urgency showing up in your life?",
    popular: "Often read as anger, passion or transformation." },
  { id: "storm", label: "Darkness and storms", emoji: "⛈️", group: "Creatures & elements", tags: [],
    words: "dark\\w*|night|storm\\w*|thunder|lightning|tornado\\w*|hurricane|fog",
    question: "What feels unclear or turbulent at the moment?",
    popular: "Often read as uncertainty or a heavy mood." },
  { id: "teeth", label: "Teeth", emoji: "🦷", group: "Body", tags: [],
    words: "teeth|tooth|dentist|crumbl\\w*",
    question: "Is there a change, or a worry about how you present yourself or communicate?",
    popular: "Often read as worry about appearance, communication or change." },
];

const EMOTIONS = [
  { id: "fear", label: "Fear and worry", words: "afraid|scared|terrified|fear\\w*|panic\\w*|anxious|nervous|worried|dread\\w*|terror|horrif\\w*" },
  { id: "sadness", label: "Sadness and loss", words: "sad|cry\\w*|tears|grief|lonely|heartbroken|hopeless|loss" },
  { id: "anger", label: "Anger and conflict", words: "angry|furious|rage|yell\\w*|shout\\w*|fight\\w*|hate\\w*|argu\\w*" },
  { id: "joy", label: "Joy and calm", words: "happy|joy\\w*|laugh\\w*|excit\\w*|delight\\w*|peace\\w*|calm|relieved|free" },
  { id: "confusion", label: "Confusion", words: "confus\\w*|weird|unclear|puzzl\\w*|didn't understand|make sense" },
] as const;

const compile = (words: string) => new RegExp(`\\b(?:${words})\\b`, "i");
const THEME_RX = new Map(THEMES.map((t) => [t.id, compile(t.words)]));
const EMOTION_RX = new Map(EMOTIONS.map((e) => [e.id, compile(e.words)]));

const STOP = new Set(
  ("about above after again against all also always and any are around because been before being below between both but came can could did does doing done down during each even ever every few for from further get gets getting going gone got had has have having her here hers herself him himself his how into its itself just keep kept know knew like made make many may might more most much must myself never nor not now off once only other our ours out over own people really said same saw see seen she should since some still such take taken than that the their theirs them then there these they thing things this those though through thought too under until upon very want wanted was way were what when where whether which while who whom why will with within without would yet you your yours yourself " +
    "dream dreams dreamed dreamt dreaming suddenly something someone somewhere anything everyone everything felt feel feeling seemed seem looked look looking started began went come came back told tell asked knew think maybe kind sort then next first last time little long big small old new good bad able around right left another").split(/\s+/)
);

export interface ThemeStat {
  theme: Theme;
  count: number;
  share: number; // 0-1
  dreams: PatternDream[];
}
export interface WeekStat { start: string; total: number; hard: number; gentle: number }
export interface Echo { a: PatternDream; b: PatternDream; shared: string[] }
export interface PatternResult {
  total: number;
  themes: ThemeStat[];
  words: Array<{ word: string; count: number }>;
  moods: Array<{ mood: string; count: number }>;
  emotions: Array<{ id: string; label: string; count: number }>;
  weekdays: number[]; // Sunday..Saturday
  weekly: WeekStat[];
  echoes: Echo[];
  taggedRecurring: number;
}

const HARD_MOODS = new Set(["scared", "sad", "confused"]);
const GENTLE_MOODS = new Set(["peaceful", "happy", "excited"]);

export function themeIdsOf(d: Pick<PatternDream, "title" | "body" | "tags">): string[] {
  const text = `${d.title}\n${d.body}`;
  const tagSet = new Set(d.tags.map((t) => t.toLowerCase()));
  return THEMES.filter((t) => THEME_RX.get(t.id)!.test(text) || t.tags.some((tag) => tagSet.has(tag))).map((t) => t.id);
}

function mondayOf(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function wordsOf(d: PatternDream): Set<string> {
  const out = new Set<string>();
  for (const raw of `${d.title} ${d.body}`.toLowerCase().match(/[a-z']+/g) ?? []) {
    let w = raw.replace(/^'+|'+$/g, "");
    if (w.length < 4 || STOP.has(w)) continue;
    if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    if (!STOP.has(w)) out.add(w);
  }
  return out;
}

export function analyzeDreams(dreams: PatternDream[]): PatternResult {
  const total = dreams.length;
  const themeIdsByDream = new Map(dreams.map((d) => [d.id, themeIdsOf(d)]));

  const themes: ThemeStat[] = THEMES.map((theme) => {
    const hit = dreams.filter((d) => themeIdsByDream.get(d.id)!.includes(theme.id));
    return { theme, count: hit.length, share: total ? hit.length / total : 0, dreams: hit };
  })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.theme.label.localeCompare(b.theme.label));

  // Words that keep coming back (in 2+ different dreams)
  const wordCount = new Map<string, number>();
  for (const d of dreams) for (const w of wordsOf(d)) wordCount.set(w, (wordCount.get(w) ?? 0) + 1);
  const words = [...wordCount.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 14)
    .map(([word, count]) => ({ word, count }));

  const moodCount = new Map<string, number>();
  for (const d of dreams) if (d.mood) moodCount.set(d.mood, (moodCount.get(d.mood) ?? 0) + 1);
  const moods = [...moodCount.entries()].sort((a, b) => b[1] - a[1]).map(([mood, count]) => ({ mood, count }));

  const emotions = EMOTIONS.map((e) => ({
    id: e.id,
    label: e.label,
    count: dreams.filter((d) => EMOTION_RX.get(e.id)!.test(`${d.title}\n${d.body}`)).length,
  }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  const weekdays = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dreams) weekdays[new Date(`${d.dream_date}T00:00:00Z`).getUTCDay()]++;

  // Last 12 weeks of mood, so changes in tone are easy to spot.
  const weekMap = new Map<string, WeekStat>();
  for (const d of dreams) {
    const start = mondayOf(d.dream_date);
    const w = weekMap.get(start) ?? { start, total: 0, hard: 0, gentle: 0 };
    w.total++;
    if (d.mood && HARD_MOODS.has(d.mood)) w.hard++;
    if (d.mood && GENTLE_MOODS.has(d.mood)) w.gentle++;
    weekMap.set(start, w);
  }
  const weekly = [...weekMap.values()].sort((a, b) => a.start.localeCompare(b.start)).slice(-12);

  // Dreams that echo each other: they share at least two themes or tags.
  const keysOf = (d: PatternDream) =>
    new Set([...themeIdsByDream.get(d.id)!, ...d.tags.map((t) => `#${t.toLowerCase()}`).filter((t) => t !== "#dream-of-the-day")]);
  const echoes: Echo[] = [];
  const limited = dreams.slice(0, 120);
  for (let i = 0; i < limited.length; i++) {
    for (let j = i + 1; j < limited.length; j++) {
      const A = keysOf(limited[i]);
      const B = keysOf(limited[j]);
      const shared = [...A].filter((k) => B.has(k));
      const union = new Set([...A, ...B]).size;
      if (shared.length >= 2 && shared.length / union >= 0.4) {
        echoes.push({ a: limited[i], b: limited[j], shared });
      }
    }
  }
  echoes.sort((x, y) => y.shared.length - x.shared.length);

  return {
    total,
    themes,
    words,
    moods,
    emotions,
    weekdays,
    weekly,
    echoes: echoes.slice(0, 5),
    taggedRecurring: dreams.filter((d) => d.tags.map((t) => t.toLowerCase()).includes("recurring")).length,
  };
}

// A compact text version of the patterns, used as input for the optional AI report.
export function summaryForAi(dreams: PatternDream[], r: PatternResult): string {
  const lines: string[] = [];
  lines.push(`Number of dreams: ${r.total}`);
  if (r.themes.length) lines.push("Recurring themes: " + r.themes.slice(0, 8).map((t) => `${t.theme.label} (${t.count})`).join(", "));
  if (r.moods.length) lines.push("Moods chosen: " + r.moods.map((m) => `${m.mood} (${m.count})`).join(", "));
  if (r.emotions.length) lines.push("Feelings mentioned in the stories: " + r.emotions.map((e) => `${e.label} (${e.count})`).join(", "));
  if (r.words.length) lines.push("Words that keep coming back: " + r.words.slice(0, 10).map((w) => w.word).join(", "));
  lines.push("", "Recent dreams (newest first):");
  for (const d of dreams.slice(0, 25)) {
    const body = d.body.replace(/\s+/g, " ").trim();
    lines.push(`- ${d.dream_date} | mood: ${d.mood ?? "n/a"} | ${d.title}: ${body.length > 350 ? body.slice(0, 350) + "…" : body}`);
  }
  return lines.join("\n");
}

// Compares the most recent 4 weeks with the 4 weeks before them (only weeks you logged dreams).
export function toneShift(weekly: WeekStat[]) {
  const recent = weekly.slice(-4);
  const before = weekly.slice(-8, -4);
  const pct = (ws: WeekStat[]) => {
    const total = ws.reduce((n, w) => n + w.total, 0);
    return { total, hard: total ? Math.round((ws.reduce((n, w) => n + w.hard, 0) / total) * 100) : 0 };
  };
  const a = pct(recent);
  const b = pct(before);
  if (a.total < 3 || b.total < 3) return null;
  return { recentHard: a.hard, beforeHard: b.hard, recentTotal: a.total, beforeTotal: b.total };
}

// For one dream: which of its themes show up in your other dreams, and which dreams are similar.
export function relatedTo(dream: PatternDream, others: PatternDream[]) {
  const mine = themeIdsOf(dream);
  const otherThemes = others.map((o) => ({ o, ids: new Set(themeIdsOf(o)) }));
  const themes = mine
    .map((id) => ({ theme: THEMES.find((t) => t.id === id)!, others: otherThemes.filter((x) => x.ids.has(id)).length }))
    .filter((t) => t.others > 0)
    .sort((a, b) => b.others - a.others);
  const similar = otherThemes
    .map((x) => ({ o: x.o, shared: mine.filter((id) => x.ids.has(id)).length }))
    .filter((x) => x.shared >= 2)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 3)
    .map((x) => x.o);
  return { themes, similar };
}
