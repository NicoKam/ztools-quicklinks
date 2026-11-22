/// <reference types="vite/client" />
/// <reference types="@ztools-center/ztools-api-types" />

interface Window {
  /** ZTools 宿主注入的插件 API（开发态未加载时可能为空）。 */
  ztools?: ZToolsApi;
  /** 由 src-ztools/preload/services.js 注入的本地能力。 */
  services: {
    captureInvocationApp?: (action?: unknown) => void;
    getInvocationApp?: () => Promise<import('./editorSettings').ForegroundApp | null>;
    getInvocationAppDebugLogPath?: () => string | null;
    logInvocationAppDebug?: (event: string, data?: Record<string, unknown>) => void;
    readPreview: (location: string) => Promise<{ content: string; truncated: boolean }>;
    open: (request: {
      path: string;
      label: string;
      tool: import('./editorSettings').EditorTool;
    }) => Promise<void>;
  };
}

declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const content: { [key: string]: string };
  export default content;
}
