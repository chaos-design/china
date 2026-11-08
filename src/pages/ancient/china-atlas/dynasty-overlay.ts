import {
  ATLAS_LABELS,
  ATLAS_VIEW,
  type AtlasView,
  estimateLabelWidth,
  LABEL_FONT_SIZE,
  type LabelPlacement,
} from "./atlas-items";
import type { DynastyCity, DynastyTerritory } from "./dynasty-territories";
import { projectMigration } from "./migration-projection";

/**
 * 朝代叠加层的纯几何：把都城 / 城市投到底图坐标，围出**示意**范围，
 * 再为城市名做一次确定性的避让排版。这里不产生任何新的史实表述，
 * 所有点都来自 dynasty-territories.ts 的锚点表。
 */

export type MapPoint = readonly [number, number];

export interface ProjectedCity {
  name: string;
  point: MapPoint;
  role: DynastyCity["role"];
  /** 都城在名称后补「都城」二字，与一般城市区分。 */
  text: string;
}

export interface DynastyOutline {
  bounds: { x0: number; x1: number; y0: number; y1: number };
  d: string;
  points: readonly MapPoint[];
}

export interface DynastyCityLabel extends LabelPlacement {
  role: DynastyCity["role"];
  text: string;
}

export const CITY_FONT_SIZE = 2.2;
export const CITY_LABEL_HEIGHT = 3.2;
/** 示意范围从锚点凸包向外扩张的留白：边界不再贴着城市符号，也更像一片墨晕。 */
const HULL_MARGIN = 1.9;
/** 边界采样间距（用户单位）：沿每条凸包边等距取点，长边多分几段。 */
const EDGE_SEGMENT = 9;
/** 长边中点外弓幅度：按边长比例封顶，长边鼓成缓弧，边界不出现直线段。 */
const BOW_RATIO = 0.07;
const BOW_MAX = 1.7;
/** 确定性「手抖」幅度：一低一高两个谐波让边界读作手绘墨迹而非几何圆。 */
const WOBBLE_PRIMARY = 0.34;
const WOBBLE_SECONDARY = 0.18;
const round = (value: number) => Math.round(value * 100) / 100;

export function projectDynastyCities(territory: DynastyTerritory): readonly ProjectedCity[] {
  return territory.cities.map((entry) => ({
    name: entry.name,
    point: projectMigration(...entry.ll),
    role: entry.role,
    text: entry.role === "capital" ? `${entry.name} · 都城` : entry.name,
  }));
}

