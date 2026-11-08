import { ATLAS_VIEW, type AtlasItem, type AtlasView } from "./atlas-items";

/**
 * 选中条目后的局部放大：保持 SVG 的 viewBox 恒定（地图不会重排、不会跳动），
 * 只给最外层 <g> 一个可过渡的 transform，把该条目的锚点范围推到视野中央并放大。
 */
export interface AtlasFocus {
  k: number;
  tx: number;
  ty: number;
}

export const ZOOM_MIN = 1.3;
export const ZOOM_MAX = 2.6;

const round = (value: number) => Math.round(value * 100) / 100;

export function getAtlasFocus(item: AtlasItem | null, view: AtlasView = ATLAS_VIEW): AtlasFocus {
  if (!item) return { k: 1, tx: 0, ty: 0 };

  const xs = item.points.map((point) => point.point[0]);
  const ys = item.points.map((point) => point.point[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;

  // 先按「锚点范围 + 四周留白」算能放多大，再夹到可读的倍率区间。
  const fit = Math.min(view.width / (x1 - x0 + 12), view.height / (y1 - y0 + 12));
  const k = round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit)));
  const viewCx = view.x + view.width / 2;
  const viewCy = view.y + view.height / 2;
  return { k, tx: round(viewCx - k * cx), ty: round(viewCy - k * cy) };
}

/** CSS transform 字符串；SVG <g> 的 transform-origin 默认是 viewBox 原点 (0 0)。 */
export function atlasTransform(focus: AtlasFocus): string {
  return `translate(${focus.tx}px, ${focus.ty}px) scale(${focus.k})`;
}
