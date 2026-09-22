import type { AppCurrent } from "../data/types";
import { deploymentHold } from "./deploymentSafety.ts";

// one-click 模板的公开分发 URL（deployment-contract.md §2.4）。
//
// Repo C 的 publish-template.yml 把模板发布到公开读 S3（us-east-1），CloudFormation
// 控制台原生支持该直链形态 -> Deploy on AWS 的深链 templateURL 直接引用它，
// 不经站点 origin 转发，站点也不再自托管 /templates/ 副本（避免与验证模板漂移）。
//
// 默认值须与 Repo C 的 TEMPLATE_S3_BUCKET 指向同一只桶；换桶时用构建期
// VITE_ONE_CLICK_TEMPLATE_URL 覆盖，两边一起改，深链与发布物才不会指向两只桶。
export const ONE_CLICK_TEMPLATE_URL: string =
  import.meta.env?.VITE_ONE_CLICK_TEMPLATE_URL ??
  "https://corenovalaunch-templates.s3.us-east-1.amazonaws.com/corenova-one-click.template.yaml";

export interface DeployOptions {
  app: string;
  appVersion: string;
  dockerImage: string;
  digest: string;
  containerPort: number;
  region: string;
  amiId: string;
  instanceType: string;
  dataVolumeGb: number;
  dataContainerPath: string;
  healthCheckPath: string;
  appUrlEnvName?: string;
  extraEnvironment?: string[];
  // L1.5 生产核对（deployment-contract.md §2.6）通过时声明的保护参数；
  // 深链必须原样携带，否则部署形态退回核对前的未保护基线。
  adminAuthEnabled?: boolean;
  hostMetricsAccess?: boolean;
}

// User-selectable resource overrides. The verified Manifest remains the source of
// the minimum/default values; the UI only offers upward choices from that baseline.
// A larger choice is deployable but is deliberately not described as independently
// verified (app-profiles.md §3/§5: upward sizing is allowed).
const X86_T3_UPGRADE_ORDER = [
  "t3.small",
  "t3.medium",
  "t3.large",
  "t3.xlarge",
  "t3.2xlarge",
] as const;

export function selectableInstanceTypes(verifiedDefault: string): string[] {
  const index = X86_T3_UPGRADE_ORDER.indexOf(
    verifiedDefault as (typeof X86_T3_UPGRADE_ORDER)[number]
  );
  return index >= 0 ? X86_T3_UPGRADE_ORDER.slice(index) : [verifiedDefault];
}

export function selectableDataVolumes(verifiedDefault: number): number[] {
  if (!Number.isFinite(verifiedDefault) || verifiedDefault < 8) return [];
  return [...new Set([verifiedDefault, verifiedDefault * 2, verifiedDefault * 4])]
    .map(Math.round)
    .filter((size) => size <= 4096);
}

// Stack name the deep link creates — also quoted in the post-deploy guide,
// so users know which stack's Outputs tab to open. Keep both in one place.
export const stackNameFor = (app: string, appVersion: string): string => {
  const identity = `${app}-${appVersion}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110)
    .replace(/-$/g, "");
  return `corenova-${identity}`;
};

function required(value: string, name: string): string {
  if (!value.trim()) throw new Error(`Missing verified deployment field: ${name}`);
  return value;
}

// Old manifests do not contain the complete runtime contract. They must not silently
// fall back to mutable template defaults while the UI still calls the result "verified".
export function hasVerifiedRuntimeContract(current: AppCurrent): boolean {
  if (deploymentHold(current)) return false;
  const d = current.deploy;
  return Boolean(
    current.ami_id &&
    d.data_path &&
    d.health_check_path &&
    d.data_volume_gb &&
    d.data_volume_gb >= 8
  );
}

// The scope sentence must only appear for records that really carry a production-check
// declaration; an absent or empty list means "never checked", which is not a blank label.
export function productionCheckLabels(
  deploy: AppCurrent["deploy"],
  t: (key: string) => string
): string[] | null {
  const checks = deploy.production_contract?.checks ?? [];
  return checks.length > 0 ? checks.map((check) => t(`pc_${check}`)) : null;
}

export function verifiedDeployOptions(
  current: AppCurrent,
  digest?: string
): DeployOptions | null {
  const d = current.deploy;
  if (!digest || !hasVerifiedRuntimeContract(current)) {
    return null;
  }
  const checks = new Set(d.production_contract?.checks ?? []);
  return {
    app: current.app,
    appVersion: current.app_version,
    dockerImage: d.docker_image,
    digest,
    containerPort: d.container_port,
    region: d.regions[0] || current.region,
    amiId: current.ami_id,
    instanceType: d.instance_type,
    dataVolumeGb: d.data_volume_gb!,
    dataContainerPath: d.data_path!,
    healthCheckPath: d.health_check_path!,
    appUrlEnvName: d.app_url_env_name,
    extraEnvironment: d.extra_environment,
    adminAuthEnabled: checks.has("admin_auth"),
    hostMetricsAccess: checks.has("host_metrics"),
  };
}

// CloudFormation console deep link for the one-click template. The image is
// pinned to the verified digest (tag@digest) when one is available, so what
// gets deployed is byte-identical to what was verified.
export function buildDeployUrl(o: DeployOptions): string {
  required(o.appVersion, "appVersion");
  required(o.amiId, "amiId");
  required(o.digest, "digest");
  required(o.dataContainerPath, "dataContainerPath");
  required(o.healthCheckPath, "healthCheckPath");
  if (!Number.isFinite(o.dataVolumeGb) || o.dataVolumeGb < 8) {
    throw new Error("Missing verified deployment field: dataVolumeGb");
  }
  const image = `${required(o.dockerImage, "dockerImage")}@${o.digest}`;
  let url =
    `https://${o.region}.console.aws.amazon.com/cloudformation/home?region=${o.region}` +
    `#/stacks/create/review?stackName=${stackNameFor(o.app, o.appVersion)}` +
    `&templateURL=${encodeURIComponent(ONE_CLICK_TEMPLATE_URL)}` +
    `&param_AppName=${encodeURIComponent(o.app)}` +
    `&param_ImageReference=${encodeURIComponent(image)}` +
    `&param_ContainerPort=${o.containerPort}` +
    `&param_AmiId=${encodeURIComponent(o.amiId)}` +
    `&param_InstanceType=${encodeURIComponent(o.instanceType)}` +
    `&param_DataVolumeSize=${o.dataVolumeGb}` +
    `&param_DataContainerPath=${encodeURIComponent(o.dataContainerPath)}` +
    `&param_HealthCheckPath=${encodeURIComponent(o.healthCheckPath)}` +
    `&param_LaunchUrl=${encodeURIComponent("http://localhost:8080")}` +
    "&param_AllowedWebCidr=127.0.0.1%2F32&param_SelfSignedTls=false";
  if (o.appUrlEnvName) {
    url += `&param_AppUrlEnvironmentName=${encodeURIComponent(o.appUrlEnvName)}`;
  }
  const extra = o.extraEnvironment ?? [];
  if (extra.length > 0) {
    url += `&param_ExtraEnvironment=${encodeURIComponent(extra.join("\n"))}`;
  }
  if (o.adminAuthEnabled) {
    url += "&param_AdminAuthEnabled=true";
  }
  if (o.hostMetricsAccess) {
    url += "&param_HostMetricsAccess=true";
  }
  return url;
}
