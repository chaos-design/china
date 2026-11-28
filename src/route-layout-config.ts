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
  // 历代疆域编年沙盘：默认布局（卫星底图页，无页脚、无调色器）。
  { path: "/china/territory-chronicle" },
  // 职官制度：总目与三个视图，默认布局（无页脚、无调色器）。
  { path: "/china/officials" },
  { path: "/china/officials/structure" },
  { path: "/china/officials/grades" },
  { path: "/china/institutions" },
  { path: "/china/institutions/:topicId" },
  { path: "/china/imperial-exam" },
  { path: "/china/imperial-exam/:sectionId" },
];
