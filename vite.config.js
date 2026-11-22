import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { sharedFiles, syncPreloadFile } from './scripts/sync-preload.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'sync-preload',
    configureServer(server) {
      const files = sharedFiles.map(entry => ({
        ...entry,
        sourcePath: fileURLToPath(entry.source),
      }));
      server.watcher.add(files.map(file => file.sourcePath));
      server.watcher.on('change', (file) => {
        const entry = files.find(entry => entry.sourcePath === file);
        if (entry)
          syncPreloadFile(entry);
      });
    },
  }],
  // ZTools 以 file:// 加载插件页面，资源必须使用相对路径。
  base: './',
  // 插件根目录自带 plugin.json / preload / logo，不能作为 Vite 的 public 目录被整体拷贝。
  publicDir: false,
  build: {
    // src-ztools 就是可以直接加载或发布的 ZTools 插件目录。
    outDir: 'src-ztools/dist',
    emptyOutDir: true,
  },
});
