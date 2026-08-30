// Markdown docs source of truth. Dropping a *.md file into this directory
// publishes /docs/<slug> and its prerender route (seo.ts enumerates from here).
const files = import.meta.glob("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface DocFile {
  slug: string;
  title: string;
  excerpt: string;
  raw: string;
}

export const DOCS: DocFile[] = Object.entries(files)
  .map(([p, raw]) => {
    const slug = (p.split("/").pop() ?? p).replace(/\.md$/, "");
    const title = /^#\s+(.+)$/m.exec(raw)?.[1]?.trim() ?? slug;
    const excerpt =
      raw
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .find((s) => s && !s.startsWith("#")) ?? "";
    return { slug, title, excerpt, raw };
  })
  .sort((a, b) => a.title.localeCompare(b.title));
