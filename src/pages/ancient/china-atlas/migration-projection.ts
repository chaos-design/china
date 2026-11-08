/**
 * 民族迁徙地图的真实底图与投影。
 *
 * 底图直接复用 `resources/html-data/liberation-war.json` 的地理图层
 * （真实省界、国界线、河流、海名、经纬网）——那是丝绸路与解放战争图共用的
 * 一套真实边框底图，从这里导入而不是复制一份，是为了避免同一份底图出现
 * 两处需要保持同步的副本。战争专题独有的图层（战役、兵力、铁路等）不取。
 *
 * 底图路径不是经纬度，而是预先投影好的平面坐标。这里实现同一个
 * 兰勃特等角圆锥投影（球体式），把迁徙路线的经纬度投到同一坐标系。
 * 公式已用底图自带的 17 个城市锚点（ll → x/y）逐一验证，误差 < 0.01：
 *   θ = n·(λ − lon0)，ρ = √(C − 2n·sin φ)/n
 *   x = ox + (R·scale/1000)·ρ·sin θ
 *   y = oy + (R·scale/1000)·(ρ·cos θ − ρ0)
 */
import basemapRaw from "../../../../resources/html-data/liberation-war.json?raw";

const DEG_TO_RAD = Math.PI / 180;

/**
 * 底图数据的显式类型：只声明本页用到的图层。
 * 用 `?raw` + JSON.parse 而不是直接 JSON 导入——517KB 的 JSON 字面量类型推断
 * 会让 tsc 明显变慢，raw 字符串则完全不进类型系统。
 */
interface BasemapData {
  PROJECTION: {
    n: number;
    C: number;
    rho0: number;
    R: number;
    lon0: number;
    scale: number;
    offset: [number, number];
  };
  VIEW: { box: [number, number, number, number] };
  CHINA_BORDER: string;
  ISLANDS_PATH: string;
  NINE_DASH: string;
  PROVINCES: { n: string; d: string }[];
  RIVERS: { n: string; d: string; w: number; label: [number, number] }[];
  SEAS: { t: string; x: number; y: number }[];
  GRATICULE: {
    d: string;
    labels: { t: string; x: number; y: number; a: string }[];
  };
}

const basemap = JSON.parse(basemapRaw) as BasemapData;

export const MIGRATION_BASEMAP = {
  /** 底图投影参数（兰勃特等角圆锥，球体式）。 */
  projection: basemap.PROJECTION,
  /** 主图 viewBox：[x, y, width, height]。 */
  view: basemap.VIEW.box,
  /** 省级界（真实边界，含台湾与海南）。 */
  provinces: basemap.PROVINCES,
  /** 国界线。 */
  borderPath: basemap.CHINA_BORDER,
  /** 沿海岛屿与台湾、海南岛外岛屿。 */
  islandsPath: basemap.ISLANDS_PATH,
  /** 南海诸岛九段线（现代参考框架的一部分，浅淡呈现）。 */
  nineDashPath: basemap.NINE_DASH,
  rivers: basemap.RIVERS,
  seas: basemap.SEAS,
  graticule: basemap.GRATICULE,
} as const;

/** 把经纬度投到底图坐标（与省界路径同一坐标系）。 */
export function projectMigration(lon: number, lat: number): readonly [number, number] {
  const { n, C, rho0, R, lon0, scale, offset } = MIGRATION_BASEMAP.projection;
  const theta = n * (lon - lon0) * DEG_TO_RAD;
  const rho = Math.sqrt(C - 2 * n * Math.sin(lat * DEG_TO_RAD)) / n;
  const k = (R * scale) / 1000;
  return [offset[0] + k * rho * Math.sin(theta), offset[1] + k * (rho * Math.cos(theta) - rho0)];
}

/** Catmull-Rom → 三次贝塞尔（开曲线），让迁徙路线读作弧线而不是折线。 */
export function routePathD(points: readonly (readonly [number, number])[]): string {
  if (points.length < 2) return "";
  const at = (index: number): readonly [number, number] =>
    points[Math.min(Math.max(index, 0), points.length - 1)];
  const [startX, startY] = at(0);
  let d = `M ${startX.toFixed(2)} ${startY.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}
