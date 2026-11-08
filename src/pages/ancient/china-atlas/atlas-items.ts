import { FRONTIER_POLICIES } from "./frontier-policies";
import { MIGRATION_EVENTS } from "./migration-events";
import { MIGRATION_BASEMAP, projectMigration, routePathD } from "./migration-projection";
import { TERRITORY_SNAPSHOTS } from "./territory-snapshots";
import type { AtlasDynastyId, AtlasTopicId } from "./types";

/**
 * 「历史地理图谱」统一功能页的数据层。
 *
 * 三份史料数据（疆域快照 / 迁徙路线 / 边疆制度）在这里被整理成同一组「条目」，
 * 每条都带着自己的定位点、说明、时期与资料出处。页面与地图只认这一份结构：
 * 切换「全部 / 单项」只是过滤可见条目，不改底图、不改视野、不重新排布标注。
 *
 * 详情文案全部原样取自各自的数据文件，本模块不新增任何史实表述。
 */
export type AtlasLayerId = AtlasTopicId | "all";

export type AtlasPointKind = "capital" | "anchor" | "seat" | "waypoint";

export interface AtlasPoint {
  kind: AtlasPointKind;
  name: string;
  point: readonly [number, number];
}

export interface AtlasItem {
  /** `${topic}:${sourceId}`，在三份数据之间保持唯一。 */
  id: string;
  sourceId: string;
  topic: AtlasTopicId;
  dynastyId: AtlasDynastyId;
  /** 侧栏菜单用的短名。 */
  short: string;
  /** 地图标注文字。 */
  label: string;
  /** 详情卡标题。 */
  title: string;
  period: string;
  description: string;
  sources: readonly string[];
  /** 详情卡里的地点 / 治所 / 途经注记，逐行渲染。 */
  notes: readonly string[];
  /** 标注引导线的锚点（都城 / 迁徙终点 / 治所）。 */
  primary: readonly [number, number];
  points: readonly AtlasPoint[];
  /** 迁徙路线的曲线路径与途经点；其余主题没有。 */
  route?: { d: string; points: readonly (readonly [number, number])[] };
  /** 疆域快照的年份，供时间轴使用；负数表示公元前。 */
  year?: number;
}

function yearLabel(year: number): string {
  return year < 0 ? `前${-year}` : `${year}`;
}

const territoryItems: readonly AtlasItem[] = TERRITORY_SNAPSHOTS.map((snapshot) => {
  const capital = projectMigration(...snapshot.capital.ll);
  const anchors = snapshot.anchors.map((place) => ({
    kind: "anchor" as const,
    name: place.name,
    point: projectMigration(...place.ll),
  }));
  return {
    id: `territory:${snapshot.id}`,
    sourceId: snapshot.id,
    topic: "territory" as const,
    dynastyId: snapshot.dynastyId,
    short: snapshot.label,
    label: snapshot.label,
    title: snapshot.label,
    period: `${yearLabel(snapshot.year)} 年`,
    description: snapshot.description,
    sources: snapshot.sources,
    notes: [
      `都城 · ${snapshot.capital.name}`,
      `节点 · ${snapshot.anchors.map((place) => place.name).join("、")}`,
      ...(snapshot.areaWanKm2 ? [`面积估算 · 约 ${snapshot.areaWanKm2} 万 km²`] : []),
    ],
    primary: capital,
    points: [{ kind: "capital" as const, name: snapshot.capital.name, point: capital }, ...anchors],
    year: snapshot.year,
  };
});

const migrationItems: readonly AtlasItem[] = MIGRATION_EVENTS.map((event) => {
  const points = event.waypoints.map((waypoint) => projectMigration(...waypoint.ll));
  const destination = points[points.length - 1] ?? ([0, 0] as const);
  return {
    id: `migration:${event.id}`,
    sourceId: event.id,
    topic: "migration" as const,
    dynastyId: event.dynastyId,
    short: `${event.group} → ${event.to}`,
    label: event.group,
    title: `${event.group} · ${event.from} → ${event.to}`,
    period: event.period,
    description: event.description,
    sources: event.sources,
    notes: [
      `途经 · ${event.waypoints
        .map((waypoint) => waypoint.name)
        .filter(Boolean)
        .join(" → ")}`,
      `起点 · ${event.from} ｜ 终点 · ${event.to}`,
    ],
    primary: destination,
    points: event.waypoints.map((waypoint, index) => ({
      kind: "waypoint" as const,
      name: waypoint.name ?? event.to,
      point: points[index] ?? destination,
    })),
    route: { d: routePathD(points), points },
  };
});

