import {
  ATLAS_LABELS,
  ATLAS_VIEW,
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
/** 示意范围从锚点凸包向外轻微扩张，避免边界正好压在城市符号上。 */
const HULL_EXPAND = 1.07;
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

/**
 * 凸包 + 圆角闭合路径： Quadratic 控制点取每个锚点，端点取相邻锚点的中点，
 * 画出来是一片手绘感的示意区域，而不是带实测含义的折线边界。
 */
export function getDynastyOutline(territory: DynastyTerritory): DynastyOutline {
  const hull = convexHull(projectDynastyCities(territory).map((entry) => entry.point));
  const centroid: MapPoint = [
    hull.reduce((sum, point) => sum + point[0], 0) / hull.length,
    hull.reduce((sum, point) => sum + point[1], 0) / hull.length,
  ];
  const points: MapPoint[] = hull.map(
    ([x, y]): MapPoint => [
      round(centroid[0] + (x - centroid[0]) * HULL_EXPAND),
      round(centroid[1] + (y - centroid[1]) * HULL_EXPAND),
    ],
  );
  const mid = (a: MapPoint, b: MapPoint): MapPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(points[points.length - 1]!, points[0]!);
  let d = `M ${round(start[0])} ${round(start[1])}`;
  for (let index = 0; index < points.length; index += 1) {
    const control = points[index]!;
    const end = mid(control, points[(index + 1) % points.length]!);
    d += ` Q ${control[0]} ${control[1]} ${round(end[0])} ${round(end[1])}`;
  }
  d += " Z";
  return {
    bounds: {
      x0: Math.min(...points.map((point) => point[0])),
      x1: Math.max(...points.map((point) => point[0])),
      y0: Math.min(...points.map((point) => point[1])),
      y1: Math.max(...points.map((point) => point[1])),
    },
    d,
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
          Math.max(0, ATLAS_VIEW.x - box.x0) +
          Math.max(0, box.x1 - (ATLAS_VIEW.x + ATLAS_VIEW.width)) +
          Math.max(0, ATLAS_VIEW.y - box.y0) +
          Math.max(0, box.y1 - (ATLAS_VIEW.y + ATLAS_VIEW.height));
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
