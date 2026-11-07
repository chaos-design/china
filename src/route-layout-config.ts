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
  // 「疆域与民族图谱」占位入口：默认布局（无页脚、无调色器），与政策页一致。
  { path: "/china/atlas/territory" },
  { path: "/china/atlas/migration" },
  { path: "/china/atlas/frontier" },
];
