import { useEffect, useState } from 'react';

/**
 * 读取宿主当前的深色模式状态。
 * 优先使用 ZTools 主题 API（用户在 ZTools 设置里选择的主题），
 * 宿主未提供该 API 时回退到系统偏好。
 * @returns 是否为深色模式
 */
function getInitialDarkMode(): boolean {
  try {
    const themeInfo = window.ztools?.getThemeInfo?.();
    if (themeInfo && typeof themeInfo.isDark === 'boolean') {
      return themeInfo.isDark;
    }
  } catch {
    // 主题 API 不可用时继续走系统偏好。
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * 跟随 ZTools 主题的深色模式 Hook。
 * @returns 当前是否处于深色模式
 */
export default function useDarkThemeMode() {
  // 状态管理当前主题
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const ztools = window.ztools;

    // 宿主提供主题 API 时以宿主设置为准，并在主题切换时同步。
    if (ztools?.onThemeChange) {
      ztools.onThemeChange((themeInfo) => {
        if (typeof themeInfo?.isDark === 'boolean') {
          setDarkMode(themeInfo.isDark);
        }
      });
      // 插件视图可能在主题应用前就已创建，这里补一次同步。
      setDarkMode(Boolean(ztools.isDarkColors?.()));
      return;
    }

    // 兼容宿主没有主题 API 的场景：监听系统主题偏好。
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery)
      return;

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return darkMode;
}
