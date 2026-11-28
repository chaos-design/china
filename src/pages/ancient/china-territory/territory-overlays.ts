import { resolvePeriodAt } from "./chronicle-control";
import { periodStartMonth } from "./chronicle-time";
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

/** 渐进显隐阈值：边防/重要城市在 zoom ≥ 5 出现，区划点在 zoom ≥ 6 出现。 */
export const DIVISION_ZOOM = 6;
export const DEFENSE_ZOOM = 5;

export interface PolityRingSpec {
  /** 闭合环 [lat, lng]（已做曲线化）。 */
  ring: Array<[number, number]>;
  /** own = 本政权原有疆域；absorbed = 已并入的旧政权疆域。 */
  kind: "own" | "absorbed";
  /** 原属政权名（absorbed 时）。 */
  fromName?: string;
  /** 并入年份（absorbed 时）。 */
  sinceYear?: number;
}

export interface PolitySpec {
  id: string;
  name: string;
  color: string;
  note: string;
  /** 当前有效疆域环（本政权 + 已并入政权），own 在前。 */
  rings: PolityRingSpec[];
  /** 主疆域闭合环 [lat, lng] 数组（own 环；兼容旧调用）。 */
  ring: Array<[number, number]>;
  /** 羁縻范围闭合环（虚线），可缺省。 */
  looseRing?: Array<[number, number]>;
  /** 政权名标注锚点 [lat, lng]（own 环包围盒中心）。 */
  labelAt: [number, number];
  /** 已并入的政权名（按并入时间）。 */
  absorbedNames: string[];
}

