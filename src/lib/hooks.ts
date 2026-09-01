import { useEffect, useState } from "react";
import { DATA_GENERATED_AT } from "../data/generated";
import { timeAgo } from "./format";
import type { Locale } from "../data/types";

// Set document.title for the current page (SEO, docs/website-design.md §4).
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

// Relative time that stays SSR-safe: renders against the build-time data
// timestamp until mount (matching the prerendered HTML exactly), then switches
// to the live clock so the label keeps ageing in the browser.
export function useTimeAgo(iso: string, locale: Locale): string {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return timeAgo(iso, locale, mounted ? undefined : new Date(DATA_GENERATED_AT).getTime());
}
