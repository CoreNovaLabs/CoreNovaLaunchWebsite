// Deployment pause (hold) — "verified" and "deployable" are deliberately separate
// states (deployment-contract.md §2.5). The authoritative hold lives in the app
// registration (apps/*.yaml `deployment.hold`, app-schema.md 规则21) and is
// projected into current.json's `deploy.hold`; it is removed only after a
// production-contract re-verification, not after a version bump.
//
// The table below is a build-time fallback for data published before that
// contract field existed, so an existing pause cannot silently lapse while R2
// data has not been re-published yet.
import type { AppCurrent, Localized } from "../data/types";

const fallbackHolds: Record<string, Localized> = {
  "firefly-iii": { en: "Deployment paused: production database configuration and per-instance encryption setup require verification.", zh: "暂停部署：生产数据库配置和每实例加密配置尚待验证。" },
  "code-server": { en: "Deployment paused pending production data-directory permission verification.", zh: "暂停部署：待完成生产数据目录权限验证。" },
  "node-red": { en: "Deployment paused pending data permissions and protected editor access.", zh: "暂停部署：待补齐数据权限和编辑器访问保护。" },
  "changedetection": { en: "Deployment paused pending protected access to the management interface.", zh: "暂停部署：待补齐管理界面访问保护。" },
  "gitea": { en: "Deployment paused pending production public-URL injection verification.", zh: "暂停部署：待验证生产公网地址注入。" },
  "vikunja": { en: "Deployment paused pending production public-URL injection verification.", zh: "暂停部署：待验证生产公网地址注入。" },
  "portainer": { en: "Deployment paused: the template does not mount the host Docker socket by default; local container management is unavailable.", zh: "暂停部署：模板默认不挂载宿主机 Docker socket，不能管理宿主机容器。" },
  "netdata": { en: "Deployment paused: host metric mounts and protected dashboard access are not configured.", zh: "暂停部署：尚未配置宿主机指标挂载和仪表盘访问保护。" },
  "syncthing": { en: "Deployment paused: transfer ports and protected management access are not configured.", zh: "暂停部署：尚未配置传输端口和管理界面访问保护。" },
};

export function deploymentHold(
  current: Pick<AppCurrent, "app" | "deploy">
): Localized | undefined {
  const reason = current.deploy?.hold?.reason;
  if (reason?.en && reason?.zh) return reason;
  return fallbackHolds[current.app];
}