function cross(o: MapPoint, a: MapPoint, b: MapPoint): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Andrew monotone chain：去掉共线点，返回逆时针凸包。 */
export function convexHull(points: readonly MapPoint[]): readonly MapPoint[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const unique = sorted.filter(
    (point, index) =>
      index === 0 || point[0] !== sorted[index - 1]![0] || point[1] !== sorted[index - 1]![1],
  );
  if (unique.length <= 2) return unique;

  const lower: MapPoint[] = [];
  for (const point of unique) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: MapPoint[] = [];
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** FNV-1a：由朝代 id 派生相位，同一个朝代永远得到同一条边界。 */
function hashSeed(text: string): number {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const TAU = Math.PI * 2;

/** 闭合同构 Catmull-Rom → 三次贝塞尔：相邻点互相带一阶导，边界读作曲线而非折线。 */
export function smoothClosedPath(points: readonly MapPoint[]): string {
  const count = points.length;
  if (count < 3) return "";
  const at = (index: number): MapPoint => points[((index % count) + count) % count]!;
  const first = at(0);
  let d = `M ${round(first[0])} ${round(first[1])}`;
  for (let index = 0; index < count; index += 1) {
    const previous = at(index - 1);
    const current = at(index);
    const next = at(index + 1);
    const after = at(index + 2);
    const control1: MapPoint = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ];
    const control2: MapPoint = [
      next[0] - (after[0] - current[0]) / 6,
      next[1] - (after[1] - current[1]) / 6,
    ];
    d += ` C ${round(control1[0])} ${round(control1[1])} ${round(control2[0])} ${round(control2[1])} ${round(next[0])} ${round(next[1])}`;
  }
  return `${d} Z`;
}

/**
 * 凸包外扩成一片没有直线的示意边界：
 *
 * 沿每条凸包边按 EDGE_SEGMENT 等距取点，逐点沿外法向推开 HULL_MARGIN，
 * 长边中点再外弓一段缓弧（sin 半波）、整圈叠加由朝代 id 决定相位的两个
 * 谐波微抖——凸包边被鼓成弧线，顶点由角点 + Catmull-Rom 自然磨圆。
 * 全部几何只由锚点凸包与 id 派生，不宣称实测边界。
 */
export function getDynastyOutline(territory: DynastyTerritory): DynastyOutline {
  const hull = convexHull(projectDynastyCities(territory).map((entry) => entry.point));
  if (hull.length < 3) {
    // 退化凸包（单点 / 两点 / 空）：数据保证不会发生，给出安全空值而不是画错。
    return { bounds: { x0: 0, x1: 0, y0: 0, y1: 0 }, d: "", points: [] };
  }
  const seed = hashSeed(territory.id);
  const phase1 = ((seed % 360) / 360) * TAU;
  const phase2 = (((seed >>> 9) % 360) / 360) * TAU;

  const count = hull.length;
  const edges = hull.map((start, index) => {
    const end = hull[(index + 1) % count]!;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    return {
      start,
      end,
      dx,
      dy,
      length,
      // 该绕向下的外法向：底图坐标 y 向下，凸包呈顺时针绕行视觉。
      normal: length > 0 ? [dy / length, -dx / length] : [0, 0],
    };
  });
  const perimeter = edges.reduce((sum, edge) => sum + edge.length, 0);
  const wobbleAt = (progress: number) =>
    WOBBLE_PRIMARY * Math.sin(3 * TAU * progress + phase1) +
    WOBBLE_SECONDARY * Math.sin(5 * TAU * progress + phase2);

  const points: MapPoint[] = [];
  let travelled = 0;
  for (let index = 0; index < count; index += 1) {
    const edge = edges[index]!;
    const next = edges[(index + 1) % count]!;
    const steps = Math.min(12, Math.max(2, Math.round(edge.length / EDGE_SEGMENT)));
    const bow = Math.min(BOW_MAX, edge.length * BOW_RATIO);
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const progress = (travelled + t * edge.length) / perimeter;
      const offset = HULL_MARGIN + bow * Math.sin(Math.PI * t) + wobbleAt(progress);
      points.push([
        round(edge.start[0] + edge.dx * t + edge.normal[0] * offset),
        round(edge.start[1] + edge.dy * t + edge.normal[1] * offset),
      ]);
    }
    travelled += edge.length;

    // 顶点角点：取相邻两条边外法向的角平分方向，把两段边的接缝鼓到外切圆弧上。
    const bisX = edge.normal[0] + next.normal[0];
    const bisY = edge.normal[1] + next.normal[1];
    const bisLength = Math.hypot(bisX, bisY);
    const cornerProgress = travelled / perimeter;
    const cornerOffset = HULL_MARGIN + wobbleAt(cornerProgress);
    const unitX = bisLength > 1e-6 ? bisX / bisLength : edge.normal[0];
    const unitY = bisLength > 1e-6 ? bisY / bisLength : edge.normal[1];
    points.push([
      round(edge.end[0] + unitX * cornerOffset),
      round(edge.end[1] + unitY * cornerOffset),
    ]);
  }
  return {
    bounds: {
      x0: Math.min(...points.map((point) => point[0])),
      x1: Math.max(...points.map((point) => point[0])),
      y0: Math.min(...points.map((point) => point[1])),
      y1: Math.max(...points.map((point) => point[1])),
    },
    d: smoothClosedPath(points),
    points,
  };
}

/** 先试上 / 下 / 右 / 左，再试四角与偏上下的斜向；同一圈里按此顺序挑。 */
const DIRECTIONS: readonly MapPoint[] = [
  [0, -1],
  [0, 1],
  [1, 0],
  [-1, 0],
  [0.8, -0.7],
  [-0.8, -0.7],
  [0.8, 0.7],
  [-0.8, 0.7],
  [0.35, -1],
  [-0.35, -1],
  [0.35, 1],
  [-0.35, 1],
];
/** 近处放不下就一圈圈往外找，直到标签互不遮挡。 */
const DISTANCES: readonly number[] = [4.2, 6.2, 8.6, 11.4, 14.8, 19];

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function overlap(first: Box, second: Box, gap = 0.6): number {
  const width = Math.min(first.x1 + gap, second.x1) - Math.max(first.x0 - gap, second.x0);
  const height = Math.min(first.y1 + gap, second.y1) - Math.max(first.y0 - gap, second.y0);
  return width > 0 && height > 0 ? width * height : 0;
}

