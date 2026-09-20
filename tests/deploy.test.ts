import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeployUrl,
  ONE_CLICK_TEMPLATE_URL,
  selectableDataVolumes,
  selectableInstanceTypes,
  stackNameFor,
  verifiedDeployOptions,
} from "../src/lib/deploy.ts";

const current = {
  app: "ghost",
  app_version: "v6.62.0",
  ami_id: "ami-0123456789abcdef0",
  region: "us-east-1",
  deploy: {
    docker_image: "ghost:6.62.0-alpine",
    container_port: 2368,
    regions: ["us-east-1"],
    instance_type: "t3.small",
    data_volume_gb: 30,
    data_path: "/var/lib/ghost/content",
    health_check_path: "/",
    app_url_env_name: "url",
    extra_environment: ["database__client=sqlite3"],
  },
} as never;

test("deep link maps every verified runtime field to its CloudFormation parameter", () => {
  const options = verifiedDeployOptions(current, "sha256:abc123");
  assert.ok(options);
  const url = new URL(buildDeployUrl(options));
  const params = new URLSearchParams(url.hash.split("?")[1]);

  assert.equal(params.get("stackName"), "corenova-ghost-v6-62-0");
  assert.equal(params.get("param_ImageReference"), "ghost:6.62.0-alpine@sha256:abc123");
  assert.equal(params.get("param_AmiId"), "ami-0123456789abcdef0");
  assert.equal(params.get("param_InstanceType"), "t3.small");
  assert.equal(params.get("param_DataVolumeSize"), "30");
  assert.equal(params.get("param_DataContainerPath"), "/var/lib/ghost/content");
  assert.equal(params.get("param_HealthCheckPath"), "/");
  assert.equal(params.get("param_AppUrlEnvironmentName"), "url");
  assert.equal(params.get("param_ExtraEnvironment"), "database__client=sqlite3");
  assert.equal(params.has("param_DiskGb"), false);
});

test("old records cannot silently deploy with template defaults", () => {
  const incomplete = structuredClone(current) as typeof current;
  delete (incomplete as { deploy: { health_check_path?: string } }).deploy.health_check_path;
  assert.equal(verifiedDeployOptions(incomplete, "sha256:abc123"), null);
  assert.equal(verifiedDeployOptions(current, undefined), null);
});

test("version identity prevents two verified versions from sharing one stack name", () => {
  assert.notEqual(stackNameFor("ghost", "v6.61.0"), stackNameFor("ghost", "v6.62.0"));
});

test("resource selectors only offer upward choices from the verified baseline", () => {
  assert.deepEqual(selectableInstanceTypes("t3.medium"), [
    "t3.medium",
    "t3.large",
    "t3.xlarge",
    "t3.2xlarge",
  ]);
  assert.deepEqual(selectableInstanceTypes("m7i.large"), ["m7i.large"]);
  assert.deepEqual(selectableDataVolumes(30), [30, 60, 120]);
});

test("a user-selected upward resource override is mapped to the deep link", () => {
  const verified = verifiedDeployOptions(current, "sha256:abc123");
  assert.ok(verified);
  const url = new URL(
    buildDeployUrl({ ...verified, instanceType: "t3.large", dataVolumeGb: 120 })
  );
  const params = new URLSearchParams(url.hash.split("?")[1]);
  assert.equal(params.get("param_InstanceType"), "t3.large");
  assert.equal(params.get("param_DataVolumeSize"), "120");
});

test("contract hold (deploy.hold) blocks the deploy entry even on published data", () => {
  // “已验证”≠“当前可部署”：hold 由 apps/*.yaml 声明，发布数据携带时必须拦截
  const held = JSON.parse(JSON.stringify(current));
  held.deploy.hold = { reason: { en: "paused", zh: "暂停部署" } };
  assert.equal(verifiedDeployOptions(held, "sha256:abc123"), null);
});

test("migration window closed: blocking comes solely from published deploy.hold", () => {
  // 兜底表已随 L1.5（deployment-contract §2.6）自动解暂停而清空（2026-09-20）：
  // 构建期表若残留，会在 Repo C 解除 hold 后继续静默拦截官网。
  const released = JSON.parse(JSON.stringify(current));
  released.app = "vikunja";
  delete released.deploy.hold;
  assert.ok(verifiedDeployOptions(released, "sha256:abc123"));
});

test("production contract checks are carried into the deep link parameters", () => {
  // deployment-contract §2.6：核对通过的应用，深链必须默认开启对应保护，
  // 否则部署形态退回核对前的未保护基线。
  const guarded = JSON.parse(JSON.stringify(current));
  guarded.deploy.production_contract = { checks: ["admin_auth", "host_metrics", "data_dir_write"] };
  const url = new URL(buildDeployUrl(verifiedDeployOptions(guarded, "sha256:abc123")!));
  const params = new URLSearchParams(url.hash.split("?")[1]);
  assert.equal(params.get("param_AdminAuthEnabled"), "true");
  assert.equal(params.get("param_HostMetricsAccess"), "true");

  // 旧记录无该字段 → 不携带任何新参数（模板默认值即未保护基线，行为不变）。
  const legacyUrl = new URL(buildDeployUrl(verifiedDeployOptions(current, "sha256:abc123")!));
  const legacyParams = new URLSearchParams(legacyUrl.hash.split("?")[1]);
  assert.equal(legacyParams.has("param_AdminAuthEnabled"), false);
  assert.equal(legacyParams.has("param_HostMetricsAccess"), false);
});

test("deep link templateURL stays pinned to the published one-click template object", () => {
  // deployment-contract §2.4：站点不自托管模板副本，深链必须指向发布桶的同一对象；
  // 验证证据的 deploy.template.revision 也由同一份合并输出计算（corenova/usertemplate）。
  assert.match(
    ONE_CLICK_TEMPLATE_URL,
    /^https:\/\/[a-z0-9-]+\.s3\.us-east-1\.amazonaws\.com\/corenova-one-click\.template\.yaml$/,
  );
});
