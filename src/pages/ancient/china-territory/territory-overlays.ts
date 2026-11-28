import type { ChroniclePeriod, LngLat, WarEvent, WarOp } from "./types";

/**
 * 纯几何规格层：把编年数据换算成 Leaflet 可直接消费的图层规格。
 * 数据里的坐标一律 [经度, 纬度]；Leaflet 的 latlng 一律 [纬度, 经度]，
 * 两者只在这一层互换，scene 不再做任何坐标换算。
 * 所有函数保持纯净（无副作用、无 DOM），scene 与测试共用。
 */

/** 坐标换算：数据 [lng, lat] → Leaflet [lat, lng]。 */
export function toLatLng(ll: LngLat): [number, number] {
  return [ll[1], ll[0]];
}

/** 渐进显隐阈值：区划点在 zoom ≥ 6 出现，边防在 zoom ≥ 5 出现。 */
export const DIVISION_ZOOM = 6;
export const DEFENSE_ZOOM = 5;

export interface PolitySpec {
  id: string;
  name: string;
  color: string;
  note: string;
  /** 主疆域闭合环 [lat, lng] 数组。 */
  ring: Array<[number, number]>;
  /** 羁縻范围闭合环（虚线），可缺省。 */
  looseRing?: Array<[number, number]>;
  /** 政权名标注锚点 [lat, lng]（主环包围盒中心）。 */
  labelAt: [number, number];
}

export interface CapitalSpec {
  name: string;
  latlng: [number, number];
  kind: "main" | "secondary";
  note?: string;
  polityName: string;
  color: string;
}

export interface CoreRegionSpec {
  name: string;
  latlng: [number, number];
  ring?: Array<[number, number]>;
  note: string;
}

export interface DivisionSpec {
  name: string;
  kind: string;
  latlng: [number, number];
  note: string;
}

export interface DefenseSpec {
  id: string;
  name: string;
  kind: string;
  line?: Array<[number, number]>;
  point?: [number, number];
  note: string;
}

export interface WarArrowSpec {
  name: string;
  side: 1 | 2;
  latlngs: Array<[number, number]>;
  /** 箭头尖端位置与朝向（deg，供 divIcon 旋转）。 */
  tipAt: [number, number];
  tipAngleDeg: number;
  note?: string;
}

export interface WarSpec {
  id: string;
  name: string;
  year: string;
  sideA: string;
  sideB: string;
  arrows: WarArrowSpec[];
  battles: Array<{ name: string; side: 1 | 2; latlng: [number, number]; note?: string }>;
  encircles: Array<{ name: string; latlngs: Array<[number, number]> }>;
  /** 地图 flyTo 的包围盒 [[s, w], [n, e]]。 */
  bounds: [[number, number], [number, number]];
  brief: string;
  detail: string;
  outcome: string;
  sources: readonly string[];
}

function bboxCenter(ring: readonly (readonly [number, number])[]): [number, number] {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const [lng, lat] of ring) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

function ringBounds(ring: readonly (readonly [number, number])[]): {
  s: number;
  w: number;
  n: number;
  e: number;
} {
  let s = 90;
  let n = -90;
  let w = 180;
  let e = -180;
  for (const [lng, lat] of ring) {
    s = Math.min(s, lat);
    n = Math.max(n, lat);
    w = Math.min(w, lng);
    e = Math.max(e, lng);
  }
  return { s, w, n, e };
}

/** 一期的全部政权图层规格（主疆域 + 羁縻 + 名称标注）。 */
export function buildPolitySpecs(period: ChroniclePeriod): PolitySpec[] {
  return period.polities.map((polity) => ({
    id: polity.id,
    name: polity.name,
    color: polity.color,
    note: polity.note,
    ring: polity.territory.map(toLatLng),
    looseRing: polity.looseTerritory?.map(toLatLng),
    labelAt: bboxCenter(polity.territory),
  }));
}

/** 一期的都城点。 */
export function buildCapitalSpecs(period: ChroniclePeriod): CapitalSpec[] {
  const specs: CapitalSpec[] = [];
  for (const polity of period.polities) {
    for (const capital of polity.capitals) {
      specs.push({
        name: capital.name,
        latlng: toLatLng(capital.ll),
        kind: capital.kind,
        note: capital.note,
        polityName: polity.name,
        color: polity.color,
      });
    }
  }
  return specs;
}

/** 一期的核心地区。 */
export function buildCoreRegionSpecs(period: ChroniclePeriod): CoreRegionSpec[] {
  return period.coreRegions.map((region) => ({
    name: region.name,
    latlng: toLatLng(region.ll),
    ring: region.polygon?.map(toLatLng),
    note: region.note,
  }));
}