export interface CapitalSpec {
  name: string;
  latlng: [number, number];
  kind: "main" | "secondary";
  note?: string;
  polityName: string;
  color: string;
  /** 是否已易主（当前控制方 ≠ 原属政权）。 */
  changed: boolean;
  /** 原属政权名（易主时）。 */
  originName: string;
  /** 当前控制变更说明（易主时）。 */
  changeNote?: string;
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

export interface CitySpec {
  name: string;
  latlng: [number, number];
  note?: string;
  polityName: string;
  color: string;
  /** 是否已易主。 */
  changed: boolean;
  /** 原属政权名（易主时）。 */
  originName: string;
  /** 当前控制变更说明（易主时）。 */
  changeNote?: string;
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
  /** advance = 军事推进箭头（锥形箭杆 + 倒钩箭头，闭合多边形）；retreat = 虚线撤退线。 */
  kind: "advance" | "retreat";
  /** 1 = 主攻方向；2 = 次要方向（线宽 / 透明度递减）。 */
  priority: 1 | 2;
  /** advance 时给出箭头多边形闭合环（Leaflet [lat,lng]）。 */
  ring?: Array<[number, number]>;
  /** 原始路径（Leaflet [lat,lng]），retreat 渲染为虚线，advance 仅供 tooltip 参照。 */
  path: Array<[number, number]>;
  /** 箭头尖端位置。 */
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
  phases?: WarSpecPhase[];
  sources: readonly string[];
}

export interface WarSpecPhase {
  year: string;
  text: string;
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

/**
 * 轻微内收：曲线化会向外鼓出，分裂期相邻示意环容易压在一起。按包围盒中心
 * 做极小比例内收（默认 1.2%），既消除大部分视觉重叠，又不改变政权四至口径。
 */
export function insetRing(
  ring: readonly (readonly [number, number])[],
  factor = 0.988,
): Array<[number, number]> {
  if (ring.length === 0) return [];
  const b = ringBounds(ring);
  const cx = (b.w + b.e) / 2;
  const cy = (b.s + b.n) / 2;
  return ring.map(([lng, lat]) => [cx + (lng - cx) * factor, cy + (lat - cy) * factor]);
}

/** 一期的全部政权图层规格（当前月份的控制图：主疆域 + 已并入 + 羁縻 + 名称标注）。 */
export function buildPolitySpecs(period: ChroniclePeriod, month?: number): PolitySpec[] {
  const resolved = resolvePeriodAt(period, month ?? periodStartMonth(period));
  return resolved.activePolities.map((entry) => {
    const polity = entry.polity;
    const ownRing = insetRing(
      smoothRing(polity.territory, {
        seed: `${period.id}/${polity.id}`,
        wobble: 0.012,
      }),
    );
    return {
      id: polity.id,
      name: polity.name,
      color: polity.color,
      note: polity.note,
      rings: entry.rings.map((ring) => ({
        ring: insetRing(
          smoothRing(ring.ring, {
            seed: `${period.id}/${ring.fromPolity?.id ?? polity.id}`,
            wobble: 0.018,
          }),
        ).map(toLatLng),
        kind: ring.kind,
        fromName: ring.fromPolity?.name,
        sinceYear: ring.sinceYear,
      })),
      ring: ownRing.map(toLatLng),
      looseRing: polity.looseTerritory
        ? smoothRing(polity.looseTerritory, {
            seed: `${period.id}/${polity.id}/loose`,
            samplesPerSegment: 5,
          }).map(toLatLng)
        : undefined,
      labelAt: bboxCenter(polity.territory),
      absorbedNames: entry.absorbedNames,
    };
  });
}

/** 一期的都城点（按当前控制方着色；已易主的城带「原属」信息）。 */
export function buildCapitalSpecs(period: ChroniclePeriod, month?: number): CapitalSpec[] {
  const resolved = resolvePeriodAt(period, month ?? periodStartMonth(period));
  const specs: CapitalSpec[] = [];
  for (const city of resolved.cities) {
    if (city.kind !== "capital" || !city.polity) continue;
    specs.push({
      name: city.name,
      latlng: toLatLng(city.ll),
      kind: city.capitalKind ?? "main",
      note: city.note,
      polityName: city.polity.name,
      color: city.polity.color,
      changed: city.changed,
      originName: city.originPolity.name,
      changeNote: city.change?.note,
    });
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

/** 一期的重要城市采样点（按当前控制方着色；与区划同为 zoom 渐进显隐）。 */
export function buildCitySpecs(period: ChroniclePeriod, month?: number): CitySpec[] {
  const resolved = resolvePeriodAt(period, month ?? periodStartMonth(period));
  const specs: CitySpec[] = [];
  for (const city of resolved.cities) {
    if (city.kind !== "city" || !city.polity) continue;
    specs.push({
      name: city.name,
      latlng: toLatLng(city.ll),
      note: city.note,
      polityName: city.polity.name,
      color: city.polity.color,
      changed: city.changed,
      originName: city.originPolity.name,
      changeNote: city.change?.note,
    });
  }
  return specs;
}

/** 一期的边防要素：线状（长城/运河/边墙，轻度曲线化）与点状（边镇/要塞）。 */
export function buildDefenseSpecs(period: ChroniclePeriod): DefenseSpec[] {
  return period.defenses.map((defense) => ({
    id: defense.id,
    name: defense.name,
    kind: defense.kind,
    line: defense.points
      ? smoothPath(defense.points, {
          seed: `${period.id}/${defense.id}`,
          samplesPerSegment: 4,
          wobble: 0.02,
        }).map(toLatLng)
      : undefined,
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

export interface WarSpecOptions {
  /**
   * 当前缩放级别下 1° 经度对应的屏幕像素。给出时箭头宽度按屏幕像素锁定
   * （缩放时视觉宽度稳定，不会在放大后变成巨箭）；缺省用固定度数。
   */
  pxPerDegree?: number;
  /** 主攻箭头目标屏幕宽度（px，默认 9）。 */
  primaryWidthPx?: number;
  /** 次要箭头目标屏幕宽度（px，默认 6）。 */
  secondaryWidthPx?: number;
}

/**
 * 把完整行军路线压缩成「指向箭头」：只取路线中段一小截，明确方向即可，
 * 不再把箭尖画到具体城池（用户口径「指向就行，不需要指到具体的位置」）。
 */
export function directionIndicator(points: readonly LngLat[]): {
  path: [LngLat, LngLat];
  tip: LngLat;
  angle: number;
} {
  const cum = [0];
  for (let i = 1; i < points.length; i += 1) {
    cum.push(
      cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  }
  const total = cum[cum.length - 1];
  const at = (distance: number): LngLat => {
    let seg = 1;
    while (seg < cum.length - 1 && cum[seg] < distance) seg += 1;
    const t = (distance - cum[seg - 1]) / Math.max(1e-9, cum[seg] - cum[seg - 1]);
    return [
      points[seg - 1][0] + (points[seg][0] - points[seg - 1][0]) * t,
      points[seg - 1][1] + (points[seg][1] - points[seg - 1][1]) * t,
    ];
  };
  const startDistance = total * 0.38;
  const indicatorLength = Math.min(2.6, Math.max(0.5, total * 0.26));
  const endDistance = Math.min(total, startDistance + indicatorLength);
  const start = at(startDistance);
  const tip = at(endDistance);
  const angle = (Math.atan2(tip[0] - start[0], tip[1] - start[1]) * 180) / Math.PI;
  return { path: [start, tip], tip, angle };
}

/** 战争图层规格：军事推进箭头（锥形多边形）、战场、包围圈、flyTo 包围盒、战役阶段。 */
export function buildWarSpec(war: WarEvent, options: WarSpecOptions = {}): WarSpec {
  const arrows: WarArrowSpec[] = [];
  const battles: WarSpec["battles"] = [];
  const encircles: WarSpec["encircles"] = [];
  const primaryWidthPx = options.primaryWidthPx ?? 9;
  const secondaryWidthPx = options.secondaryWidthPx ?? 6;
  const pxPerDegree = options.pxPerDegree;
  let arrowIndex = 0;
  for (const op of war.ops ?? []) {
    if (op.kind === "arrow" || op.kind === "retreat") {
      const points = op.points ?? [];
      if (points.length < 2) continue;
      // divIcon 三角形默认朝上（北），旋转角按屏幕坐标（x 右、y 下）计算
      const indicator = directionIndicator(points);
      const kind: "advance" | "retreat" = op.kind === "retreat" ? "retreat" : "advance";
      const priority: 1 | 2 = arrowIndex === 0 ? 1 : 2;
      arrowIndex += 1;
      // 屏幕像素宽度 → 度（经度方向 1° 的像素数在 Web 墨卡托下与纬度无关）
      const widthPx = priority === 1 ? primaryWidthPx : secondaryWidthPx;
      const tailWidth = pxPerDegree ? widthPx / pxPerDegree : priority === 1 ? 0.09 : 0.06;
      const headWidth = tailWidth * 0.62;
      const barbLength = tailWidth * 2.1;
      arrows.push({
        name: op.name,
        side: op.side,
        kind,
        priority,
        ring:
          kind === "advance"
            ? buildArrowPolygon(indicator.path, {
                seed: `${war.id}/${op.name}`,
                tailWidth,
                headWidth,
                barbLength,
              }).map(toLatLng)
            : undefined,
        path: points.map(toLatLng),
        tipAt: toLatLng(indicator.tip),
        tipAngleDeg: indicator.angle,
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
    phases: war.phases?.map((phase) => ({ year: phase.year, text: phase.text })),
    sources: war.sources,
  };
}

/** 侧栏战争列表项：id/名称/年份/对阵/一句话/机器可读起始年/是否带推进阶段。 */
export function buildWarList(period: ChroniclePeriod) {
  return period.wars.map((war) => ({
    id: war.id,
    name: war.name,
    year: war.year,
    sideA: war.sideA,
    sideB: war.sideB,
    brief: war.brief,
    startYear: parseWarYearRange(war.year)[0],
    hasPhases: (war.phases?.length ?? 0) > 0,
  }));
}

// ---------- 曲线化：Catmull-Rom 闭合插值 + 种子化扰动 ----------

/** FNV-1a 32 位哈希（种子来源，与 china-map-geometry 同思路）。 */
function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 伪随机数生成器（确定性，模块外不可变）。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SmoothOptions {
  /** 扰动种子（决定性：同 key 输出稳定，不随渲染抖动）。 */
  seed: string;
  /** 每段插值采样数（默认 7）。 */
  samplesPerSegment?: number;
  /** 扰动幅度（度，默认 0.07；线状要素用小值）。 */
  wobble?: number;
}

/** Chaikin 切角平滑（一次迭代）：新顶点取每边 1/4 与 3/4 处。
 * 切角法输出始终落在原多边形凸包内，简单多边形平滑后仍保持简单（不自交），
 * 比 Catmull-Rom 少了过冲尖角交叉的风险。 */
function chaikinClosedOnce(ring: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const n = ring.length;
  for (let i = 0; i < n; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
    out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
  }
  return out;
}

function chaikinOpenOnce(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length < 3) return points;
  const out: Array<[number, number]> = [points[0]];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
    out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
  }
  out.push(points[points.length - 1]);
  return out;
}

function segLength(a: LngLat, b: LngLat): number {
  const dx = (b[0] - a[0]) * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  const dy = b[1] - a[1];
  return Math.hypot(dx, dy);
}

/**
 * 闭合环曲线化：先按种子对顶点做小幅有序扰动（幅度不超过邻段长度的 1/3，
 * 防止交叉），再以 Catmull-Rom 样条密集采样，输出平滑闭合环。
 * 输入输出都是 [lng, lat]；输出首尾重合、点数 ≈ 顶点数 × samples。
 */
export function smoothRing(
  ring: readonly LngLat[],
  options: SmoothOptions,
): Array<[number, number]> {
  const samples = options.samplesPerSegment ?? 7;
  const wobbleAmp = options.wobble ?? 0.07;
  const rng = mulberry32(hashSeed(options.seed));
  // 去掉闭合点，得到 n 个唯一顶点
  const vertices = ring.slice(0, -1).map((ll) => [ll[0], ll[1]] as [number, number]);
  const n = vertices.length;
  if (n < 3) return ring.map((ll) => [ll[0], ll[1]] as [number, number]);
  // 有序扰动：幅度与邻段长度成比例，避免短段被推到交叉
  const perturbed = vertices.map(([lng, lat], i) => {
    const prev = vertices[(i - 1 + n) % n];
    const next = vertices[(i + 1) % n];
    const local = Math.min(segLength(prev, [lng, lat]), segLength([lng, lat], next));
    const amp = Math.min(wobbleAmp, local / 3);
    return [lng + (rng() * 2 - 1) * amp, lat + (rng() * 2 - 1) * amp] as [number, number];
  });
  // 三次切角：顶点数 ×8，圆滑且保证不自交
  let smoothed: Array<[number, number]> = perturbed;
  const iterations = samples >= 7 ? 3 : 2;
  for (let i = 0; i < iterations; i += 1) {
    smoothed = chaikinClosedOnce(smoothed);
  }
  const out = smoothed;
  out.push([out[0][0], out[0][1]]);
  return out;
}

/** 开放路径轻度平滑（长城/运河等线状要素），首尾点保持不动。 */
export function smoothPath(
  path: readonly LngLat[],
  options: SmoothOptions,
): Array<[number, number]> {
  const wobbleAmp = options.wobble ?? 0.02;
  if (path.length < 3) {
    return path.map((ll) => [ll[0], ll[1]] as [number, number]);
  }
  const rng = mulberry32(hashSeed(options.seed));
  const inner = path.slice(1, -1).map(([lng, lat], i) => {
    const prev = path[i];
    const next = path[i + 2];
    const local = Math.min(segLength(prev, [lng, lat]), segLength([lng, lat], next));
    const amp = Math.min(wobbleAmp, local / 3);
    return [lng + (rng() * 2 - 1) * amp, lat + (rng() * 2 - 1) * amp] as [number, number];
  });
  const first = path[0];
  const last = path[path.length - 1];
  let smoothed: Array<[number, number]> = [[first[0], first[1]], ...inner, [last[0], last[1]]];
  for (let i = 0; i < 2; i += 1) {
    smoothed = chaikinOpenOnce(smoothed);
  }
  return smoothed;
}

// ---------- 专业军事推进箭头：锥形箭杆 + 倒钩箭头 ----------

export interface ArrowOptions {
  /** 扰动/重采样种子。 */
  seed?: string;
  /** 箭尾宽度（纬度度数，默认 0.6）。 */
  tailWidth?: number;
  /** 箭头处箭杆宽度（度，默认 0.22）。 */
  headWidth?: number;
  /** 箭头倒钩长度（度，默认 0.5）。 */
  barbLength?: number;
}

/**
 * 把途经点路径转换为经典军事作业箭头的闭合多边形：
 * 沿路径按弧长重采样，箭杆宽度从箭尾到箭头线性收窄，
 * 尖端带一对向后掠的倒钩。宽度按纬度定义，经度方向按 cos(lat)
 * 校正，保证箭头在各纬度视觉宽度一致。
 */
export function buildArrowPolygon(
  path: readonly LngLat[],
  options: ArrowOptions = {},
): Array<[number, number]> {
  const tailWidth = options.tailWidth ?? 0.26;
  const headWidth = options.headWidth ?? 0.11;
  const barbLength = options.barbLength ?? 0.32;
  const spacing = 0.22;
  if (path.length < 2) return [];
  const latMid = path.reduce((sum, ll) => sum + ll[1], 0) / path.length;
  const cosLat = Math.max(0.2, Math.cos((latMid * Math.PI) / 180));
  // 投影到局部度量（x = lng·cos(latMid)，单位近似等距），几何在此空间完成
  const proj = path.map(([lng, lat]) => ({ x: lng * cosLat, y: lat }));
  // 按弧长重采样
  const lens: number[] = [0];
  for (let i = 1; i < proj.length; i += 1) {
    lens.push(lens[i - 1] + Math.hypot(proj[i].x - proj[i - 1].x, proj[i].y - proj[i - 1].y));
  }
  const total = lens[lens.length - 1];
  if (total <= 0) return [];
  const sampleCount = Math.max(10, Math.min(200, Math.ceil(total / spacing)));
  const samples: Array<{ x: number; y: number; dx: number; dy: number }> = [];
  let seg = 1;
  for (let s = 0; s < sampleCount; s += 1) {
    const d = (total * s) / (sampleCount - 1);
    while (seg < lens.length - 1 && lens[seg] < d) seg += 1;
    const t = (d - lens[seg - 1]) / Math.max(1e-9, lens[seg] - lens[seg - 1]);
    const x = proj[seg - 1].x + (proj[seg].x - proj[seg - 1].x) * t;
    const y = proj[seg - 1].y + (proj[seg].y - proj[seg - 1].y) * t;
    samples.push({ x, y, dx: 0, dy: 0 });
  }
  // 方向用中心差分，端点用单侧差分
  for (let s = 0; s < samples.length; s += 1) {
    const a = samples[Math.max(0, s - 1)];
    const b = samples[Math.min(samples.length - 1, s + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    samples[s].dx = (b.x - a.x) / len;
    samples[s].dy = (b.y - a.y) / len;
  }
  // 左右轮廓（前进方向左侧为 +normal）
  const left: Array<{ x: number; y: number }> = [];
  const right: Array<{ x: number; y: number }> = [];
  for (let s = 0; s < samples.length; s += 1) {
    const p = samples[s];
    const t = s / (samples.length - 1);
    const w = (tailWidth + (headWidth - tailWidth) * t) / 2;
    const nx = -p.dy;
    const ny = p.dx;
    left.push({ x: p.x + nx * w, y: p.y + ny * w });
    right.push({ x: p.x - nx * w, y: p.y - ny * w });
  }
  const tip = samples[samples.length - 1];
  const barbBackX = tip.x - tip.dx * barbLength;
  const barbBackY = tip.y - tip.dy * barbLength;
  const barbHalf = headWidth * 1.9;
  const headNX = -tip.dy;
  const headNY = tip.dx;
  const barbR = { x: barbBackX + headNX * barbHalf, y: barbBackY + headNY * barbHalf };
  const barbL = { x: barbBackX - headNX * barbHalf, y: barbBackY - headNY * barbHalf };
  // 环序：左缘前进 → 右倒钩 → 尖端 → 左倒钩 → 右缘后退 → 闭合
  const ring: Array<{ x: number; y: number }> = [
    ...left,
    { x: barbR.x, y: barbR.y },
    { x: tip.x, y: tip.y },
    { x: barbL.x, y: barbL.y },
    ...right.slice().reverse(),
  ];
  const out = ring.map((p) => [p.x / cosLat, p.y] as [number, number]);
  out.push([out[0][0], out[0][1]]);
  return out;
}

// ---------- 年度时间轴模型 ----------

/**
 * 解析战争年份表述为机器可读区间 [起, 讫]（负数 = 公元前）。
 * 支持「约前1600」「前230 — 前221」「前202 — 公元8」「前354 / 前341」「1644」。
 */
export function parseWarYearRange(year: string): [number, number] {
  const tokens: number[] = [];
  const re = /(前|公元)?\s*(\d+)/g;
  let match = re.exec(year);
  while (match) {
    const era = match[1];
    const value = Number(match[2]);
    tokens.push(era === "前" ? -value : value);
    match = re.exec(year);
  }
  if (tokens.length === 0) return [0, 0];
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return first <= last ? [first, last] : [last, first];
}

/** 战争起始年（编年时间轴的推进刻度）。 */
export function warStartYear(war: WarEvent): number {
  return parseWarYearRange(war.year)[0];
}

export interface TimeStop {
  year: number;
  /** period = 疆域切换点；war = 战役起始年（部署上线）。 */
  kind: "period" | "war";
  periodIndex: number;
  warId?: string;
  /** 时间轴读出文案。 */
  label: string;
}

/** 全站时间停止点序列：各期起始年 + 各战争起始年，按年份升序（同年期在前）。 */
export function buildTimeStops(periods: readonly ChroniclePeriod[]): TimeStop[] {
  const stops: TimeStop[] = [];
  periods.forEach((period, periodIndex) => {
    stops.push({
      year: period.startYear,
      kind: "period",
      periodIndex,
      label: period.display ?? period.name,
    });
    for (const war of period.wars) {
      stops.push({
        year: warStartYear(war),
        kind: "war",
        periodIndex,
        warId: war.id,
        label: war.name,
      });
    }
  });
  const rank = (stop: TimeStop) => (stop.kind === "period" ? 0 : 1);
  return stops.sort((a, b) => a.year - b.year || rank(a) - rank(b));
}

/** 年份所属时期（最后一个 startYear ≤ year 的期；越界取首/尾期）。 */
export function getPeriodIndexForYear(periods: readonly ChroniclePeriod[], year: number): number {
  let index = 0;
  for (let i = 0; i < periods.length; i += 1) {
    if (periods[i].startYear <= year) index = i;
  }
  return index;
}

/** 期内「截至某年」最新开战的战争（年度推进的自动部署）。 */
export function latestWarAtOrBefore(period: ChroniclePeriod, year: number): WarEvent | null {
  let found: WarEvent | null = null;
  for (const war of period.wars) {
    if (warStartYear(war) <= year) {
      if (!found || warStartYear(war) > warStartYear(found)) found = war;
    }
  }
  return found;
}

/** 期内「截至某年」已开战但非当前部署的战争（累积战场标记）。 */
export function pastWarsAtOrBefore(
  period: ChroniclePeriod,
  year: number,
  activeId: string | null,
): WarEvent[] {
  return period.wars.filter((war) => war.id !== activeId && warStartYear(war) <= year);
}

/** 环自交检测（线段两两相交，跳过相邻边与闭合边）；测试与数据校验共用。 */
export function findRingSelfIntersection(ring: readonly LngLat[]): string | null {
  const n = ring.length;
  const crosses = (a1: LngLat, a2: LngLat, b1: LngLat, b2: LngLat): boolean => {
    const d = (o: LngLat, a: LngLat, b: LngLat) =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const d1 = d(a1, a2, b1);
    const d2 = d(a1, a2, b2);
    const d3 = d(b1, b2, a1);
    const d4 = d(b1, b2, a2);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 2; j < n - 1; j += 1) {
      if (i === 0 && j === n - 2) continue;
      if (crosses(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        return `边 ${i}(${ring[i].join(",")}) 与边 ${j}(${ring[j].join(",")}) 相交`;
      }
    }
  }
  return null;
}

/** 切期取景包围盒：优先 focus 中心 ± 半径，否则取当前控制图的联合包围盒。 */
export function getPeriodBounds(
  period: ChroniclePeriod,
  month?: number,
): [[number, number], [number, number]] {
  const [centerLat, centerLng] = toLatLng(period.focus.center);
  const halfDeg = 4;
  const world = { s: 90, w: 180, n: -90, e: -180 };
  // 给了月份就按当前控制图取景（疆域缩并后镜头随之内收），否则用全期疆域。
  const rings =
    month == null
      ? period.polities.map((polity) => polity.territory)
      : resolvePeriodAt(period, month).activePolities.flatMap((entry) =>
          entry.rings.map((ring) => ring.ring),
        );
  const usable = rings.length > 0 ? rings : period.polities.map((polity) => polity.territory);
  for (const ring of usable) {
    const b = ringBounds(ring);
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
