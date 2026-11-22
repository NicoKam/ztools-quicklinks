const process = require('node:process');
const { createEditorService } = require('./editors.cjs');
const { createInvocationAppService, createInvocationDebugLogger, getInvocationDebugLogPath } = require('./front-app.cjs');

const invocationDebugEnabled = process.env.QUICKLINKS_FOREGROUND_DEBUG === '1';
const invocationDebugLogPath = invocationDebugEnabled ? getInvocationDebugLogPath(window.ztools) : null;
const logInvocationAppDebug = createInvocationDebugLogger(invocationDebugLogPath, { enabled: invocationDebugEnabled });

// 将文件读取和编辑器启动能力提供给渲染进程。
window.services = {
  ...createEditorService(),
  ...createInvocationAppService({ ztools: window.ztools, log: logInvocationAppDebug }),
  getInvocationAppDebugLogPath: () => invocationDebugLogPath,
  logInvocationAppDebug,
};