const frontierItems: readonly AtlasItem[] = FRONTIER_POLICIES.map((policy) => {
  const seat = projectMigration(...policy.seat.ll);
  return {
    id: `frontier:${policy.id}`,
    sourceId: policy.id,
    topic: "frontier" as const,
    dynastyId: policy.dynastyId,
    short: policy.institution,
    label: policy.institution,
    title: policy.institution,
    period: policy.period,
    description: policy.description,
    sources: policy.sources,
    notes: [
      `治所 · ${policy.seat.name}`,
      `辖区 · ${policy.regions.join("、")}`,
      `防御范围 · ${policy.defenseScope}`,
    ],
    primary: seat,
    points: [{ kind: "seat" as const, name: policy.seat.name, point: seat }],
  };
});

/** 全部 22 条：疆域 6 + 迁徙 8 + 边疆 8。顺序固定，标注布局因此也是确定的。 */
export const ATLAS_ITEMS: readonly AtlasItem[] = [
  ...territoryItems,
  ...migrationItems,
  ...frontierItems,
];

export interface AtlasView {
  box: string;
  height: number;
  width: number;
  x: number;
  y: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * 固定的地图视野：以底图主图为基础，向西扩到能容纳撒马尔罕，四周留出标注空间。
 * 这是一份常量——切换「全部 / 单项」绝不重算 viewBox，地图因此不会跳动。
 */
export const ATLAS_VIEW: AtlasView = (() => {
  const [baseX, baseY, baseW, baseH] = MIGRATION_BASEMAP.view;
  let x0 = baseX;
  let y0 = baseY;
  let x1 = baseX + baseW;
  let y1 = baseY + baseH;
  for (const item of ATLAS_ITEMS) {
    for (const { point } of item.points) {
      x0 = Math.min(x0, point[0]);
      y0 = Math.min(y0, point[1]);
      x1 = Math.max(x1, point[0]);
      y1 = Math.max(y1, point[1]);
    }
  }
  const pad = 8;
  const x = round(x0 - pad);
  const y = round(y0 - pad);
  const width = round(x1 + pad - x);
  const height = round(y1 + pad - y);
  return { box: `${x} ${y} ${width} ${height}`, height, width, x, y };
})();

/** 标签字号与行高（底图坐标单位），布局估算与渲染共用。 */
export const LABEL_FONT_SIZE = 3;
export const LABEL_HEIGHT = 4.6;

/** 半角字符按 0.55 字宽估算，其余按一个全角字宽估算；只用于避让，不拉伸文字。 */
export function estimateLabelWidth(text: string): number {
  let units = 0;
  for (const char of text) {
    units += char.charCodeAt(0) < 128 ? LABEL_FONT_SIZE * 0.55 : LABEL_FONT_SIZE;
  }
  return round(units + 1.8);
}

export interface LabelPlacement {
  id: string;
  /** 标签框中心。 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 引导线：从标图点连到标签框边缘最近处。 */
  leader: { x1: number; y1: number; x2: number; y2: number };
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** 先向图幅东侧的海面找空位，再依次尝试上下与西侧；同一层距离里按此顺序挑。 */
const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, -0.55],
  [1, 0.55],
  [0, -1],
  [0, 1],
  [0.7, -0.9],
  [0.7, 0.9],
  [-0.7, -0.9],
  [-0.7, 0.9],
  [-1, 0],
  [0.4, -1],
  [0.4, 1],
];
/** 引导线可拉到的距离序列：近处放不下就继续向外找，直到标签互不遮挡。 */
const DISTANCES: readonly number[] = [4.8, 7.8, 11, 14.5, 18, 22, 26, 31];

