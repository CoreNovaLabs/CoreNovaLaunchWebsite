import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer, type ViteDevServer } from "vite";

import { allChecksPassed } from "../src/data/types.ts";
import type { AppCurrent, VerificationManifest } from "../src/data/types.ts";
import {
  selectableDataVolumes,
  selectableInstanceTypes,
  verifiedDeployOptions,
} from "../src/lib/deploy.ts";
import { deploymentHold } from "../src/lib/deploymentSafety.ts";

const snapshot = JSON.parse(
  readFileSync(new URL("../src/data/generated.json", import.meta.url), "utf8")
) as { apps: AppCurrent[]; versions: Record<string, VerificationManifest[]> };
let server: ViteDevServer;
let renderRoute: (path: string) => string;
const previousNodeEnv = process.env.NODE_ENV;

before(async () => {
  process.env.NODE_ENV = "production";
  server = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    mode: "production",
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  ({ renderRoute } = await server.ssrLoadModule("/src/entry-server.tsx"));
});
after(async () => {
  try {
    await server?.close();
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

const copy = {
  en: {
    tabs: ["Deployment", "Versions", "Technical information", "FAQ"],
    configure: "Configure deployment", review: "Review deployment", deploy: "Deploy on AWS",
    documentation: "Official documentation", screenshot: "Screenshot from verification",
    customize: "Customize configuration", recommended: "Recommended configuration",
    unavailable: "Needs re-verification", paused: "Deployment paused", costFallback: "Shown in AWS",
    fields: ["Version", "AWS Regions", "Instance", "Persistent data volume"],
    cost: (usd: number) => `≈ $${usd}/mo`,
  },
  zh: {
    tabs: ["部署", "版本", "技术信息", "常见问题"],
    configure: "配置部署", review: "查看部署状态", deploy: "部署到 AWS",
    documentation: "官方文档", screenshot: "验证时截图",
    customize: "自定义配置", recommended: "推荐配置",
    unavailable: "需要重新验证", paused: "暂停部署", costFallback: "以 AWS 为准",
    fields: ["部署版本", "AWS 区域", "规格", "持久化数据卷"],
    cost: (usd: number) => `≈ $${usd}/月`,
  },
};
const text = (html: string) => html.replace(/<[^>]*>/g, "").trim();
const sectionIds = ["deployment", "versions", "configuration", "faq"];

for (const app of snapshot.apps.filter((item) => item.health === "passed")) {
  for (const locale of ["en", "zh"] as const) {
    test(`AppDetail SSR /${locale}/apps/${app.app}/`, () => {
      const c = copy[locale];
      const html = renderRoute(`/${locale}/apps/${app.app}/`);
      const versions = snapshot.versions[app.app].filter((record) => allChecksPassed(record.checks));
      const manifest = versions.find((record) => record.app_version === app.app_version);
      assert.ok(manifest);
      const current = manifest.website;
      const options = verifiedDeployOptions(current, manifest.container.digest);
      const tabs = html.match(/<nav class="tabs"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
      assert.ok(tabs);
      assert.deepEqual([...tabs.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]), sectionIds);
      assert.deepEqual([...tabs.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((match) => text(match[1])), c.tabs);
      for (const id of sectionIds) assert.ok(html.includes(`id="${id}"`));
      assert.doesNotMatch(html, /(?:id|href)="#?overview"|class="detail-feature-list"/);

      const hero = html.match(/<header class="detail-header">([\s\S]*?)<\/header>/)?.[1];
      assert.ok(hero);
      const heroButton = hero.match(/<button class="btn btn--primary"[^>]*>([\s\S]*?)<\/button>/)?.[1];
      assert.equal(text(heroButton ?? ""), options ? c.configure : c.review);
      const documentLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
        .filter((match) => match[1] === app.deploy.documentation_url);
      assert.equal(documentLinks.length, 1);
      assert.equal(text(documentLinks[0][2]), c.documentation);
      if (app.screenshots_order.length > 0) {
        assert.ok(hero.includes(c.screenshot));
        assert.match(hero, /class="shot-zoom"/);
      }

      const awsButton = html.match(/<div class="deploy-configurator__action">\s*<button([^>]*)>([\s\S]*?)<\/button>/);
      assert.ok(awsButton);
      assert.equal(text(awsButton[2]), c.deploy);
      assert.equal(/\bdisabled(?:=|\s|$)/.test(awsButton[1]), !options);
      assert.ok(html.includes(`<h3>${
        options ? c.recommended : deploymentHold(current) ? c.paused : c.unavailable
      }</h3>`));
      assert.ok(html.includes(`deploy-configurator__status ${options ? "is-verified" : "is-unavailable"}`));
      assert.doesNotMatch(html, /<details\b[^>]*\bopen(?:=|\s|>)/);
      const summary = html.match(/<dl class="deployment-summary">([\s\S]*?)<\/dl>/)?.[1];
      const customize = html.match(/<details class="deployment-customize">([\s\S]*?)<\/details>/)?.[1];
      if (!options) {
        assert.equal(summary, undefined);
        assert.equal(customize, undefined);
        assert.doesNotMatch(html, /<select\b/);
        return;
      }

      assert.ok(summary);
      assert.ok(customize);
      assert.deepEqual([...summary.matchAll(/<dt>(.*?)<\/dt>/g)].map((match) => text(match[1])), c.fields);
      assert.deepEqual([...summary.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((match) => text(match[1])), [
        options.appVersion, options.region, options.instanceType, `${options.dataVolumeGb} GB`,
      ]);
      const cost = current.deploy.cost_estimate;
      assert.ok(html.includes(`<strong>${cost ? c.cost(cost.monthly_usd) : c.costFallback}</strong>`));
      assert.ok(customize.includes(c.customize));
      assert.doesNotMatch(customize, /class="deployment-summary"/);
      assert.doesNotMatch(html, /class="[^"]*deployment-reset/);
      const selects = [...customize.matchAll(/<select([^>]*)>([\s\S]*?)<\/select>/g)];
      const choices = [
        versions.filter((record) => verifiedDeployOptions(record.website, record.container.digest)).map((record) => record.app_version),
        current.deploy.regions,
        selectableInstanceTypes(options.instanceType),
        selectableDataVolumes(options.dataVolumeGb).map(String),
      ];
      const defaults = [options.appVersion, options.region, options.instanceType, String(options.dataVolumeGb)];
      assert.equal(selects.length, 4);
      assert.equal([...html.matchAll(/<select\b/g)].length, 4);
      selects.forEach((select, index) => {
        const items = [...select[2].matchAll(/<option([^>]*)value="([^"]+)"([^>]*)>/g)];
        assert.deepEqual(items.map((item) => item[2]), choices[index]);
        assert.deepEqual(items.filter((item) => /\bselected=/.test(item[1] + item[3])).map((item) => item[2]), [defaults[index]]);
        assert.equal(/\bdisabled=/.test(select[1]), choices[index].length <= 1);
      });
    });
  }
}

test("DeployGuide binds the verification evidence to the one-click template revision", async () => {
  // deployment-contract §2.4：current.json 的 deploy.template 让“这份证据对应的
  // 模板是哪版”可查。组件级渲染验证：generated.json 旧记录无此字段（可选展示），
  // 故注入字段直接渲染，锁定展示契约与 revision 短哈希/模板链接的渲染路径。
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  const { DeployGuide } = await server.ssrLoadModule("/src/components/DeployGuide.tsx");
  const { I18nProvider } = await server.ssrLoadModule("/src/i18n.tsx");
  const current = {
    app: "ghost",
    app_version: "v6.62.0",
    deploy: {
      documentation_url: "https://ghost.org/docs/",
      regions: ["us-east-1"],
      instance_type: "t3.small",
      container_port: 2368,
      data_volume_gb: 30,
      docker_image: "ghost:6.62.0-alpine",
      data_path: "/var/lib/ghost/content",
      health_check_path: "/",
      template: {
        url: "https://corenovalaunch-templates.s3.us-east-1.amazonaws.com/corenova-one-click.template.yaml",
        revision: "f14bc41776ef92827a97184784dc5519b9c576ac",
      },
    },
  } as never;
  const html = renderToString(
    createElement(I18nProvider, { locale: "en" }, createElement(DeployGuide, { app: current }))
  );
  assert.ok(html.includes("deploy-guide__meta"));
  assert.ok(html.includes("f14bc41"));
  assert.ok(html.includes("corenova-one-click.template.yaml"));
});
