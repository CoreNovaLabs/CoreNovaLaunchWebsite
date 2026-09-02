import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale, Localized } from "./data/types";

type Dict = Record<string, string>;

const en: Dict = {
  // nav
  browse: "Apps",
  updates: "Updates",
  solutions: "Solutions",
  pricing: "Pricing",
  docs: "Docs",
  search_placeholder: "Search software...",
  // hero
  hero_title: "One-Click Deploy Open Source Software on AWS",
  hero_subtitle:
    "CoreNova Launch provides pre-verified open source software with automated testing and one-click deployment on AWS. Save time, reduce risk, and focus on what matters.",
  browse_software: "Browse Software",
  view_documentation: "View Documentation",
  // sections
  featured_software: "Featured Software",
  view_all: "View all",
  why_choose: "Why Choose CoreNova Launch?",
  latest_updates: "Latest Updates",
  view_all_updates: "View all updates",
  aws_region_support: "Global AWS Region Support",
  view_all_regions: "View all regions",
  automated_testing: "Automated Testing",
  // badges / labels
  verified: "Verified",
  new_version: "New Version",
  security_update: "Security Update",
  bug_fix: "Bug Fix",
  initial: "Initial",
  deploy_now: "Deploy Now",
  version_history: "Version History",
  quick_deploy: "Quick Deploy",
  generate_template: "Deploy on AWS",
  overview: "Overview",
  versions: "Versions",
  deployment: "Deployment",
  configuration: "Configuration",
  faq: "FAQ",
  updates_tab: "Updates",
  test_results: "Test Results",
  release_notes: "Release Notes",
  deployment_guide: "Deployment Guide",
  stars: "Stars",
  deploy: "Deploy",
  view: "View",
  details: "Details",
  release_date: "Release Date",
  status: "Status",
  aws_tested: "AWS Tested",
  actions: "Actions",
  failed: "Failed",
  instance_label: "Instance",
  disk_gb_label: "Disk (GB)",
  version_details: "Version Details",
  application_label: "Application",
  tests_label: "Tests",
  no_release_notes: "No upstream release notes (not fetched at build time).",
  // browse / list
  browse_title: "Browse Software",
  browse_subtitle:
    "Explore all pre-verified open source software available for one-click deploy.",
  sort_by: "Sort",
  verified_only: "Verified only",
  showing_of: "Showing %{from}–%{to} of %{total} software",
  all_categories: "All Categories",
  clear_filters: "Clear filters",
  load_more: "Load more",
  name_az: "Name A–Z",
  newest: "Newest",
  most_stars: "Most Stars",
  no_results: "No software matches your filters.",
  // detail
  home: "Home",
  software: "Software",
  back_to: "Back to",
  view_full_history: "View full version history",
  corenova_test_report: "CoreNova Test Report",
  github_release_notes: "GitHub Release Notes",
  latest_version: "Latest Version",
  supported_architectures: "Supported Architectures",
  aws_regions: "AWS Regions",
  // versions page
  versions_title: "%{app} Versions",
  versions_subtitle: "All verified versions and release history.",
  back_to_app: "← Back to %{app}",
  platform: "Platform",
  referenced: "referenced",
  passed: "passed",
  platform_tooltip:
    "This version referenced a valid Platform Contract (platform_verification_id). It does not mean this version was deployed and tested on EC2 on its own.",
  // verification provenance
  verification_provenance: "Verification provenance",
  verification_id: "Verification ID",
  launch_url: "Launch URL",
  report: "Verification report",
  view_report: "View report",
  zoom_hint: "Click to enlarge",
  close: "Close",
  prev_screenshot: "Previous screenshot",
  next_screenshot: "Next screenshot",
  docs_title: "Documentation",
  docs_subtitle: "How CoreNova verification works, and how to get the most out of it.",
  docs_read: "Read",
  docs_empty: "Documentation is being written — check back soon.",
  deploy_hint:
    "Pick a region below, then Deploy on AWS — it creates the VPC + host in your own AWS account and deploys this verified version (about 10 minutes; AWS costs apply).",
  template_console_hint:
    "Opening AWS CloudFormation with the official one-click template (VPC + host). The image is pinned to this version's verified digest, resources are created in your own account, and first boot takes about 5–10 minutes.",
  download_template: "Download template (YAML)",
  actions_run: "Actions run",
  // cost card (facts come verbatim from deploy.cost_estimate — rule 18; the
  // frontend never prices instance types itself)
  est_cost: "Est. AWS cost",
  est_cost_value: "≈ $%{usd}/mo",
  digest_pin_chip: "Image pinned by verified digest",
  // request-an-app entry (GitHub issue form on the verify repo)
  request_app: "Request an app",
  // deploy guide (standardized post-deployment instructions; per-app copy comes from
  // deploy.post_deploy — deployment-contract §3.2, never invented by the frontend)
  deploy_guide_title: "After you deploy",
  deploy_guide_step1:
    'The CloudFormation wizard opens with everything prefilled (stack "%{stack}") — review and click "Create stack".',
  deploy_guide_step2:
    "Wait until the stack status reaches CREATE_COMPLETE (about 10 minutes). Outputs are only visible after completion.",
  deploy_guide_step3: "Open the stack's Outputs tab — everything you need is there:",
  deploy_guide_step4: "Open the access URL in your browser — the app is ready to use.",
  deploy_guide_admin_title: "Admin console",
  deploy_guide_admin_entry: "Open your access URL followed by this path:",
  deploy_guide_notes: "Good to know",
  deploy_guide_next_title: "Next steps",
  deploy_guide_next_data:
    "Your data lives at %{path} inside the container, on an encrypted EBS volume. Find the instance by its ID in the EC2 console.",
  deploy_guide_next_backup_prefix: "Back up before any changes:",
  deploy_guide_next_backup_link: "Upgrading and backups guide",
  deploy_guide_next_upgrade_prefix: "To upgrade to a newer verified version:",
  deploy_guide_next_upgrade_link: "Version history",
  deploy_guide_delete_warning:
    "Deleting the CloudFormation stack permanently destroys the data volume. There is no soft-delete. Back up first.",
  dg_out_launch_url: "Access URL — open this in your browser",
  dg_out_public_ip: "The instance's public IP",
  dg_out_public_dns: "The instance's public DNS name",
  deploy_overview_title: "Deploy quick reference",
  deploy_overview_access_from: "Stack Outputs → ResolvedLaunchUrl",
  deploy_overview_ip_from: "Stack Outputs → PublicIp",
  deploy_overview_admin_label: "Admin console",
  deploy_overview_view_guide: "See the full step-by-step guide in Deployment",
  // updates page
  updates_title: "Updates",
  updates_subtitle: "Track the latest verified deployments across all software.",
  filter_all: "All",
  filter_new: "New Version",
  filter_security: "Security Update",
  filter_verified: "Verified only",
  sort_newest: "Newest",
  sort_oldest: "Oldest",
  view_app: "View %{app}",
  version_history_link: "Version history",
  // categories
  category_title: "%{name}",
  category_subtitle: "%{desc}",
  // solutions
  solutions_title: "Solutions",
  solutions_subtitle:
    "Curated open-source stacks to solve real problems — deploy in one click.",
  view_solution: "View solution",
  deploy_full_stack: "Deploy full stack",
  whats_included: "What's included (deploy in order):",
  architecture_label: "Architecture",
  // footer / misc
  footer_github: "GitHub",
  footer_docs: "Docs",
  footer_license: "License",
  footer_tagline: "Pre-verified open source, one click from AWS.",
  footer_products: "Products",
  footer_resources: "Resources",
  footer_regions: "Regions",
  region_roadmap: "More regions on the roadmap.",
  copyright: "© 2026 CoreNova Launch",
  not_found: "Page not found",
  theme_light: "Switch to light theme",
  theme_dark: "Switch to dark theme",
  bootstrap_notice:
    "Bootstrap data backend: this build was rendered from Repo C's local fixtures (VERIFIED_BACKEND=dir), not from Cloudflare R2 yet.",
};

