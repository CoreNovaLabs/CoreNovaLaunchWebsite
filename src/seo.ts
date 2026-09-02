import type { AppCurrent, Locale, Localized } from "./data/types";
import { APPS_BY_INDEX, siteScreenshotUrl } from "./data/generated";
import { CATEGORIES } from "./data/categories";
import { SOLUTIONS } from "./data/solutions";
import { DOCS, docVariant } from "./content/docs";
import { APP_FAQ } from "./data/faq";
import { dicts } from "./i18n";

// Build-time SEO metadata for prerendered routes (docs/website-design.md §4).
// Consumed by scripts/prerender.mjs via src/entry-server.tsx.
export const SITE_ORIGIN = "https://corenova-website.pages.dev";

const BRAND = "CoreNova Launch";
const LOCALES: Locale[] = ["en", "zh"];

const L = (v: Localized, lang: Locale) => v[lang];
const t = (lang: Locale, key: string) => dicts[lang][key] ?? dicts.en[key] ?? key;
export const absUrl = (path: string) => SITE_ORIGIN + path;
export const routePath = (lang: Locale, sub = "/") =>
  sub === "/" ? `/${lang}/` : `/${lang}${sub}`;

export interface PrerenderRoute {
  path: string;
  lang: Locale;
  title: string;
  description: string;
  jsonLd: unknown[];
  // Absolute URL for og:image / twitter:image; omitted when the page has none.
  image?: string;
}

function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

function homeRoutes(lang: Locale): PrerenderRoute {
  return {
    path: routePath(lang),
    lang,
    title: lang === "zh"
      ? "在 AWS 上一键部署开源软件 | CoreNova Launch"
      : "Open Source Software One-Click Deploy to AWS | CoreNova Launch",
    description: t(lang, "hero_subtitle"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: BRAND,
        url: absUrl(routePath(lang)),
        inLanguage: lang,
      },
    ],
  };
}

function listPageRoutes(
  lang: Locale,
  sub: string,
  title: string,
  descKey: string,
  crumbName: string
): PrerenderRoute {
  const path = routePath(lang, sub);
  return {
    path,
    lang,
    title,
    description: t(lang, descKey),
    jsonLd: [
      breadcrumb([
        { name: t(lang, "home"), path: routePath(lang) },
        { name: crumbName, path },
      ]),
    ],
  };
}

function appDetailRoutes(app: AppCurrent): PrerenderRoute[] {
  const cat = CATEGORIES.find((c) => c.slug === app.category);
  return LOCALES.map((lang) => {
    const name = L(app.display_name, lang);
    const catName = cat ? L(cat.name, lang) : "";
    const path = routePath(lang, `/apps/${app.app}/`);
    return {
      path,
      lang,
      title:
        lang === "zh"
          ? `一键部署 ${name} 到 AWS - ${catName} | ${BRAND}`
          : `Deploy ${name} to AWS in One Click - ${catName} | ${BRAND}`,
      description:
        lang === "zh"
          ? `${L(app.description, lang)}。预验证开源软件，AWS 一键部署。`
          : `${L(app.description, lang)}. One-click deploy on AWS, pre-verified and automatically tested.`,
      // Social share card: first verified screenshot, else the app icon.
      image: absUrl(
        app.screenshots.length > 0 ? siteScreenshotUrl(app.screenshots[0].url) : app.icon
      ),
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name,
          applicationCategory: catName,
          operatingSystem: "Linux (Docker / AWS EC2)",
          softwareVersion: app.app_version,
          url: absUrl(path),
          image: absUrl(app.icon),
          screenshot: app.screenshots.map((s) => absUrl(siteScreenshotUrl(s.url))),
          installUrl: app.deploy.launch_url,
        },
        breadcrumb([
          { name: t(lang, "home"), path: routePath(lang) },
          { name: t(lang, "software"), path: routePath(lang, "/apps/") },
          { name, path },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: APP_FAQ.map((item) => ({
            "@type": "Question",
            name: lang === "zh" ? "部署与验证是怎么分工的？" : "How do verification and deployment split?",
            acceptedAnswer: { "@type": "Answer", text: L(item, lang) },
          })),
        },
      ],
    };
  });
}

