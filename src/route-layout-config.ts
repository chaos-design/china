export interface RouteLayoutConfig {
  immersive?: boolean;
  path: string;
  showFooter?: boolean;
  showThemePicker?: boolean;
}

export const ROUTE_LAYOUT_CONFIGS: RouteLayoutConfig[] = [
  { path: "/", showFooter: true, showThemePicker: true },
  { path: "/china/timeline", immersive: true },
  { path: "/china/policies" },
  // 「历史地理图谱」统一功能页与三条预设图层入口：默认布局（无页脚、无调色器）。
  { path: "/china/atlas" },
  { path: "/china/atlas/territory" },
  { path: "/china/atlas/migration" },
  { path: "/china/atlas/frontier" },
  // 品级纵横：官位品级八朝对比，默认布局（无页脚、无调色器）。
  { path: "/china/ranks" },
  // 品秩全景：整屏立体场景，页内自滚动，不显示页脚与调色器
  { path: "/china/officials" },
];
