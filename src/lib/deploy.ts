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
