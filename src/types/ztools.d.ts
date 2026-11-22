/**
 * 补齐 @ztools-center/ztools-api-types 发布版本尚未覆盖的宿主 API。
 *
 * ZTools 3.2 运行时（resources/preload.js）已经提供主题信息接口，
 * 但 npm 上的类型包还没同步，这里按宿主实现声明，避免业务代码用 any 绕过类型检查。
 */

/** 宿主主题信息，字段与 ztools.getThemeInfo() 的返回值一致。 */
interface ZToolsThemeInfo {
  isDark: boolean;
  primaryColor: string;
  customColor?: string;
  windowMaterial?: string;
}

interface ZToolsApi {
  /** 获取当前主题信息（深色模式、主色、窗口材质）。 */
  getThemeInfo: () => ZToolsThemeInfo;
  /** 监听主题变化；宿主仅保留最后一个回调。 */
  onThemeChange: (callback: (themeInfo: ZToolsThemeInfo) => void) => void;
}
