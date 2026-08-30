import type { Locale } from "../data/types";

// Relative time, e.g. "2 hours ago" / "2 小时前". Computed against real now.
export function timeAgo(iso: string, locale: Locale): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (locale === "zh") {
    if (sec < 60) return "刚刚";
    if (min < 60) return `${min} 分钟前`;
    if (hr < 24) return `${hr} 小时前`;
    if (day < 30) return `${day} 天前`;
    return formatDate(iso, locale);
  }
  if (sec < 60) return "just now";
  if (min < 60) return `${min} minutes ago`;
  if (hr < 24) return `${hr} hours ago`;
  if (day < 30) return `${day} days ago`;
  return formatDate(iso, locale);
}

// Absolute date, e.g. "Aug 25, 2026" / "2026年8月25日".
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (locale === "zh") {
    return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Compact large numbers: 48000 → "48k".
export function compactNumber(n: number, locale: Locale): string {
  if (locale === "zh") {
    if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`;
    return String(n);
  }
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}
