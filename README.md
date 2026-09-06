# CoreNova Launch Website

CoreNova Launch 官网（Repo A）—— 中英双语静态站，消费 Repo C 验证数据，部署到 Cloudflare Pages。

## 技术栈

- **构建**：Vite 5 + TypeScript (strict mode)
- **框架**：React 18 + React Router 6
- **渲染**：客户端 SPA + SSR 预渲染（`vite build --ssr`）
- **样式**：全局 CSS（BEM 命名）
- **部署**：Cloudflare Pages

## 快速开始

```bash
npm ci

# 首次取数（二选一）：
#   a) 相邻目录有 CoreNovaLaunchVerify 仓（默认 dir 后端读它的 data/）
#   b) 直接读公开 R2 端点（无需任何配置或相邻仓）
VERIFIED_BACKEND=r2 npm run fetch-data

# 开发模式（predev 自动重取数据，失败时容忍上次 payload）
npm run dev

# 生产构建（prebuild 严格取数，任何缺失即失败）
npm run build

# 预览构建产物
npm run preview
```

`src/data/generated.json` 是构建产物，**不入库**（deployment-contract §1 禁止第二事实源）；克隆后先执行上面的取数步骤，再 `npm run dev`。

## 数据来源

官网数据**不手写**，由 Repo C（CoreNovaLaunchVerify）生成：

| 数据 | 来源 | 说明 |
|------|------|------|
| `src/data/generated.ts` | `scripts/fetch-verified.mjs` 生成 | 应用列表、版本记录、截图 URL |
| `data/verified/` | Repo C 的 `VERIFIED_BACKEND` 输出 | `index.json` + `{app}/current.json` + `versions/*.json` |
| `data/stats.json` | GitHub API | Stars、验证成功率（拉不到则降级显示 `—`） |
| `public/screenshots/` | Repo C 截图镜像 | 构建时从 Repo C 复制 |

`scripts/fetch-verified.mjs` 在 `predev` 和 `prebuild` 时自动运行。本地默认读取 `../CoreNovaLaunchVerify/data/`（dir 模式）；CI / 云端构建默认读公开 R2 端点（`r2` 模式），通过环境变量可显式覆盖。

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `VERIFIED_BACKEND` | 否 | `dir`（默认，读本地 fixtures）或 `r2`（读 Cloudflare R2） |
| `R2_PUBLIC_BASE_URL` | R2 模式必需 | R2 公共端点 URL |
| `VITE_ONE_CLICK_TEMPLATE_URL` | 否 | 一键部署 CFN 模板 URL |

## 目录结构

```
website/
├── src/
│   ├── components/          # 通用组件（Navbar、Footer、ui、Icons）
│   ├── pages/               # 页面组件（Home、Apps、AppDetail、Versions、Updates、Solutions、Docs、NotFound）
│   ├── data/                # 数据层（generated.ts、useAppData.ts、types.ts）
│   ├── lib/                 # 工具函数（format.ts、deploy.ts、hooks.ts）
│   ├── content/             # 静态内容（docs.ts 加载 Markdown）
│   ├── styles/              # 全局 CSS
│   ├── i18n.tsx             # 国际化（en/zh 双语）
│   ├── App.tsx              # 路由定义
│   ├── main.tsx             # 客户端入口
│   └── entry-server.tsx     # SSR 入口
├── scripts/
│   ├── fetch-verified.mjs   # 拉取 Repo C 验证数据
│   └── prerender.mjs        # SSR 预渲染 + sitemap 生成
├── public/                  # 静态资源（图标、截图）
└── docs/                    # Markdown 文档源文件
```

## 路由

| 路径 | 页面 |
|------|------|
| `/:lang/` | 首页 |
| `/:lang/apps` | 应用列表 |
| `/:lang/apps/:app` | 应用详情 |
| `/:lang/apps/:app/versions/` | 版本历史 |
| `/:lang/updates` | 更新动态 |
| `/:lang/solutions` | 解决方案 |
| `/:lang/solutions/:slug` | 方案详情 |
| `/:lang/docs` | 文档 |
| `/:lang/docs/:slug` | 文档详情 |

`:lang` 为 `en` 或 `zh`。根路径 `/` 重定向到 `/en`。

## 相关文档

- [网站设计文档](../docs/website-design.md) — 页面设计、SEO 策略、响应式规范
- [部署契约](../docs/contracts/deployment-contract.md) — 数据结构、字段语义
- [架构总览](../docs/architecture.md) — 三仓模型、R2 事实源
