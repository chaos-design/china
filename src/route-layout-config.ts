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
];
