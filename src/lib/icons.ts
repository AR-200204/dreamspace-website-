import {
  ArrowDown, Blocks, Briefcase, CloudLightning, Compass, Eye, Feather, Flame, Footprints, Ghost, GraduationCap,
  Hash, Heart, House, Hourglass, Laugh, Lock, Map, PawPrint, Plane, Repeat, Smile, Sparkles, TrainFront, User,
  Users, Waves, Clock, Gavel, UserRound, type LucideIcon,
} from "lucide-react";

// Icons for the pattern themes (so the interface uses one consistent icon style instead of emoji).
const THEME_ICONS: Record<string, LucideIcon> = {
  falling: ArrowDown, flying: Feather, chased: Footprints, unprepared: Clock, trapped: Lock, exposed: Eye,
  death: Hourglass, lucid: Eye, family: Users, partner: Heart, friends: UserRound, strangers: User,
  authority: Gavel, water: Waves, home: House, unfamiliar: Map, travel: TrainFront, school: GraduationCap,
  work: Briefcase, animals: PawPrint, supernatural: Ghost, fire: Flame, storm: CloudLightning, teeth: Smile,
};
export function themeIcon(id: string): LucideIcon {
  return THEME_ICONS[id] ?? Sparkles;
}

// Icons for the category tags on the Explore page.
const TAG_ICONS: Record<string, LucideIcon> = {
  nightmare: Ghost, flying: Feather, falling: ArrowDown, chasing: Footprints, animals: PawPrint, love: Heart,
  family: Users, school: GraduationCap, work: Briefcase, travel: Plane, death: Hourglass, water: Waves,
  "unknown-places": Map, supernatural: Sparkles, lucid: Eye, recurring: Repeat, childhood: Blocks, funny: Laugh,
  adventure: Compass,
};
export function tagIcon(name: string): LucideIcon {
  return TAG_ICONS[name] ?? Hash;
}