function versionsRoutes(app: AppCurrent): PrerenderRoute[] {
  const name = app.display_name.en;
  return LOCALES.map((lang) => {
    const path = routePath(lang, `/apps/${app.app}/versions/`);
    return {
      path,
      lang,
      title:
        lang === "zh"
          ? `${L(app.display_name, lang)} 版本历史 - 已验证发布记录 | ${BRAND}`
          : `${L(app.display_name, lang)} Versions - Verified Release History | ${BRAND}`,
      description:
        lang === "zh"
          ? `${name} 全部已验证版本与发布历史。`
          : `All verified versions and release history for ${name}.`,
      jsonLd: [
        breadcrumb([
          { name: t(lang, "home"), path: routePath(lang) },
          { name: t(lang, "software"), path: routePath(lang, "/apps/") },
          { name: L(app.display_name, lang), path: routePath(lang, `/apps/${app.app}/`) },
          { name: t(lang, "versions"), path },
        ]),
      ],
    };
  });
}

function categoryRoutes(): PrerenderRoute[] {
  return CATEGORIES.flatMap((cat) =>
    LOCALES.map((lang) => {
      const path = routePath(lang, `/categories/${cat.slug}/`);
      return {
        path,
        lang,
        title:
          lang === "zh"
            ? `${L(cat.name, lang)} 一键部署到 AWS | ${BRAND}`
            : `Open Source ${L(cat.name, lang)} Deploy to AWS | ${BRAND}`,
        description: L(cat.description, lang),
        jsonLd: [
          breadcrumb([
            { name: t(lang, "home"), path: routePath(lang) },
            { name: t(lang, "software"), path: routePath(lang, "/apps/") },
            { name: L(cat.name, lang), path },
          ]),
        ],
      };
    })
  );
}

function solutionDetailRoutes(): PrerenderRoute[] {
  return SOLUTIONS.flatMap((sol) =>
    LOCALES.map((lang) => {
      const path = routePath(lang, `/solutions/${sol.slug}/`);
      return {
        path,
        lang,
        title:
          lang === "zh"
            ? `${L(sol.title, lang)} 一键部署 AWS | ${BRAND}`
            : `Deploy ${L(sol.title, lang)} on AWS | ${BRAND}`,
        description: L(sol.description, lang),
        jsonLd: [
          breadcrumb([
            { name: t(lang, "home"), path: routePath(lang) },
            { name: t(lang, "solutions"), path: routePath(lang, "/solutions/") },
            { name: L(sol.title, lang), path },
          ]),
        ],
      };
    })
  );
}

function docsRoutes(): PrerenderRoute[] {
  const index = LOCALES.map((lang) =>
    listPageRoutes(
      lang,
      "/docs/",
      lang === "zh" ? "文档 | CoreNova Launch" : "Documentation | CoreNova Launch",
      "docs_subtitle",
      t(lang, "docs_title")
    )
  );
  const details = DOCS.flatMap((d) =>
    LOCALES.map((lang) => {
      const v = docVariant(d, lang);
      const path = routePath(lang, `/docs/${d.slug}/`);
      return {
        path,
        lang,
        title: `${v.title} | ${BRAND}`,
        description: v.excerpt,
        jsonLd: [
          breadcrumb([
            { name: t(lang, "home"), path: routePath(lang) },
            { name: t(lang, "docs_title"), path: routePath(lang, "/docs/") },
            { name: v.title, path },
          ]),
        ],
      };
    })
  );
  return [...index, ...details];
}

export function enumerateRoutes(): PrerenderRoute[] {
  const apps = APPS_BY_INDEX.filter((a) => a.health === "passed");
  return [
    ...LOCALES.map((lang) => homeRoutes(lang)),
    ...LOCALES.map((lang) =>
      listPageRoutes(
        lang,
        "/apps/",
        lang === "zh"
          ? "浏览可一键部署的开源软件 | CoreNova Launch"
          : "Browse Open Source Software to Deploy on AWS | CoreNova Launch",
        "browse_subtitle",
        t(lang, "software")
      )
    ),
    ...LOCALES.map((lang) =>
      listPageRoutes(
        lang,
        "/updates/",
        lang === "zh" ? "更新 | CoreNova Launch" : "Updates | CoreNova Launch",
        "updates_subtitle",
        t(lang, "updates")
      )
    ),
    ...LOCALES.map((lang) =>
      listPageRoutes(
        lang,
        "/solutions/",
        lang === "zh" ? "解决方案 | CoreNova Launch" : "Solutions | CoreNova Launch",
        "solutions_subtitle",
        t(lang, "solutions")
      )
    ),
    ...apps.flatMap(appDetailRoutes),
    ...apps.flatMap(versionsRoutes),
    ...categoryRoutes(),
    ...solutionDetailRoutes(),
    ...docsRoutes(),
  ];
}
