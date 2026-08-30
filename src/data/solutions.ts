import type { Solution } from "./types";

// Solutions are scenario-based groupings (docs/website-design.md §3.7).
// They are orthogonal to categories: categories = objective type, solutions =
// user intent. App metadata is reused from the apps dataset, not duplicated.
export const SOLUTIONS: Solution[] = [
  {
    slug: "private-ai",
    title: { en: "Private AI Assistant", zh: "私有 AI 助手" },
    description: {
      en: "Run your own ChatGPT alternative entirely on your infrastructure.",
      zh: "在你的基础设施上完整运行属于自己的 ChatGPT 替代方案。",
    },
    icon: "🤖",
    apps: ["ollama", "open-webui", "n8n"],
    architecture: {
      en: "Ollama (models) → Open WebUI (UI) → n8n (automation)",
      zh: "Ollama（模型）→ Open WebUI（界面）→ n8n（自动化）",
    },
  },
  {
    slug: "replace-workspace",
    title: { en: "Replace Workspace", zh: "替代办公套件" },
    description: {
      en: "Self-hosted docs, files and secrets to replace SaaS subscriptions.",
      zh: "自托管的文档、文件与密钥，替代 SaaS 订阅。",
    },
    icon: "☁️",
    apps: ["nextcloud"],
    architecture: {
      en: "Nextcloud (files + collaboration)",
      zh: "Nextcloud（文件 + 协作）",
    },
  },
  {
    slug: "media-photos",
    title: { en: "Media & Photos", zh: "媒体与照片" },
    description: {
      en: "Back up and stream your own photos and videos privately.",
      zh: "私有地备份与串流你自己的照片和视频。",
    },
    icon: "🖼️",
    apps: ["immich"],
    architecture: {
      en: "Immich (backup + timeline)",
      zh: "Immich（备份 + 时间线）",
    },
  },
];

export function getSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}