function overlapArea(first: Box, second: Box, gap: number): number {
  const width = Math.min(first.x1 + gap, second.x1) - Math.max(first.x0 - gap, second.x0);
  const height = Math.min(first.y1 + gap, second.y1) - Math.max(first.y0 - gap, second.y0);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * 确定性的标注避让：按注册顺序为每条标注挑一个不越界、不压住已放标签、
 * 也不盖住其它标图点的位置。近邻共享同一地点时（如四幅快照的都城都在长安），
 * 后面的标注会沿着引导线被推到更远的空处。
 *
 * 纯函数、只依赖静态数据：同一组条目永远得到同一套位置，页面切换时标签不会重排。
 */
export function placeLabels(
  items: readonly AtlasItem[],
  view: AtlasView = ATLAS_VIEW,
): readonly LabelPlacement[] {
  const placed: Box[] = [];
  const anchors = items.map((item) => item.primary);
  const bounds: Box = {
    x0: view.x + 0.4,
    x1: view.x + view.width - 0.4,
    y0: view.y + 0.4,
    y1: view.y + view.height - 0.4,
  };

  return items.map((item, index) => {
    const width = estimateLabelWidth(item.label);
    const [px, py] = item.primary;
    let chosen: { x: number; y: number; box: Box } | null = null;
    let fallback: { x: number; y: number; box: Box; penalty: number } | null = null;

    for (const distance of DISTANCES) {
      for (const [dx, dy] of DIRECTIONS) {
        const length = Math.hypot(dx, dy) || 1;
        const x = round(px + (dx / length) * distance);
        const y = round(py + (dy / length) * distance);
        const box: Box = {
          x0: x - width / 2,
          x1: x + width / 2,
          y0: y - LABEL_HEIGHT / 2,
          y1: y + LABEL_HEIGHT / 2,
        };
        const outside =
          Math.max(0, bounds.x0 - box.x0) +
          Math.max(0, box.x1 - bounds.x1) +
          Math.max(0, bounds.y0 - box.y0) +
          Math.max(0, box.y1 - bounds.y1);
        const collisions = placed.reduce((sum, other) => sum + overlapArea(box, other, 0.6), 0);
        const coveredAnchors = anchors.filter(
          ([ax, ay], anchorIndex) =>
            anchorIndex !== index &&
            ax > box.x0 - 0.6 &&
            ax < box.x1 + 0.6 &&
            ay > box.y0 - 0.6 &&
            ay < box.y1 + 0.6,
        ).length;
        const clean = outside === 0 && collisions === 0 && coveredAnchors === 0;
        const penalty = outside * 100 + collisions * 12 + coveredAnchors * 4 + distance * 0.01;
        if (clean && !chosen) {
          chosen = { box, x, y };
          break;
        }
        if (!fallback || penalty < fallback.penalty) {
          fallback = { box, penalty, x, y };
        }
      }
      if (chosen) break;
    }

    const result = chosen ?? fallback;
    if (!result) {
      throw new Error(`无法为标注 ${item.id} 安排位置`);
    }
    placed.push(result.box);
    const { box, x, y } = result;
    // 引导线终点取标签框边缘上离标图点最近的位置，线不会穿过整块标签。
    const ex = Math.min(Math.max(px, box.x0 + 0.4), box.x1 - 0.4);
    const ey = Math.min(Math.max(py, box.y0 + 0.4), box.y1 - 0.4);
    return {
      height: LABEL_HEIGHT,
      id: item.id,
      leader: { x1: px, x2: round(ex), y1: py, y2: round(ey) },
      width,
      x,
      y,
    };
  });
}

/**
 * 全量标注布局在模块加载时算一次并冻结：任何过滤状态下都复用同一批坐标，
 * 「全部 ↔ 单项」切换时底图、标图点与标签位置三者都不动。
 */
export const ATLAS_LABELS: ReadonlyMap<string, LabelPlacement> = new Map(
  placeLabels(ATLAS_ITEMS).map((placement) => [placement.id, placement]),
);

export function getVisibleItems(layer: AtlasLayerId): readonly AtlasItem[] {
  return layer === "all" ? ATLAS_ITEMS : ATLAS_ITEMS.filter((item) => item.topic === layer);
}

export const ATLAS_LAYER_OPTIONS: readonly { id: AtlasLayerId; label: string }[] = [
  { id: "all", label: "全部图谱" },
  { id: "territory", label: "疆域变迁" },
  { id: "migration", label: "民族迁徙" },
  { id: "frontier", label: "边疆治理" },
];
