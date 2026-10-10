"use client";

import { useEffect, useRef } from "react";

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A date field that defaults to YOUR local "today" (not the server's), so streaks count the right day.
export function LocalDateInput({ id, name, defaultValue }: { id: string; name: string; defaultValue?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const today = localToday();
    el.max = today;
    if (!el.value) el.value = today;
  }, []);

  return <input ref={ref} id={id} name={name} type="date" defaultValue={defaultValue} className="input" />;
}
