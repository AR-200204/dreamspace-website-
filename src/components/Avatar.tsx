import { cn } from "@/lib/utils";

export function Avatar({ url, name, className }: { url?: string | null; name: string; className?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" className={cn("shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full bg-white/8 font-display uppercase text-moon", className)}>
      {name[0]}
    </span>
  );
}
