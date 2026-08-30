import type { CategoryMeta } from "./types";

// Category slugs are the source of truth for both the list-page filter
// (docs/website-design.md §3.2) and the category pages (§3.6).
export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "ai",
    name: { en: "AI & ML", zh: "AI 与机器学习" },
    description: {
      en: "Run and serve large language models and AI interfaces on your own infrastructure.",
      zh: "在自己的基础设施上运行和托管大语言模型与 AI 界面。",
    },
  },
  {
    slug: "cms",
    name: { en: "CMS & Publishing", zh: "内容管理与发布" },
    description: {
      en: "Open-source content management and publishing platforms.",
      zh: "开源内容管理与发布平台。",
    },
  },
  {
    slug: "media",
    name: { en: "Media & Photos", zh: "媒体与照片" },
    description: {
      en: "Self-hosted photo, video and media backup solutions.",
      zh: "自托管的照片、视频与媒体备份方案。",
    },
  },
  {
    slug: "devops",
    name: { en: "DevOps & Automation", zh: "DevOps 与自动化" },
    description: {
      en: "Workflow automation and integration tooling for technical teams.",
      zh: "面向技术团队的工作流自动化与集成工具。",
    },
  },
  {
    slug: "productivity",
    name: { en: "Productivity", zh: "生产力" },
    description: {
      en: "Self-hosted collaboration and productivity platforms.",
      zh: "自托管协作与生产力平台。",
    },
  },
];

export function getCategory(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