const zh: Dict = {
  browse: "应用",
  updates: "更新",
  solutions: "解决方案",
  pricing: "定价",
  docs: "文档",
  search_placeholder: "搜索软件...",
  hero_title: "在 AWS 上一键部署开源软件",
  hero_subtitle:
    "CoreNova Launch 提供经过预验证的开源软件，支持自动化测试和 AWS 一键部署。节省时间、降低风险、聚焦核心事务。",
  browse_software: "浏览软件",
  view_documentation: "查看文档",
  featured_software: "精选软件",
  view_all: "查看全部",
  why_choose: "为什么选择 CoreNova Launch？",
  latest_updates: "最新更新",
  view_all_updates: "查看全部更新",
  aws_region_support: "全球 AWS 区域支持",
  view_all_regions: "查看全部区域",
  automated_testing: "自动化测试",
  verified: "已验证",
  new_version: "新版本",
  security_update: "安全更新",
  bug_fix: "缺陷修复",
  initial: "首次上架",
  deploy_now: "立即部署",
  version_history: "版本历史",
  quick_deploy: "快速部署",
  generate_template: "部署到 AWS",
  overview: "概览",
  versions: "版本",
  deployment: "部署",
  configuration: "配置",
  faq: "常见问题",
  updates_tab: "更新",
  test_results: "测试结果",
  release_notes: "发布说明",
  deployment_guide: "部署指南",
  stars: "Stars",
  deploy: "部署",
  view: "查看",
  details: "详情",
  release_date: "发布日期",
  status: "状态",
  aws_tested: "AWS 测试",
  actions: "操作",
  failed: "失败",
  instance_label: "规格",
  disk_gb_label: "磁盘 (GB)",
  version_details: "版本详情",
  application_label: "应用验证",
  tests_label: "测试",
  no_release_notes: "暂无上游 Release Notes（构建期未取到）。",
  browse_title: "浏览软件",
  browse_subtitle: "浏览全部经过预验证、可一键部署的开源软件。",
  sort_by: "排序",
  verified_only: "仅看已验证",
  showing_of: "共展示 %{from}–%{to} / %{total} 款软件",
  all_categories: "全部分类",
  clear_filters: "清除筛选",
  load_more: "加载更多",
  name_az: "名称 A–Z",
  newest: "最新",
  most_stars: "Stars 最多",
  no_results: "没有符合筛选条件的软件。",
  home: "首页",
  software: "软件",
  back_to: "返回",
  view_full_history: "查看完整版本历史",
  corenova_test_report: "CoreNova 测试报告",
  github_release_notes: "GitHub Release Notes",
  latest_version: "最新版本",
  supported_architectures: "支持架构",
  aws_regions: "AWS 区域",
  versions_title: "%{app} 版本",
  versions_subtitle: "全部已验证版本与发布历史。",
  back_to_app: "← 返回 %{app}",
  platform: "平台",
  referenced: "引用",
  passed: "通过",
  platform_tooltip:
    "本版本验证引用了有效的 Platform Contract（platform_verification_id），不代表该版本单独在 EC2 上部署并测试过。",
  // verification provenance
  verification_provenance: "验证溯源",
  verification_id: "验证标识",
  launch_url: "访问地址",
  report: "验证报告",
  view_report: "查看报告",
  zoom_hint: "点击放大",
  close: "关闭",
  prev_screenshot: "上一张截图",
  next_screenshot: "下一张截图",
  docs_title: "文档",
  docs_subtitle: "了解 CoreNova 验证的工作方式，以及如何用好它。",
  docs_read: "阅读",
  docs_empty: "文档编写中，敬请期待。",
  deploy_hint:
    "在下方选择区域后点击「部署到 AWS」——会在你自己的 AWS 账号里创建 VPC 与主机并部署该已验证版本（约 10 分钟，产生 AWS 费用）。",
  template_console_hint:
    "正在用官方 one-click 模板（VPC + 主机）打开 CloudFormation 创建向导，镜像已按本验证版本的 digest 钉住。资源创建在你自己的账号中，会产生 AWS 费用；首次装机约 5–10 分钟。",
  download_template: "下载模板（YAML）",
  actions_run: "Actions 运行",
  // 成本卡（数字与口径均来自 deploy.cost_estimate 注册数据——规则18；前端绝不按规格自行算价）
  est_cost: "估算成本",
  est_cost_value: "≈ $%{usd}/月",
  digest_pin_chip: "镜像按已验证 digest 钉住",
  // 申请上架入口（Verify 仓的 GitHub issue 表单）
  request_app: "申请上架",
  // 部署后指引（标准化文案；各应用差异部分来自 deploy.post_deploy，前端不得自造）
  deploy_guide_title: "部署完成后",
  deploy_guide_step1:
    "CloudFormation 创建向导已预填全部参数（栈名 \"%{stack}\"）——确认后点击「创建堆栈」。",
  deploy_guide_step2:
    "等待栈状态变为 CREATE_COMPLETE（约 10 分钟）。创建完成后才能看到 Outputs。",
  deploy_guide_step3: "打开栈的 Outputs 标签，你需要的信息都在这里：",
  deploy_guide_step4: "在浏览器打开访问地址，应用即可使用。",
  deploy_guide_admin_title: "管理后台",
  deploy_guide_admin_entry: "在访问地址后拼接该路径打开：",
  deploy_guide_notes: "注意事项",
  deploy_guide_next_title: "下一步",
  deploy_guide_next_data:
    "数据保存在容器内的 %{path}，位于加密 EBS 卷上。在 EC2 控制台用实例 ID 找到它。",
  deploy_guide_next_backup_prefix: "变更前先备份：",
  deploy_guide_next_backup_link: "升级与备份指南",
  deploy_guide_next_upgrade_prefix: "升级到更新的已验证版本：",
  deploy_guide_next_upgrade_link: "版本历史",
  deploy_guide_delete_warning: "删除 CloudFormation 栈会永久销毁数据卷，不可恢复。请先备份。",
  dg_out_launch_url: "访问地址——在浏览器打开它",
  dg_out_public_ip: "实例公网 IP",
  dg_out_public_dns: "实例公网 DNS 名称",
  deploy_overview_title: "部署速览",
  deploy_overview_access_from: "栈 Outputs → ResolvedLaunchUrl",
  deploy_overview_ip_from: "栈 Outputs → PublicIp",
  deploy_overview_admin_label: "管理后台",
  deploy_overview_view_guide: "到「部署」查看完整分步指引",
  updates_title: "更新",
  updates_subtitle: "追踪所有软件的最新已验证部署。",
  filter_all: "全部",
  filter_new: "新版本",
  filter_security: "安全更新",
  filter_verified: "仅看已验证",
  sort_newest: "最新",
  sort_oldest: "最早",
  view_app: "查看 %{app}",
  version_history_link: "版本历史",
  category_title: "%{name}",
  category_subtitle: "%{desc}",
  solutions_title: "解决方案",
  solutions_subtitle: "精选开源技术栈，解决实际问题时一键部署。",
  view_solution: "查看方案",
  deploy_full_stack: "部署整套方案",
  whats_included: "包含内容（按序部署）：",
  architecture_label: "架构",
  footer_github: "GitHub",
  footer_docs: "文档",
  footer_license: "许可证",
  footer_tagline: "预验证开源软件，AWS 一键部署。",
  footer_products: "产品",
  footer_resources: "资源",
  footer_regions: "区域",
  region_roadmap: "更多区域在路线图中。",
  copyright: "© 2026 CoreNova Launch",
  not_found: "页面未找到",
  theme_light: "切换到浅色主题",
  theme_dark: "切换到深色主题",
  bootstrap_notice: "引导期数据后端：本次构建取自 Repo C 的本地 fixtures（VERIFIED_BACKEND=dir），尚未接入 Cloudflare R2。",
};

export const dicts: Record<Locale, Dict> = { en, zh };

interface I18nValue {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    const dict = dicts[locale];
    const enDict = dicts.en;
    const t = (key: string, vars?: Record<string, string | number>): string => {
      let s = dict[key] ?? enDict[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`%{${k}}`).join(String(v));
        }
      }
      return s;
    };
    return { locale, t };
  }, [locale]);
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Pick a localized string by current locale, falling back to English.
export function pick(locale: Locale, l: Localized): string {
  return l[locale] ?? l.en ?? "";
}
