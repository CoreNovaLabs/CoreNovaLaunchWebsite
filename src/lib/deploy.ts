// one-click 模板的公开分发 URL（deployment-contract.md §2.4）。
//
// Repo C 的 publish-template.yml 把模板发布到公开读 S3（us-east-1），CloudFormation
// 控制台原生支持该直链形态 -> Deploy on AWS 的深链 templateURL 直接引用它，
// 不经站点 origin 转发，站点也不再自托管 /templates/ 副本（避免与验证模板漂移）。
//
// 默认值须与 Repo C 的 TEMPLATE_S3_BUCKET 指向同一只桶；换桶时用构建期
// VITE_ONE_CLICK_TEMPLATE_URL 覆盖，两边一起改，深链与发布物才不会指向两只桶。
export const ONE_CLICK_TEMPLATE_URL: string =
  import.meta.env.VITE_ONE_CLICK_TEMPLATE_URL ??
  "https://corenovalaunch-templates.s3.us-east-1.amazonaws.com/corenova-one-click.template.yaml";

export interface DeployOptions {
  app: string;
  dockerImage: string;
  digest?: string;
  containerPort: number;
  region: string;
  instanceType: string;
  diskGb: number;
  extraEnvironment?: string[];
}

// Stack name the deep link creates — also quoted in the post-deploy guide,
// so users know which stack's Outputs tab to open. Keep both in one place.
export const stackNameFor = (app: string): string => `corenova-${app}`;

// CloudFormation console deep link for the one-click template. The image is
// pinned to the verified digest (tag@digest) when one is available, so what
// gets deployed is byte-identical to what was verified.
export function buildDeployUrl(o: DeployOptions): string {
  const image = o.digest ? `${o.dockerImage}@${o.digest}` : o.dockerImage || o.app;
  let url =
    `https://${o.region}.console.aws.amazon.com/cloudformation/home?region=${o.region}` +
    `#/stacks/create/review?stackName=${stackNameFor(o.app)}` +
    `&templateURL=${encodeURIComponent(ONE_CLICK_TEMPLATE_URL)}` +
    `&param_AppName=${encodeURIComponent(o.app)}` +
    `&param_ImageReference=${encodeURIComponent(image)}` +
    `&param_ContainerPort=${o.containerPort}` +
    `&param_InstanceType=${encodeURIComponent(o.instanceType)}` +
    `&param_DiskGb=${o.diskGb}`;
  const extra = o.extraEnvironment ?? [];
  if (extra.length > 0) {
    url += `&param_ExtraEnvironment=${encodeURIComponent(extra.join("\n"))}`;
  }
  return url;
}