function cityLabelWidth(text: string): number {
  return round(estimateLabelWidth(text) * (CITY_FONT_SIZE / LABEL_FONT_SIZE));
}

/**
 * 城市名的确定性避让：先躲开当前可见条目的标签框，再躲开已放好的城市名。
 * 与 ATLAS_LABELS 一样是纯函数、只在数据变化时算一次，切换图层不会重排。
 */
export function placeDynastyCityLabels(
  territory: DynastyTerritory,
  visibleItemIds: readonly string[],
  view: AtlasView = ATLAS_VIEW,
): readonly DynastyCityLabel[] {
  const cities = projectDynastyCities(territory);
  const obstacles: Box[] = visibleItemIds.flatMap((id) => {
    const placement = ATLAS_LABELS.get(id);
    if (!placement) return [];
    return [
      {
        x0: placement.x - placement.width / 2,
        x1: placement.x + placement.width / 2,
        y0: placement.y - placement.height / 2,
        y1: placement.y + placement.height / 2,
      },
    ];
  });
  const placed: Box[] = [];

  return cities.map((entry, index) => {
    const width = cityLabelWidth(entry.text);
    const [px, py] = entry.point;
    let chosen: { box: Box; x: number; y: number } | null = null;
    let fallback: { box: Box; penalty: number; x: number; y: number } | null = null;

    for (const distance of DISTANCES) {
      for (const [dirX, dirY] of DIRECTIONS) {
        const length = Math.hypot(dirX, dirY) || 1;
        const x = round(px + (dirX / length) * distance);
        const y = round(py + (dirY / length) * distance);
        const box: Box = {
          x0: x - width / 2,
          x1: x + width / 2,
          y0: y - CITY_LABEL_HEIGHT / 2,
          y1: y + CITY_LABEL_HEIGHT / 2,
        };
        const outside =
          Math.max(0, view.x - box.x0) +
          Math.max(0, box.x1 - (view.x + view.width)) +
          Math.max(0, view.y - box.y0) +
          Math.max(0, box.y1 - (view.y + view.height));
        const collisions =
          [...obstacles, ...placed].reduce((sum, other) => sum + overlap(box, other), 0) +
          cities
            .filter((_other, otherIndex) => otherIndex !== index)
            .filter(
              (other) =>
                other.point[0] > box.x0 - 0.5 &&
                other.point[0] < box.x1 + 0.5 &&
                other.point[1] > box.y0 - 0.5 &&
                other.point[1] < box.y1 + 0.5,
            ).length *
            3;
        const clean = outside === 0 && collisions === 0;
        const penalty = outside * 100 + collisions * 12 + distance * 0.01;
        if (clean && !chosen) {
          chosen = { box, x, y };
          break;
        }
        if (!fallback || penalty < fallback.penalty) fallback = { box, penalty, x, y };
      }
      if (chosen) break;
    }

    const result = chosen ?? fallback;
    if (!result) throw new Error(`无法为城市 ${entry.name} 安排标注`);
    placed.push(result.box);
    const { box, x, y } = result;
    const ex = Math.min(Math.max(px, box.x0 + 0.3), box.x1 - 0.3);
    const ey = Math.min(Math.max(py, box.y0 + 0.3), box.y1 - 0.3);
    return {
      height: CITY_LABEL_HEIGHT,
      id: `${territory.id}:${entry.name}:${index}`,
      leader: { x1: px, x2: round(ex), y1: py, y2: round(ey) },
      role: entry.role,
      text: entry.text,
      width,
      x,
      y,
    };
  });
}

/** 详情页用的城市清单文案，保持与地图标注同一份数据。 */
export function dynastyCitySummary(territory: DynastyTerritory): string {
  return territory.cities.map((entry) => entry.name).join("、");
}
