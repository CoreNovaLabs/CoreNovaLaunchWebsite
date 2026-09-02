// Markdown docs source of truth. Dropping a `foo.md` file into this directory
// publishes /docs/foo and its prerender route (seo.ts enumerates from here).
// A `foo.zh.md` file next to `foo.md` provides the Chinese variant; the base
// file is English and remains the fallback for locales without a variant.
import type { Locale } from "../data/types";

const files = import.meta.glob("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

interface DocVariant {
  title: string;
  excerpt: string;
  raw: string;
}

export interface DocFile extends DocVariant {
  slug: string;
  zh?: DocVariant;
}

function variantOf(raw: string, slug: string): DocVariant {
  const title = /^#\s+(.+)$/m.exec(raw)?.[1]?.trim() ?? slug;
  const excerpt =
    raw
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .find((s) => s && !s.startsWith("#")) ?? "";
  return { title, excerpt, raw };
}

const BY_SLUG: Record<string, DocFile> = Object.entries(files)
  .map(([p, raw]) => {
    const file = p.split("/").pop() ?? p;
    const zhSlug = /^([\w-]+)\.zh\.md$/.exec(file)?.[1];
    return { slug: zhSlug ?? file.replace(/\.md$/, ""), raw, isZh: Boolean(zhSlug) };
  })
  .reduce<Record<string, DocFile>>((acc, { slug, raw, isZh }) => {
    if (isZh) {
      // zh may be globbed before its en base — merge without clobbering it
      const base = acc[slug] ?? { slug, title: slug, excerpt: "", raw: "" };
      acc[slug] = { ...base, zh: variantOf(raw, slug) };
    } else {
      acc[slug] = { slug, ...variantOf(raw, slug), zh: acc[slug]?.zh };
    }
    return acc;
  }, {});

export const DOCS: DocFile[] = Object.values(BY_SLUG).sort((a, b) =>
  a.title.localeCompare(b.title)
);

// Locale-aware view of a doc: the zh variant when present and requested,
// otherwise the English base.
export function docVariant(doc: DocFile, locale: Locale): DocVariant {
  return locale === "zh" && doc.zh ? doc.zh : doc;
}
