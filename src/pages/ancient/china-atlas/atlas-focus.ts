import { ATLAS_VIEW, type AtlasView } from "./atlas-items";

/**
 * 局部放大 = 换一个更窄的 viewBox，而不是给 <g> 加 CSS transform。
 *
 * SVG 的 CSS transform 受 transform-box / transform-origin 影响，基准点在不同
 * 浏览器里并不等价于用户坐标 (0 0)，焦点会被推偏；直接改 viewBox 则在数学上
 * 保证「焦点中心 == viewBox 中心 == xMidYMid 的可视区中心」。
 *
 * 另一处关键：底图坐标是 173×131 的窄画面，而地图容器通常是宽扁的，
 * preserveAspectRatio="xMidYMid meet" 会把内容压在中间一小条、两侧大片空白。
 * 因此聚焦视野的宽高比按**容器实测比例**生成，放大后正好铺满可视区。
 */
export interface FocusRegion {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface AtlasFocus extends AtlasView {
  /** 焦点中心（用户坐标），恒等于 viewBox 中心。 */
  cx: number;
  cy: number;
  focused: boolean;
  /** 相对全览视野高度的放大倍率。 */
  zoom: number;
}

export const ZOOM_MAX = 2.2;

const round = (value: number) => Math.round(value * 100) / 100;

export function regionOfPoints(points: readonly (readonly [number, number])[]): FocusRegion | null {
  if (points.length === 0) return null;
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

export interface FocusOptions {
  /** 只放大到这个区域；null 表示全览。 */
  region?: FocusRegion | null;
  /** 全览基准视野。 */
  view?: AtlasView;
  /** 地图容器的宽 / 高；默认按全览视野比例（jsdom 与 SSR 的稳妥退路）。 */
  ratio?: number;
  /** 焦点区域四周留白（用户单位）。 */
  padding?: number;
  /** 放大上限；下限交由「整段必须装进视野」决定，绝不为放大而裁切区域。 */
  maxZoom?: number;
}

export function getAtlasFocus({
  maxZoom = ZOOM_MAX,
  padding = 10,
  ratio,
  region = null,
  view = ATLAS_VIEW,
}: FocusOptions = {}): AtlasFocus {
  const aspect = ratio && ratio > 0 ? ratio : view.width / view.height;
  const fullHeight = view.height;
  const fullWidth = fullHeight * aspect;
  const fullX = round(view.x + view.width / 2 - fullWidth / 2);
  const fullY = view.y;
  const overview: AtlasFocus = {
    box: `${fullX} ${fullY} ${round(fullWidth)} ${round(fullHeight)}`,
    cx: round(fullX + fullWidth / 2),
    cy: round(fullY + fullHeight / 2),
    focused: false,
    height: round(fullHeight),
    width: round(fullWidth),
    x: fullX,
    y: fullY,
    zoom: 1,
  };
  if (!region) return overview;

  const cx = (region.x0 + region.x1) / 2;
  const cy = (region.y0 + region.y1) / 2;
  const neededWidth = region.x1 - region.x0 + padding * 2;
  const neededHeight = region.y1 - region.y0 + padding * 2;
  // 既要装下区域的宽、也要装下区域的高；取两个 fit 的较小值，保证整段不被裁切，
  // 只在放大上限处封顶——跨度极大的区域因此会自然地「少放大」而非切掉两端。
  const fitByHeight = fullHeight / neededHeight;
  const fitByWidth = fullWidth / neededWidth;
  const zoom = Math.min(maxZoom, fitByHeight, fitByWidth);
  const height = fullHeight / zoom;
  const width = height * aspect;
  const x = round(cx - width / 2);
  const y = round(cy - height / 2);
  return {
    box: `${x} ${y} ${round(width)} ${round(height)}`,
    cx: round(cx),
    cy: round(cy),
    focused: true,
    height: round(height),
    width: round(width),
    x,
    y,
    zoom: round(zoom),
  };
}
