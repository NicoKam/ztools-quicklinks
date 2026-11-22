# ztools-quicklinks

QuickLinks 的 **ZTools** 版本：高效管理快捷链接、文本片段与代码书签，支持类似 VSCode QuickOpen 的模糊搜索。链接一键跳转，文本片段一键粘贴，代码书签直接跳转到编辑器对应行。

> 本项目由 [utools-plugin-quicklinks](https://github.com/NicoKam/utools-plugin-quicklinks) 迁移而来，插件逻辑保持一致，宿主由 uTools 换成 [ZTools](https://github.com/ZToolsCenter/ZTools)。

## 功能特点

- **模糊搜索**：类 VSCode quickOpen 的连续字符匹配，天然支持拼音（`gwc` → `github workflow`）。
- **名称与内容同时匹配**：链接和代码书签同时搜索名称与内容（链接地址 / 文件路径），任意一项命中即可显示，并分别高亮。
- **三种内容类型**：链接、文本片段、代码书签。
- **分组**：本地分组可自定义颜色；远程分组从 URL 拉取 JSON，便于团队共享链接库（1 分钟节流 + 本地缓存）。
- **参数化链接**：`{query}` 占位符，回车时弹窗填参再打开。
- **导入 / 导出**：JSON 格式，支持「完全替换」与「合并」两种模式。
- **键盘优先**：全流程可用键盘完成，无需鼠标。

## 代码书签

点击底部「添加」，选择「代码书签」，在内容中填写文件的绝对路径：

```text
/Users/you/project/src/main.ts
/Users/you/project/src/main.ts:12
C:\Users\you\project\src\main.ts:12
```

支持 `路径:行号:列号`，行列号从 1 开始。路径包含空格时直接填写，无需给整条书签加引号。

代码书签的名称可选；留空时自动以文件名显示，也可用文件名搜索。编辑路径后，未命名书签的显示名称会随文件名更新。

每条书签可单独选择编辑器，或选择「使用全局设置」。双击、Enter 和 Cmd/Ctrl + 1–9 都会使用对应的编辑器打开文件并定位到指定行。右侧预览显示语法高亮、行号和书签行，可点击刷新按钮重新读取文件。

预览使用只读 CodeMirror 6，按可视区域虚拟渲染代码与行号。文件内容会先以纯文本立即展示，再按扩展名异步加载 JS/TS/TSX、Go、Java、Rust、C/C++、C#、Python、SQL、Vue、Shell 等语言支持；未识别的文件类型保持纯文本。快速切换书签时，较早的异步语言结果会被丢弃，不会覆盖当前文件。

预览支持 UTF-8 文本，最多读取前 256 KB / 3000 行。文件丢失、无权限、二进制或非 UTF-8 文件会显示提示，编辑器仍可按自身支持的格式打开文件。

## 编辑器设置

点击底部「设置」打开与添加/编辑面板相同样式的全局设置页。默认使用 VS Code，预置 WebStorm、Zed、Sublime Text 和 Trae；可以修改预置命令，也可添加或删除自定义编辑器。保存后立即生效，跟随全局设置的书签会自动使用新的默认编辑器；指定的编辑器被删除时也会回退到全局默认值。

「根据前台应用自动打开」复选框默认勾选：从 Zed、VS Code 等编辑器唤起 QuickLinks 时，使用该编辑器打开代码书签。取消勾选后使用全局默认编辑器。优先级为「书签单独指定的编辑器 → 唤起前的编辑器 → 全局默认编辑器」。

每次进入插件时捕获一次来源应用，并跳过 ZTools 自身的窗口，不会从后台应用中任意挑选一个编辑器。macOS / Windows 使用系统窗口信息识别，Linux 使用全局默认值。从浏览器、终端等应用唤起，或识别失败时，使用全局默认编辑器。

> 提示：ZTools 的插件视图嵌在宿主窗口内，弹出插件时前台窗口通常就是 ZTools 本身，此时会跳过宿主并按上面的顺序回退到全局默认编辑器。想在插件内查看识别过程，可在启动 ZTools 前设置 `QUICKLINKS_FOREGROUND_DEBUG=1`，日志写到 `~/.ztools/plugins-data/ztools-quicklinks/front-app.log`。

自定义编辑器默认按名称和启动程序匹配，也可在「前台应用标识」中填写应用名称、可执行程序名称或 macOS Bundle ID，多个标识用逗号分隔。

程序可以填写命令名或程序的绝对路径。macOS 会额外查找常见 Applications 安装位置；未找到编辑器时可改为其启动程序的绝对路径。包含空格的程序路径应使用引号包裹。

| 占位符       | 内容                                  |
| ------------ | ------------------------------------- |
| `{path}`     | 文件绝对路径                          |
| `{location}` | 文件路径；带行号时为 `路径:行号:列号` |
| `{line}`     | 书签行号                              |
| `{column}`   | 书签列号，默认 1                      |
| `{dir}`      | 文件所在目录                          |
| `{filename}` | 文件名                                |
| `{label}`    | 书签名称                              |

使用 `[ ]` 包裹仅在书签有行号时添加的参数。例如：

```text
code -r [-g] "{location}"
webstorm [--line {line} --column {column}] "{path}"
"/Applications/My Editor.app/Contents/MacOS/editor" "{path}" [--line {line}]
```

启动命令按程序和参数执行，不使用 shell。需要多步操作时，可把步骤写入脚本，再把脚本路径配置为启动命令。书签导入/导出保留类型和编辑器标识；全局编辑器设置单独保存在本机，导入的编辑器标识不存在时会使用全局默认值。

## 快捷键

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
| `↑` / `↓`、`Tab`         | 切换选中项               |
| `Enter`                  | 执行主操作               |

## 目录结构

```text
.
├── src-ztools/                 # ZTools 插件目录（可直接加载 / 打包发布）
│   ├── plugin.json             # 插件清单
│   ├── logo.png                # 插件图标
│   ├── preload/                # preload（CommonJS，可访问 Node.js）
│   │   ├── services.js         # 入口：把本地能力挂到 window.services
│   │   ├── editors.cjs         # 编辑器启动与文件预览
│   │   ├── front-app.cjs       # 前台应用识别
│   │   ├── front-app.ps1       # Windows 取前台窗口
│   │   ├── front-app.jxa       # macOS 取前台应用
│   │   ├── command-template.cjs / location.cjs  # 由 shared/*.mjs 生成
│   │   └── package.json        # 声明 preload 为 CommonJS
│   └── dist/                   # pnpm build 产物（index.html + assets）
├── src/                        # React 渲染层（无 Node 权限）
├── shared/                     # 渲染层与 preload 共用的纯逻辑（ESM）
├── scripts/sync-preload.mjs    # 把 shared/*.mjs 转成 preload 用的 CommonJS
├── tests/                      # node:test 用例（preload / 路径解析 / 数据）
├── index.html                  # Vite 入口模板
└── vite.config.js
```

## 安装与开发

### 1. 作为开发项目加载（推荐）

```bash
pnpm install
pnpm dev     # 启动 http://localhost:5173
```

然后在 ZTools「设置 → 插件开发」中选择本仓库的 `src-ztools/plugin.json`，再用指令「快捷链接」唤起插件。
`plugin.json` 中的 `development.main` 指向开发服务器，改代码即时热更新。

### 2. 构建后加载

```bash
pnpm build   # 产物输出到 src-ztools/dist
```

`src-ztools/` 就是完整的插件目录：把 `src-ztools` 打成 ZIP，在 ZTools「插件市场 → 导入本地插件」中选择该 ZIP 即可安装。

```bash
# Windows
Compress-Archive -Path src-ztools\* -DestinationPath quicklinks.zip -Force
# macOS / Linux
(cd src-ztools && zip -r ../quicklinks.zip .)
```

### 常用命令

```bash
pnpm dev         # Vite 开发服务器
pnpm build       # 构建到 src-ztools/dist
pnpm test        # 路径解析、编辑器命令、文件预览、preload 加载回归
pnpm typecheck   # TypeScript 类型检查
pnpm lint        # ESLint
```

preload 按 ZTools 的 Node 运行环境生成 CommonJS 模块，使用 `require()` 加载。共享逻辑维护在 `shared/*.mjs`，运行开发服务、构建或测试时会自动生成 `src-ztools/preload/*.cjs`，不要直接编辑生成文件。ZTools 要求 preload 保持可读源码，不允许压缩或混淆，因此 preload 目录不参与打包。

修改 preload 后需要停止并重新运行 QuickLinks 的调试进程，网页热更新不会替换已加载的 preload。

## 从 uTools 版本迁移数据

ZTools 与 uTools 的数据互不相通。迁移步骤：

1. 在 uTools 版 QuickLinks 中打开「导入/导出」，复制导出的 JSON。
2. 在 ZTools 版 QuickLinks 中打开「导入/导出」，把 JSON 粘进去并选择「完全替换」或「与旧数据合并」。

数据键名（`quickLinks`、`quickLinksGroups`、`quickLinksAccessData`、`quickLinksSelectedGroup`、`quickLinksRemoteCache`、`quickLinksEditorSettings`）保持不变；存储位置由 ZTools 按插件隔离，位于 `~/.ztools` 下的 LMDB 数据库。

## uTools → ZTools 迁移说明

| uTools                           | ZTools                                                                    |
| -------------------------------- | ------------------------------------------------------------------------- |
| `window.utools`                  | `window.ztools`                                                           |
| `utools.dbStorage`               | `ztools.dbStorage`（键值语义一致）                                        |
| `utools.onPluginEnter/Out`       | `ztools.onPluginEnter/onPluginOut`                                        |
| `utools.hideMainWindowPasteText` | `ztools.hideMainWindowPasteText`                                          |
| `utools.subInput*`               | `ztools.setSubInput*`（同名方法）                                         |
| `utools.outPlugin`               | `ztools.outPlugin`                                                        |
| `utools.shellOpenExternal`       | `ztools.shellOpenExternal`                                                |
| `utools.isMacOS()`               | `ztools.isMacOS()`                                                        |
| `utools.getPath('userData')`     | `ztools.getPath('pluginData')`（插件专属目录）                            |
| 主题（`prefers-color-scheme`）   | `ztools.getThemeInfo()` / `onThemeChange` + `--plugin-primary-color` 变量 |

其他差异：

- `plugin.json` 需要 `name`、`title`、`version`、`main`、`logo`、`preload`，`features` 结构保持不变。
- 渲染进程没有 Node 权限（`nodeIntegration: false`），所有文件系统能力必须走 `src-ztools/preload/services.js`（本项目已如此）。
- 插件视图使用 `contextIsolation: false`、`sandbox: false`、`nodeIntegration: false`：preload 可以直接把能力挂到 `window.services` 让前端访问，但渲染层本身拿不到 Node。

## License

This project is licensed under the MIT License.
