import type { Localized } from "./types";

// FAQ shown on the app detail page (#faq) and emitted as JSON-LD FAQPage.
export const APP_FAQ: Localized[] = [
  {
    en: "CoreNova Launch verifies software and provides deployable artifacts; deployment runs in your own AWS account.",
    zh: "CoreNova Launch 负责验证与提供可部署产物，部署在你自己的 AWS 账号中进行。",
  },
  {
    en: "Verification status comes from the upstream Manifest — the site never guesses it.",
    zh: "验证状态来自上游 Manifest，官网不自行推断。",
  },
];
