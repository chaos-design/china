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
];
