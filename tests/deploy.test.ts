import assert from "node:assert/strict";
import test from "node:test";
import type { AppCurrent, Deploy } from "../src/data/types.ts";
import { appFaq } from "../src/data/faq.ts";

import {
  buildDeployUrl,
  hasVerifiedRuntimeContract,
  ONE_CLICK_TEMPLATE_URL,
  productionCheckLabels,
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
} as AppCurrent;

function statelessCurrent(app = "test-browser-tool"): AppCurrent {
  const record = structuredClone(current);
  record.app = app;
  record.display_name = { en: app, zh: app };
  record.deploy.persistence = "none";
  record.deploy.data_volume_gb = 0;
  delete record.deploy.data_path;
  return record;
}

for (const app of ["cyberchef", "drawio", "it-tools", "test-browser-tool"]) {
  test(`${app}: explicit none produces a zero-volume deep link with an empty path`, () => {
    const record = statelessCurrent(app);
    assert.equal(hasVerifiedRuntimeContract(record), true);
    const options = verifiedDeployOptions(record, "sha256:abc123");
    assert.ok(options);
    assert.equal(options.persistence, "none");
    assert.equal(options.dataVolumeGb, 0);
    assert.equal(options.dataContainerPath, "");
    assert.deepEqual(selectableDataVolumes(options.dataVolumeGb), []);
    const params = new URLSearchParams(new URL(buildDeployUrl(options)).hash.split("?")[1]);
    assert.equal(params.get("param_PersistenceMode"), "none");
    assert.equal(params.get("param_DataVolumeSize"), "0");
    assert.equal(params.has("param_DataContainerPath"), true);
    assert.equal(params.get("param_DataContainerPath"), "");
    assert.equal(params.get("param_ImageReference"), "ghost:6.62.0-alpine@sha256:abc123");
    assert.equal(params.get("param_AmiId"), record.ami_id);
    assert.equal(params.get("param_HealthCheckPath"), "/");
  });
}

test("none rejects missing/nonzero sizes and any declared data path", () => {
  const conflicts: Partial<Deploy>[] = [
    { data_volume_gb: undefined }, { data_volume_gb: 8 }, { data_volume_gb: -1 },
    { data_volume_gb: NaN }, { data_volume_gb: Infinity },
    { data_path: "/data" }, { data_path: "" }, { data_path: " " },
  ];
  for (const conflict of conflicts) {
    const record = statelessCurrent();
    Object.assign(record.deploy, conflict);
    assert.equal(hasVerifiedRuntimeContract(record), false);
    assert.equal(verifiedDeployOptions(record, "sha256:abc123"), null);
  }
});

test("none retains hold, digest, AMI and health-check gates", () => {
  const record = statelessCurrent();
  for (const digest of [undefined, "", " "]) {
    assert.equal(verifiedDeployOptions(record, digest), null);
  }
  record.deploy.hold = { reason: { en: "paused", zh: "暂停" } };
  assert.equal(hasVerifiedRuntimeContract(record), false);
  assert.equal(verifiedDeployOptions(record, "sha256:abc123"), null);
  delete record.deploy.hold;
  for (const field of ["ami", "health"] as const) {
    const incomplete = structuredClone(record);
    if (field === "ami") incomplete.ami_id = "";
    else delete incomplete.deploy.health_check_path;
    assert.equal(verifiedDeployOptions(incomplete, "sha256:abc123"), null);
  }
});

test("deep links reject none conflicts instead of normalizing caller overrides", () => {
  const options = verifiedDeployOptions(statelessCurrent(), "sha256:abc123")!;
  for (const dataVolumeGb of [8, -1, NaN, Infinity, undefined]) {
    assert.throws(() => buildDeployUrl({ ...options, dataVolumeGb } as never), /Conflicting persistence/);
  }
  for (const dataContainerPath of ["/data", " ", undefined]) {
    assert.throws(() => buildDeployUrl({ ...options, dataContainerPath } as never), /Conflicting persistence/);
  }
  assert.throws(() => buildDeployUrl({ ...options, digest: "" }), /digest/);
});

