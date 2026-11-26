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
  // 历代官制图谱：按朝代切换的信息图长页，默认布局（无页脚、无调色器）。
  { path: "/china/qing-officials" },
  { path: "/china/institutions" },
  { path: "/china/institutions/:topicId" },
  { path: "/china/imperial-exam" },
  { path: "/china/imperial-exam/:sectionId" },
];