/** 一期的政区采样点（zoom 渐进显隐由 scene 消费）。 */
export function buildDivisionSpecs(period: ChroniclePeriod): DivisionSpec[] {
  return period.divisions.map((division) => ({
    name: division.name,
    kind: division.kind,
    latlng: toLatLng(division.seat),
    note: division.note,
  }));
}

/** 一期的边防要素：线状（长城/运河/边墙）与点状（边镇/要塞）。 */
export function buildDefenseSpecs(period: ChroniclePeriod): DefenseSpec[] {
  return period.defenses.map((defense) => ({
    id: defense.id,
    name: defense.name,
    kind: defense.kind,
    line: defense.points?.map(toLatLng),
    point: defense.ll ? toLatLng(defense.ll) : undefined,
    note: defense.note,
  }));
}

function opBounds(ops: readonly WarOp[], center: LngLat): [[number, number], [number, number]] {
  let s = center[1];
  let n = center[1];
  let w = center[0];
  let e = center[0];
  for (const op of ops) {
    const pts = op.points ?? (op.ll ? [op.ll] : []);
    for (const [lng, lat] of pts) {
      s = Math.min(s, lat);
      n = Math.max(n, lat);
      w = Math.min(w, lng);
      e = Math.max(e, lng);
    }
  }
  // 留 0.6° 余量，让战场与箭头不入边
  return [
    [Math.max(-85, s - 0.6), Math.max(-179, w - 0.6)],
    [Math.min(85, n + 0.6), Math.min(179, e + 0.6)],
  ];
}

/** 战争图层规格：箭头（含尖端朝向）、战场、包围圈、flyTo 包围盒。 */
export function buildWarSpec(war: WarEvent): WarSpec {
  const arrows: WarArrowSpec[] = [];
  const battles: WarSpec["battles"] = [];
  const encircles: WarSpec["encircles"] = [];
  for (const op of war.ops ?? []) {
    if (op.kind === "arrow" || op.kind === "retreat") {
      const points = op.points ?? [];
      if (points.length < 2) continue;
      const tip = points[points.length - 1];
      const prev = points[points.length - 2];
      // divIcon 三角形默认朝上（北），旋转角按屏幕坐标（x 右、y 下）计算
      const dLng = tip[0] - prev[0];
      const dLat = tip[1] - prev[1];
      const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
      arrows.push({
        name: op.name,
        side: op.side,
        latlngs: points.map(toLatLng),
        tipAt: toLatLng(tip),
        tipAngleDeg: angle,
        note: op.note,
      });
    } else if (op.kind === "battle") {
      if (!op.ll) continue;
      battles.push({ name: op.name, side: op.side, latlng: toLatLng(op.ll), note: op.note });
    } else if (op.kind === "encircle") {
      const points = op.points ?? [];
      if (points.length < 3) continue;
      encircles.push({ name: op.name, latlngs: points.map(toLatLng) });
    }
  }
  return {
    id: war.id,
    name: war.name,
    year: war.year,
    sideA: war.sideA,
    sideB: war.sideB,
    arrows,
    battles,
    encircles,
    bounds: opBounds(war.ops ?? [], war.center),
    brief: war.brief,
    detail: war.detail,
    outcome: war.outcome,
    sources: war.sources,
  };
}

/** 侧栏战争列表项：id/名称/年份/对阵/一句话。 */
export function buildWarList(period: ChroniclePeriod) {
  return period.wars.map((war) => ({
    id: war.id,
    name: war.name,
    year: war.year,
    sideA: war.sideA,
    sideB: war.sideB,
    brief: war.brief,
  }));
}

/** 切期取景包围盒：优先 focus 中心 ± 半径，否则取全部政权环的联合包围盒。 */
export function getPeriodBounds(period: ChroniclePeriod): [[number, number], [number, number]] {
  const [centerLat, centerLng] = toLatLng(period.focus.center);
  const halfDeg = 4;
  const world = { s: 90, w: 180, n: -90, e: -180 };
  for (const polity of period.polities) {
    const b = ringBounds(polity.territory);
    world.s = Math.min(world.s, b.s);
    world.n = Math.max(world.n, b.n);
    world.w = Math.min(world.w, b.w);
    world.e = Math.max(world.e, b.e);
  }
  // 大帝国按数据联合包围盒取景；小邦按 focus 中心取景，避免缩得过近
  const spanLat = world.n - world.s;
  const spanLng = world.e - world.w;
  if (spanLat < 3 && spanLng < 3) {
    return [
      [centerLat - halfDeg, centerLng - halfDeg],
      [centerLat + halfDeg, centerLng + halfDeg],
    ];
  }
  const pad = 0.5;
  return [
    [world.s - pad, world.w - pad],
    [world.n + pad, world.e + pad],
  ];
}