test("missing persistence means volume regardless of app name or app_type", () => {
  for (const app of ["cyberchef", "drawio", "it-tools"]) {
    const legacy = statelessCurrent(app);
    Object.assign(legacy, { app_type: "static" });
    delete legacy.deploy.persistence;
    assert.equal(verifiedDeployOptions(legacy, "sha256:abc123"), null);
    legacy.deploy.data_volume_gb = 30;
    assert.equal(verifiedDeployOptions(legacy, "sha256:abc123"), null);
    legacy.deploy.data_path = "/data";
    assert.equal(verifiedDeployOptions(legacy, "sha256:abc123")?.persistence, "volume");
  }
});

test("explicit and legacy volume options preserve size/path requirements and parameters", () => {
  const record = structuredClone(current);
  record.deploy.persistence = "volume";
  const options = verifiedDeployOptions(record, "sha256:abc123")!;
  for (const persistence of [undefined, "volume"] as const) {
    const params = new URLSearchParams(new URL(buildDeployUrl({ ...options, persistence })).hash.split("?")[1]);
    assert.equal(params.get("param_PersistenceMode"), "volume");
    assert.equal(params.get("param_DataVolumeSize"), "30");
    assert.equal(params.get("param_DataContainerPath"), record.deploy.data_path);
    assert.throws(() => buildDeployUrl({ ...options, persistence, dataVolumeGb: 0 }), /dataVolumeGb/);
    assert.throws(() => buildDeployUrl({ ...options, persistence, dataContainerPath: "" }), /dataContainerPath/);
  }
  for (const data_volume_gb of [0, 7, NaN, Infinity]) {
    record.deploy.data_volume_gb = data_volume_gb;
    assert.equal(verifiedDeployOptions(record, "sha256:abc123"), null);
  }
  const unknown = statelessCurrent();
  Object.assign(unknown.deploy, { persistence: "unknown" });
  assert.equal(verifiedDeployOptions(unknown, "sha256:abc123"), null);
  assert.throws(() => buildDeployUrl({ ...options, persistence: "unknown" } as never), /persistence/);
});

test("none FAQ describes browser exports, no server persistence and ongoing compute/storage charges", () => {
  const faq = appFaq(statelessCurrent())[1];
  assert.match(faq.answer.en, /browser download or export/);
  assert.match(faq.answer.en, /server does not persist application data/);
  assert.match(faq.answer.en, /instance and root disk still incur charges/);
  assert.match(faq.answer.zh, /浏览器下载或导出/);
  assert.match(faq.answer.zh, /服务器不持久化应用数据/);
  assert.match(faq.answer.zh, /实例和系统盘仍会计费/);
  assert.doesNotMatch(faq.answer.en, /encrypted EBS data volume|volume survives stack deletion/);
  const legacy = structuredClone(current);
  legacy.display_name = { en: "Ghost", zh: "Ghost" };
  assert.match(appFaq(legacy)[1].answer.en, /volume survives stack deletion/);
});

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
  assert.equal(params.get("param_LaunchUrl"), "http://localhost:8080");
  assert.equal(params.get("param_AllowedWebCidr"), "127.0.0.1/32");
  assert.equal(params.get("param_SelfSignedTls"), "false");
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

test("production-check scope line only appears for declared records", () => {
  // verification-manifest/deployment-contract §2.6：核对声明决定文案；无声明不得声称做过生产核对。
  const t = (key: string) => ({ pc_url_injection: "地址注入", pc_host_metrics: "宿主机指标" } as Record<string, string>)[key];
  const declared = { ...current, deploy: { ...current.deploy, production_contract: { checks: ["url_injection", "host_metrics"] } } } as never;
  assert.deepEqual(productionCheckLabels(declared.deploy, t), ["地址注入", "宿主机指标"]);
  assert.equal(productionCheckLabels(current.deploy, t), null);
  assert.equal(
    productionCheckLabels({ ...current.deploy, production_contract: { checks: [] } } as never, t),
    null
  );
});
