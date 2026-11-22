# AGENTS.md - QuickLinks（ZTools 版）项目开发指南

## 项目概述

**项目名称**: ztools-quicklinks
**项目类型**: ZTools 跨平台效率工具插件（由 uTools 版 QuickLinks 迁移而来）
**核心功能**: 高效管理快捷链接、文本片段和代码书签，支持类似 VSCode QuickOpen 的模糊搜索能力

宿主为 [ZTools](https://github.com/ZToolsCenter/ZTools)（uTools 的开源实现，已在本机 3.2.0 验证）。
插件模型与 uTools 高度相似：`plugin.json` 声明入口与指令，`preload` 提供 Node.js 能力，
渲染层是普通网页（**没有 Node 权限**），通过全局 `window.ztools` 调用宿主 API。

---

## 项目架构

### 技术栈

| 技术       | 版本    | 用途           |
| ---------- | ------- | -------------- |
| React      | 18.3.1  | UI 框架        |
| TypeScript | 5.9.3   | 类型系统       |
| Vite       | 6.4.x   | 构建工具       |
| Ant Design | 5.29.x  | UI 组件库      |
| Hox        | 2.1.1   | 状态管理       |
| ahooks     | 3.9.x   | React Hooks 库 |
| pinyin-pro | 3.28.x  | 拼音搜索支持   |
| lodash-es  | 4.18.x  | 工具函数       |
| classnames | 2.5.1   | CSS 类名处理   |

### 目录结构

```
src-ztools/                      # ZTools 插件目录（可直接加载/打包发布）
├── plugin.json                  # 插件清单：name/title/main/preload/features
├── logo.png
├── preload/                     # CommonJS，可访问 Node.js
│   ├── services.js              # 入口，把能力挂到 window.services
│   ├── editors.cjs              # 编辑器启动 + 文件预览
│   ├── front-app.cjs            # 前台应用识别（含调试日志）
│   ├── front-app.ps1 / .jxa     # Windows / macOS 原生取前台窗口脚本
│   ├── command-template.cjs     # 由 shared/command-template.mjs 生成
│   ├── location.cjs             # 由 shared/location.mjs 生成
│   └── package.json             # {"type": "commonjs"}
└── dist/                        # vite 构建产物（已 gitignore）

src/
├── QuickLinksList/              # 主功能模块
│   ├── QuickLinksList.tsx       # 主列表组件
│   ├── useQuickLinksDataLogic.ts# 数据逻辑 Hook
│   ├── useShortcutLogic.ts      # 快捷键逻辑 Hook
│   ├── store.tsx                # 全局模态框状态
│   ├── utils.ts / const.ts
│   ├── BaseLayout/              # 布局（content + footer 插槽）
│   ├── HighlightName/           # 搜索命中高亮
│   ├── QuickLinksDetailInfo/    # 详情信息
│   ├── QuickLinksGroup/         # 分组管理
│   ├── QuickLinksParamEdit/     # 参数化链接
│   ├── CodePreview/             # 只读 CodeMirror 6 代码预览
│   └── EditorSettings/          # 编辑器设置页
├── components/                  # 通用组件（ButtonWithIcon、EditableDiv、FormModal…）
├── utils/                       # 快捷键、模糊匹配、useSubInput、主题等
├── types/ztools.d.ts            # 补齐 api-types 尚未覆盖的宿主类型
├── storage.ts                   # 数据持久化（ztools.dbStorage）
├── editorSettings.ts            # 编辑器配置与前台应用匹配
├── App.tsx / main.tsx / main.css
└── vite-env.d.ts                # window.ztools / window.services 类型声明

shared/                          # 渲染层与 preload 共用的纯逻辑（ESM）
scripts/sync-preload.mjs         # shared/*.mjs → src-ztools/preload/*.cjs
tests/                           # node:test 回归用例
```

---

## 核心功能模块详解

### 1. 数据持久化层 (`storage.ts`)

**核心数据结构**:

```typescript
// 快捷链接 / 文本片段 / 代码书签
interface IQuickLinksItem {
  id: string;
  name: string;
  value: string;
  type?: 'link' | 'snippet' | 'code';
  editorId?: string; // 仅代码书签
  groupId?: string;
}

interface IQuickLinksGroup {
  id: string;
  name: string;
  color: string;
  type: 'default' | 'remote';
  remoteUrl?: string;
  createTime: number;
  updateTime: number;
}

interface IQuickLinksAccessData {
  lastAccessTime?: number;
  accessCount?: number;
  createTime?: number;
  updateTime?: number;
}
```

**存储键值**（`ztools.dbStorage`，ZTools 按插件隔离存储）:

- `quickLinks` - 主数据
- `quickLinksAccessData` - 访问统计
- `quickLinksGroups` - 分组
- `quickLinksSelectedGroup` - 当前分组
- `quickLinksRemoteCache` - 远程分组缓存
- `quickLinksEditorSettings` - 全局编辑器设置

### 2. 数据逻辑层 (`useQuickLinksDataLogic.ts`)

- 拼音/模糊搜索、按分组过滤、智能时间分组（今天/昨天/本周/本月/更早）、按最近访问排序
- CRUD：`addItem` / `editItem` / `removeCurrentItem`（二次确认）/ `importData`（替换/合并）/ `accessQuickLink`
- 分组：本地增删改、远程 URL 拉取（60 秒节流 + 本地缓存）
- 远程分组数据格式：`[{ "name": "...", "value": "...", "type": "link" }]`

### 3. 模糊搜索 (`utils/stringMatch.ts`)

1. 把每个字符转成可选匹配，生成类似 VSCode 的正则
2. `pinyin-pro` 建立拼音索引
3. 返回匹配位置供 `HighlightName` 高亮

### 4. preload 能力边界

渲染层没有 Node 权限，所有本地能力都通过 `src-ztools/preload/services.js` 注入：

| `window.services`      | 说明                                          |
| ---------------------- | --------------------------------------------- |
| `readPreview(location)`| 读取代码书签文件（≤256 KB / 3000 行，UTF-8）  |
| `open(request)`        | 校验路径并用指定编辑器打开（不经 shell）      |
| `getInvocationApp()`   | 取唤起插件前的来源应用（macOS/Windows）       |
| `captureInvocationApp()` | 按 `onPluginEnter` 的 action 刷新上下文     |
| `logInvocationAppDebug()` | `QUICKLINKS_FOREGROUND_DEBUG=1` 时写调试日志 |

### 5. 快捷键系统

| 快捷键                   | 功能                     |
| ------------------------ | ------------------------ |
| `Cmd/Ctrl + 1-9`         | 快速打开前 9 项          |
| `Cmd/Ctrl + F`           | 激活搜索框               |
| `Cmd/Ctrl + N`           | 新建项                   |
| `Cmd/Ctrl + E`           | 编辑当前项               |
| `Cmd/Ctrl + R`           | 删除当前项（需二次确认） |
| `Cmd/Ctrl + C`           | 复制内容                 |
| `Cmd/Ctrl + Tab`         | 向后切换分组             |
| `Cmd/Ctrl + Shift + Tab` | 向前切换分组             |
| `Tab` / `↑` `↓`          | 切换选中项               |
| `Enter`                  | 执行主操作               |

### 6. 参数化链接 (`QuickLinksParamEdit.tsx`)

`{paramName}` 占位符 → 回车弹窗填参 → 替换后打开。多参数用 Tab 切换，`EditableDiv` 就地编辑。

### 7. 模态框系统

基于 `@orca-fe/hooks` 的 `usePromisifyModal` + Hox 全局状态：
`const result = await modal.open(<Component />)`；插件退出（`onPluginOut`）时自动销毁。

---

## ZTools 插件配置 (`src-ztools/plugin.json`)

```json
{
  "name": "ztools-quicklinks",
  "title": "QuickLinks",
  "version": "1.0.0",
  "main": "dist/index.html",
  "preload": "preload/services.js",
  "logo": "logo.png",
  "development": { "main": "http://localhost:5173" },
  "features": [
    { "code": "quicklinks", "explain": "快捷链接", "cmds": ["快捷链接", "quicklinks"] }
  ]
}
```

**使用的宿主 API**（全部挂在全局 `window.ztools`，类型来自 `@ztools-center/ztools-api-types`）:

- `dbStorage` - 本地数据持久化
- `onPluginEnter / onPluginOut` - 插件生命周期（渲染层与 preload 都会注册）
- `setSubInput / setSubInputValue / subInputFocus / subInputBlur` - 搜索框交互
- `hideMainWindowPasteText` - 粘贴文本片段
- `shellOpenExternal` - 打开链接
- `copyText`、`outPlugin`、`hideMainWindow`
- `isMacOS` - 快捷键文案（Cmd/Ctrl）
- `getThemeInfo / onThemeChange / isDarkColors` - 主题跟随（`--plugin-primary-color` 为主色变量）
- `getPath('pluginData')` - 插件专属数据目录（仅 preload 使用）

---

## 开发规范与硬性约束

1. **preload 必须可读**：ZTools 明确要求 preload 不允许打包、压缩、混淆，因此
   `src-ztools/preload/` 只放手写源码；`command-template.cjs`、`location.cjs` 是
   `shared/*.mjs` 经 esbuild 转出的 CommonJS，**不要手改**，改 `shared/` 后跑 `pnpm build` / `pnpm test`。
2. **渲染层不得使用 Node API**：`nodeIntegration: false`，只能用 `window.ztools` 与 `window.services`。
3. **preload 用 CommonJS**：ZTools 的 preload 以 `require()` 加载，禁止动态 `import()`。
4. **数据校验**：所有从存储读取的数据必须经过 `validateQuickLinks()` / `validateQuickLinksGroups()`。
5. **ID 生成**：本地 `quick_{random12}`，远程 `remote_{groupId}____{name}____{value}`。
6. **远程数据**：60 秒内最多拉取一次，失败只记日志不影响本地数据。
7. **模态框**：打开前调用 `ztools.subInputBlur()` 释放焦点。
8. **删除操作**：使用 `useSecondaryConfirm` 做二次确认。
9. **CSS 变量**：分组颜色通过 `--group-color` 动态设置；主色使用 `--plugin-primary-color`。

### 组件规范

```
ComponentName/
├── index.tsx
├── ComponentName.tsx
└── ComponentName.module.less
```

React FC + TypeScript，Props 继承 `React.HTMLAttributes<HTMLDivElement>`，用 `classnames` 合并类名，样式用 CSS Modules（`.module.less`）。

---

## 常用命令

```bash
pnpm dev         # Vite 开发服务器（配合 ZTools「插件开发」加载 src-ztools/plugin.json）
pnpm build       # 构建到 src-ztools/dist
pnpm test        # preload / 路径 / 编辑器命令 / 预览回归
pnpm typecheck   # tsc --noEmit
pnpm lint        # ESLint
```

## 核心设计理念

1. **键盘优先**：所有操作可键盘完成
2. **搜索驱动**：模糊搜索是主要导航方式（Raycast / Alfred 风格）
3. **数据驱动**：本地持久化 + 导入导出
4. **扩展性**：远程分组便于共享链接库
5. **性能**：拼音匹配预处理、远程节流缓存、组件记忆化

## 功能演进方向

- [ ] 支持更多数据源类型（CSV、API 认证）
- [ ] 数据备份与同步
- [ ] 自定义排序规则
- [ ] 标签系统（替代或增强分组）
- [ ] 数据统计面板
- [ ] 链接可用性检查
