import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV = "production";

// Build-time prerender: renders every route to static HTML with per-page SEO
// meta (docs/website-design.md §4), based on the vite client build template.
// Run after `vite build` and `vite build --ssr`.

const root = process.cwd();
const dist = path.join(root, "dist");

const mod = await import(
  pathToFileURL(path.join(root, ".ssr", "entry-server.js")).href
);
const { enumerateRoutes, SITE_ORIGIN, renderRoute } = mod;

const templatePath = path.join(dist, "index.html");
const template = fs.readFileSync(templatePath, "utf8");

const escAttr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const ldJson = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const restOf = (p) => p.slice(4); // "/en/x" | "/zh/x" -> "x"
const enUrlOf = (p) => `${SITE_ORIGIN}/en/${restOf(p)}`;
const zhUrlOf = (p) => `${SITE_ORIGIN}/zh/${restOf(p)}`;
const siblingPath = (p) => (p.startsWith("/zh/") ? "/en/" + restOf(p) : "/zh/" + restOf(p));

const routes = enumerateRoutes();

for (const route of routes) {
  const bodyHtml = renderRoute(route.path);
  const abs = SITE_ORIGIN + route.path;

  // Function-form replacements: titles/descriptions are data, and a string
  // replacement would re-interpret `$&` / `$'` sequences inside them.
  let page = template
    .replace('<html lang="en">', () => `<html lang="${route.lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escAttr(route.title)}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      () => `<meta name="description" content="${escAttr(route.description)}" />`
    )
    .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`);

  const headExtras = [
    `<link rel="canonical" href="${abs}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrlOf(route.path)}" />`,
    `<link rel="alternate" hreflang="zh" href="${zhUrlOf(route.path)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${enUrlOf(route.path)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="CoreNova Launch" />`,
    `<meta property="og:title" content="${escAttr(route.title)}" />`,
    `<meta property="og:description" content="${escAttr(route.description)}" />`,
    `<meta property="og:url" content="${abs}" />`,
    `<meta property="og:locale" content="${route.lang === "zh" ? "zh_CN" : "en_US"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(route.image
      ? [
          `<meta property="og:image" content="${escAttr(route.image)}" />`,
          `<meta name="twitter:image" content="${escAttr(route.image)}" />`,
        ]
      : []),
    ...route.jsonLd.map(ldJson),
  ].join("\n    ");

  page = page.replace("</head>", `    ${headExtras}\n  </head>`);

  const outFile =
    route.path === "/"
      ? path.join(dist, "index.html")
      : path.join(dist, route.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, page);
}

// SPA fallback: unfetched 404.html gets real 404 status from Pages, the client
// bundle renders the NotFound route.
fs.writeFileSync(path.join(dist, "404.html"), template);

// x-default always points at the English page — in the <head> and here alike.
const sitemapUrls = routes
  .map((r) => {
    const abs = SITE_ORIGIN + r.path;
    const sibling = SITE_ORIGIN + siblingPath(r.path);
    return `  <url>
    <loc>${abs}</loc>
    <xhtml:link rel="alternate" hreflang="${r.lang}" href="${abs}" />
    <xhtml:link rel="alternate" hreflang="${r.lang === "en" ? "zh" : "en"}" href="${sibling}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrlOf(r.path)}" />
  </url>`;
  })
  .join("\n");
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapUrls}\n</urlset>\n`
);
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
);

console.log(`[prerender] ${routes.length} routes, sitemap + robots written to dist/`);
