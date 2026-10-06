// 手绘中国舆图的几何与数据。
//
// 单独成文件而不是塞在 hand-drawn-map.tsx 里，有两个原因：
// - 这份逻辑是纯函数（投影、路径、分区符号），可以在 Vitest 里直接断言坐标与路径，
//   不需要渲染组件；
// - 生成路径涉及种子化随机与上百分位插值，只要渲染路径上跑就会在 StrictMode 下
//   算两遍。放在模块作用域求值一次，地图轮廓才是稳定的。
//
// 为什么手写经纬度而不是复用 resources/html/taiwan.html 的 makeProjector：
// 那套产出规整等距投影图，手绘感来自笔触抖动 + 分地区符号，两者无法共用。

export type MapZoneId = "north" | "culture" | "islands";

type Point = readonly [number, number];

const DEG_TO_RAD = Math.PI / 180;
const MARGIN = 14;

export const MAP_VIEW = { height: 720, lat0: 15, lat1: 55, lon0: 72, width: 1000 };

// mulberry32：小而稳的确定性随机。种子固定 => 每次构建出的地图完全一致。
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 每个点按自身序号偏移一次，避免相邻点同向偏移把线段拉直。
function wobble(points: Point[], seed: number, amount: number): Point[] {
  const random = mulberry32(seed);
  return points.map(([x, y], index) => {
    const phase = random() * Math.PI * 2 + index * 1.7;
    const radius = amount * (0.35 + random() * 0.65);
    return [x + Math.cos(phase) * radius, y + Math.sin(phase) * radius] as Point;
  });
}

// Catmull-Rom 转三次贝塞尔。没有这一步，轮廓在位移滤镜下仍然看得出折线。
function smoothPath(points: Point[], closed: boolean): string {
  const count = points.length;
  if (count < 2) return "";

  const at = (index: number): Point =>
    closed
      ? points[((index % count) + count) % count]
      : points[Math.min(Math.max(index, 0), count - 1)];

  const [startX, startY] = at(0);
  let d = `M ${startX.toFixed(1)} ${startY.toFixed(1)}`;
  const segments = closed ? count : count - 1;

  for (let index = 0; index < segments; index++) {
    const p0 = at(index - 1);
    const p1 = at(index);
    const p2 = at(index + 1);
    const p3 = at(index + 2);
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  return closed ? `${d} Z` : d;
}

function toPath(points: Point[], options?: { closed?: boolean; seed?: number; wobble?: number }) {
  const { closed = false, seed = 1, wobble: amount = 0 } = options ?? {};
  const source = amount > 0 ? wobble(points, seed, amount) : points;
  return smoothPath(source, closed);
}

// 中国轮廓（粗略，按顺时针）。这是装饰，不是测绘，两条约束压过了地理精度：
//
// 1. 必须是简单闭合曲线。这一点不是审美问题而是正确性问题：map-land-bleed 用
//    7px 描边画同一轮廓，路径一旦自交，重叠处 12% 的墨色会叠成近黑，地图会碎成
//    一片黑带。沿渤海湾来回折返的"真实"画法必须放弃，湾口在菜单这个尺寸上
//    根本看不见，漏掉它比画错它便宜得多。
// 2. 点密度跟着视觉需要走：西北与东北各留一段长弧，东南海岸密一点，
//    让海岸线看起来是被"画"出来的。
const MAINLAND_LONLAT: Point[] = [
  // 西北角，沿哈萨克边界东行
  [73.5, 39.3],
  [75.0, 40.5],
  [76.5, 41.0],
  [80.2, 42.2],
  [82.6, 45.2],
  [85.7, 48.0],
  // 北缘，沿蒙古边界
  [87.3, 49.1],
  [90.0, 47.8],
  [93.5, 45.0],
  [96.4, 43.0],
  [99.5, 42.7],
  [101.0, 42.5],
  [104.5, 41.8],
  [107.5, 42.4],
  [110.0, 42.9],
  [111.5, 43.5],
  [115.0, 45.4],
  [117.5, 46.6],
  [119.7, 47.0],
  // 漠河折向东北。折返幅度压到 1.7°：真实边界在这里回折近 3°，
  // 但 Catmull-Rom 穿过一个急折会拉出一根针状尖刺，比缺了这个角更难看。
  [118.0, 48.6],
  [119.3, 50.3],
  [120.7, 52.3],
  [122.4, 53.5],
  [125.2, 53.2],
  [126.9, 51.3],
  [130.7, 48.9],
  [133.5, 48.3],
  [134.7, 48.4],
  // 沿乌苏里江与图们江西南行。这里曾是两个只差 0.2° 的相邻点
  // （130.6/42.9 与 130.4/42.7）：Catmull-Rom 穿过这种发卡折返会过冲出
  // 一个自交小环，而洇墨层的 7px 描边会把交叠处叠成近黑，所以合并成一个点。
  [133.9, 45.8],
  [131.3, 44.0],
  [130.5, 42.8],
  [128.1, 42.0],
  [126.5, 40.9],
  [124.4, 40.1],
  // 辽东半岛，然后是渤海。湾口整体略去：真实边界在这里要北上天津再东折回来，
  // 回折必然在平滑曲线上留下一个缺口。改成经度单调的一条斜线，山东半岛一并让掉。
  [122.2, 39.3],
  [121.9, 40.3],
  [120.4, 38.4],
  [119.0, 37.8],
  // 东南海岸
  [118.5, 35.0],
  [120.0, 34.0],
  [121.8, 32.1],
  [121.9, 30.8],
  [121.5, 29.0],
  [121.0, 27.5],
  [119.8, 26.0],
  [118.6, 24.5],
  [117.0, 23.4],
  [115.5, 22.8],
  [114.2, 22.3],
  [113.0, 22.0],
  [112.5, 21.7],
  [111.0, 21.5],
  [110.4, 21.0],
  [109.8, 21.4],
  [108.5, 21.6],
  [107.0, 21.6],
  [106.7, 22.0],
  [105.5, 23.0],
  [104.3, 22.7],
  [103.5, 22.5],
  [102.5, 22.4],
  [101.8, 21.2],
  [101.1, 21.8],
  [100.1, 21.5],
  [99.2, 22.1],
  [97.5, 23.9],
  // 西南边境
  [98.7, 25.5],
  [97.3, 28.2],
  [96.2, 29.0],
  [94.5, 29.3],
  [92.0, 27.8],
  [88.5, 27.3],
  [85.8, 28.2],
  [81.5, 30.4],
  [79.0, 32.5],
  [78.2, 34.5],
  [76.5, 35.6],
  [74.5, 37.0],
];

const TAIWAN_LONLAT: Point[] = [
  [121.0, 25.3],
  [122.0, 25.0],
  [121.7, 24.2],
  [121.0, 22.7],
  [120.2, 22.6],
  [120.1, 23.5],
  [120.7, 24.5],
];

const HAINAN_LONLAT: Point[] = [
  [109.2, 20.0],
  [110.2, 20.1],
  [111.0, 19.6],
  [110.6, 18.5],
  [109.5, 18.2],
  [108.6, 19.3],
];

const YELLOW_RIVER: Point[] = [
  [96.5, 34.8],
  [99.5, 34.4],
  [101.5, 35.5],
  [103.5, 36.1],
  [105.0, 36.6],
  [107.5, 37.5],
  [110.0, 39.5],
  [110.5, 40.5],
  [112.5, 39.8],
  [114.0, 38.5],
  [115.5, 37.8],
  [117.0, 37.4],
  [118.2, 37.6],
  [119.0, 37.8],
];

const YANGTZE: Point[] = [
  [90.5, 33.5],
  [94.0, 33.0],
  [97.0, 32.0],
  [99.5, 30.5],
  [101.5, 29.0],
  [104.5, 28.6],
  [107.0, 29.6],
  [110.0, 30.7],
  [112.5, 30.4],
  [114.5, 30.6],
  [117.0, 30.9],
  [119.0, 31.8],
  [120.5, 32.2],
  [121.8, 31.7],
];

const PEARL: Point[] = [
  [104.5, 23.6],
  [106.5, 23.4],
  [109.0, 23.5],
  [111.0, 23.4],
  [113.2, 23.1],
];

// 长城：北方边疆的签名符号。用虚线 + 垛口竖线，区别于实线的山与水。
const GREAT_WALL: Point[] = [
  [98.0, 40.3],
  [101.0, 39.9],
  [104.0, 40.0],
  [107.0, 40.3],
  [110.0, 40.6],
  [113.0, 40.4],
  [116.0, 40.2],
  [118.0, 40.1],
  [119.8, 40.3],
];

// 丝路：横贯东西的驿道，串起河西走廊到中原。
const SILK_ROAD: Point[] = [
  [94.5, 41.2],
  [97.0, 40.8],
  [100.0, 40.2],
  [103.5, 40.2],
  [106.5, 40.5],
  [109.0, 40.7],
  [112.0, 40.5],
  [114.5, 40.3],
  [117.5, 40.0],
];

function fromLonLat(points: Point[]): Point[] {
  return points.map(([lon, lat]) => project(lon, lat));
}

// 投影比例从轮廓数据里反推，而不是手填一个魔数：构图一旦自洽，以后只改经纬度坐标，
// 整幅图会自动重新适配，不需要回来调这两个常数。
//
// cos(lat) 逐点算，不能只乘一次 cos(lat0)：地图横跨 40° 纬度，只用单次 cos 会把北
// 半边整体横向拉宽，东北与华北会比真实更胖。这与 taiwan.html 里 makeProjector 的
// 做法一致，理由也相同。
const MAX_HALF_WIDTH = Math.max(
  ...[...MAINLAND_LONLAT, ...TAIWAN_LONLAT, ...HAINAN_LONLAT].map(
    ([lon, lat]) => (lon - MAP_VIEW.lon0) * Math.cos(lat * DEG_TO_RAD),
  ),
);
const LON_SCALE = (MAP_VIEW.width - MARGIN * 2) / MAX_HALF_WIDTH;
const LAT_SCALE = (MAP_VIEW.height - MARGIN * 2) / (MAP_VIEW.lat1 - MAP_VIEW.lat0);

export function project(lon: number, lat: number): Point {
  return [
    (lon - MAP_VIEW.lon0) * Math.cos(lat * DEG_TO_RAD) * LON_SCALE,
    (MAP_VIEW.lat1 - lat) * LAT_SCALE,
  ];
}

const MAINLAND = fromLonLat(MAINLAND_LONLAT);
const TAIWAN = fromLonLat(TAIWAN_LONLAT);
const HAINAN = fromLonLat(HAINAN_LONLAT);
const WALL_POINTS = fromLonLat(GREAT_WALL);

export const MAP_LAND_OUTLINE = toPath(MAINLAND, { closed: true, seed: 11, wobble: 5 });
export const MAP_LAND_BLEED = toPath(MAINLAND, { closed: true, seed: 23, wobble: 9 });
export const MAP_TAIWAN_OUTLINE = toPath(TAIWAN, { closed: true, seed: 31, wobble: 4 });
export const MAP_HAINAN_OUTLINE = toPath(HAINAN, { closed: true, seed: 43, wobble: 3 });

const YELLOW_RIVER_PATH = toPath(fromLonLat(YELLOW_RIVER), { seed: 57, wobble: 4 });
const YANGTZE_PATH = toPath(fromLonLat(YANGTZE), { seed: 67, wobble: 4 });
const PEARL_PATH = toPath(fromLonLat(PEARL), { seed: 71, wobble: 2.5 });
const GREAT_WALL_PATH = toPath(fromLonLat(GREAT_WALL), { seed: 83, wobble: 3 });
const SILK_ROAD_PATH = toPath(fromLonLat(SILK_ROAD), { seed: 89, wobble: 5 });

/** 山脊：一串人字峰。西南高原用高而密，北方边境用矮而疏。 */
function ridgePeaks(
  centerLonLat: Point,
  options: { count: number; height: number; seed: number; width: number },
): string {
  const random = mulberry32(options.seed);
  const [baseX, baseY] = project(centerLonLat[0], centerLonLat[1]);
  let d = "";

  for (let index = 0; index < options.count; index++) {
    const x = baseX + (index - (options.count - 1) / 2) * options.width + (random() - 0.5) * 6;
    const y = baseY + (random() - 0.5) * 8;
    const height = options.height * (0.72 + random() * 0.48);
    const half = options.width * (0.34 + random() * 0.16);
    d += ` M ${(x - half).toFixed(1)} ${(y + height * 0.32).toFixed(1)} L ${x.toFixed(1)} ${(y - height).toFixed(1)} L ${(x + half).toFixed(1)} ${(y + height * 0.32).toFixed(1)}`;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

/**
 * 点刻：中原黄土、海南林地、东南丘陵都用它，靠密度区分质感。
 *
 * 单独一类而不是复用 map-mark：这些点的直径就是 stroke-width 的一半（round cap），
 * 沿用 map-mark 的 1.1 缩到菜单栏实际宽度后不足 0.5px，等于没画。
 */
function stipple(
  centerLonLat: Point,
  options: { count: number; radiusX: number; radiusY: number; seed: number },
): string {
  const random = mulberry32(options.seed);
  const [centerX, centerY] = project(centerLonLat[0], centerLonLat[1]);
  let d = "";

  for (let index = 0; index < options.count; index++) {
    // 极坐标取样比矩形取样均匀，边界上不会挤成一坨。
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    const x = centerX + Math.cos(angle) * radius * options.radiusX;
    const y = centerY + Math.sin(angle) * radius * options.radiusY;
    d += ` M ${x.toFixed(1)} ${y.toFixed(1)} l 0.1 0`;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

/** 田垄：东南水乡的签名，平行短波纹。 */
function terraceRows(
  startLonLat: Point,
  options: { count: number; length: number; rowGap: number; seed: number; slant: number },
): string {
  const random = mulberry32(options.seed);
  const [startX, startY] = project(startLonLat[0], startLonLat[1]);
  let d = "";

  for (let index = 0; index < options.count; index++) {
    const x = startX + (random() - 0.5) * options.length * 0.22;
    const y = startY + index * options.rowGap;
    const length = options.length * (0.72 + random() * 0.34);
    const slant = options.slant * (0.7 + random() * 0.6);
    d += ` M ${x.toFixed(1)} ${y.toFixed(1)} q ${(length / 2).toFixed(1)} ${slant.toFixed(1)} ${length.toFixed(1)} 0`;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

/** 松树：东北林区。三角冠 + 树干。 */
function pines(
  centerLonLat: Point,
  options: { count: number; seed: number; spread: number },
): string {
  const random = mulberry32(options.seed);
  const [centerX, centerY] = project(centerLonLat[0], centerLonLat[1]);
  let d = "";

  for (let index = 0; index < options.count; index++) {
    const x = centerX + (random() - 0.5) * options.spread;
    const y = centerY + (random() - 0.5) * options.spread * 0.7;
    const scale = 0.7 + random() * 0.5;
    d += ` M ${x.toFixed(1)} ${y.toFixed(1)} l ${(-4.5 * scale).toFixed(1)} ${(9 * scale).toFixed(1)} l ${(9 * scale).toFixed(1)} 0 Z M ${x.toFixed(1)} ${(y + 4 * scale).toFixed(1)} l 0 ${(6 * scale).toFixed(1)}`;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

/**
 * 岛环：岛外一圈潮线，作为海疆线索的落点标记。
 *
 * gap 是按岛的实际尺寸定的：台湾在 viewBox 里只有约 30 单位高，
 * gap 给到 7×3 的话第三圈已经完全套到岛外，整座岛会糊成一个靶心。
 */
function islandRings(points: Point[], count: number, gap: number, seed: number): string {
  const centroidX = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const centroidY = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  let d = "";

  for (let index = 0; index < count; index++) {
    const offset = gap * (index + 1);
    const expanded = points.map(([x, y]) => {
      const dx = x - centroidX;
      const dy = y - centroidY;
      const length = Math.hypot(dx, dy) || 1;
      return [x + (dx / length) * offset, y + (dy / length) * offset] as Point;
    });
    d += `${toPath(expanded, { closed: true, seed: seed + index * 13, wobble: 2 })} `;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

/** 海浪：海南与东南沿海。 */
function waves(
  centerLonLat: Point,
  options: { count: number; radiusX: number; radiusY: number; seed: number },
): string {
  const random = mulberry32(options.seed);
  const [centerX, centerY] = project(centerLonLat[0], centerLonLat[1]);
  let d = "";

  for (let index = 0; index < options.count; index++) {
    const angle = random() * Math.PI * 2;
    const radius = 0.35 + random() * 0.65;
    const x = centerX + Math.cos(angle) * radius * options.radiusX;
    const y = centerY + Math.sin(angle) * radius * options.radiusY;
    const width = 9 + random() * 7;
    d += ` M ${(x - width / 2).toFixed(1)} ${y.toFixed(1)} q ${(width / 4).toFixed(1)} ${(-3.5).toFixed(1)} ${(width / 2).toFixed(1)} 0 q ${(width / 4).toFixed(1)} ${(-3.5).toFixed(1)} ${(width / 2).toFixed(1)} 0`;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

/** 垛口：沿长城线的短竖线，给虚线一个可读的方向感。 */
function wallBattlement(points: Point[], seed: number): string {
  const random = mulberry32(seed);
  let d = "";
  const steps = 26;

  for (let index = 1; index < steps; index++) {
    const position = (index / steps) * (points.length - 1);
    const from = Math.floor(position);
    const [x = 0, y = 0] = points[Math.min(from, points.length - 1)] ?? [];
    const height = 3 + random() * 2.6;
    d += ` M ${x.toFixed(1)} ${(y - height).toFixed(1)} L ${x.toFixed(1)} ${(y + height).toFixed(1)}`;
  }

  // 累加器每段都带前导空格，收尾时统一去掉，输出的 d 才是干净的
  return d.trim();
}

export interface MapStroke {
  className: string;
  d: string;
}

export interface MapZone {
  id: MapZoneId;
  strokes: MapStroke[];
}

const riverStroke = (d: string, thin = false): MapStroke => ({
  className: thin ? "map-river map-river-thin" : "map-river",
  d,
});

const markStroke = (d: string): MapStroke => ({ className: "map-mark", d });
const stippleStroke = (d: string): MapStroke => ({ className: "map-stipple", d });

/**
 * 三个分区对应菜单的三个分类。地图不是控件，但它会跟着左侧选中的分类"点亮"
 * 对应地区——这是让装饰地图读起来有意义的最低成本做法。
 */
export const MAP_ZONES: MapZone[] = [
  {
    id: "north",
    strokes: [
      // 青藏高原：高而密的雪峰
      markStroke(ridgePeaks([85.5, 31.5], { count: 7, height: 34, seed: 101, width: 26 })),
      markStroke(ridgePeaks([92.5, 30.5], { count: 5, height: 30, seed: 103, width: 24 })),
      // 长城：北方边疆的边界符号
      { className: "map-wall", d: GREAT_WALL_PATH },
      markStroke(wallBattlement(WALL_POINTS, 109)),
      // 中原黄土：密集点刻
      stippleStroke(stipple([112.0, 35.5], { count: 150, radiusX: 58, radiusY: 34, seed: 113 })),
      stippleStroke(stipple([106.0, 37.5], { count: 110, radiusX: 40, radiusY: 26, seed: 127 })),
      // 燕山与太行
      markStroke(ridgePeaks([116.0, 39.5], { count: 5, height: 20, seed: 131, width: 22 })),
      markStroke(ridgePeaks([113.5, 36.5], { count: 4, height: 17, seed: 137, width: 20 })),
      // 东北林区
      markStroke(pines([127.5, 45.5], { count: 16, seed: 139, spread: 92 })),
      markStroke(ridgePeaks([128.5, 43.5], { count: 4, height: 22, seed: 149, width: 24 })),
    ],
  },
  {
    id: "culture",
    strokes: [
      // 河西走廊：驿道与戈壁。这是"文化与交通"最直观的地理符号
      { className: "map-route", d: SILK_ROAD_PATH },
      stippleStroke(stipple([100.5, 41.5], { count: 90, radiusX: 74, radiusY: 22, seed: 107 })),
      // 大河：黄河、长江、珠江
      riverStroke(YELLOW_RIVER_PATH),
      riverStroke(YANGTZE_PATH),
      riverStroke(PEARL_PATH, true),
      // 秦岭与巴山：长江与黄河之间的分水岭，也是丝路入中原前的最后一道山口
      markStroke(ridgePeaks([107.0, 33.5], { count: 5, height: 20, seed: 151, width: 24 })),
      markStroke(ridgePeaks([110.0, 31.5], { count: 5, height: 18, seed: 157, width: 22 })),
      // 江南水网
      riverStroke(
        toPath(
          fromLonLat([
            [116.0, 31.0],
            [118.0, 30.4],
            [119.6, 30.2],
            [121.0, 29.4],
          ]),
          { seed: 163, wobble: 3 },
        ),
        true,
      ),
      riverStroke(
        toPath(
          fromLonLat([
            [114.0, 29.5],
            [116.5, 28.8],
            [118.5, 28.2],
            [119.8, 27.0],
          ]),
          { seed: 167, wobble: 3 },
        ),
        true,
      ),
      // 东南丘陵与稻作田垄
      stippleStroke(stipple([117.0, 26.5], { count: 130, radiusX: 48, radiusY: 26, seed: 173 })),
      markStroke(
        terraceRows([112.5, 23.5], { count: 7, length: 62, rowGap: 9, seed: 179, slant: 5 }),
      ),
      markStroke(
        terraceRows([106.5, 24.5], { count: 6, length: 54, rowGap: 10, seed: 181, slant: 4 }),
      ),
      // 西南梯田与云贵点刻
      markStroke(
        terraceRows([101.0, 25.0], { count: 6, length: 48, rowGap: 9, seed: 191, slant: 6 }),
      ),
      stippleStroke(stipple([104.0, 27.0], { count: 120, radiusX: 34, radiusY: 22, seed: 193 })),
      // 东南沿海浪纹
      markStroke(waves([119.5, 26.0], { count: 16, radiusX: 42, radiusY: 30, seed: 197 })),
    ],
  },
  {
    id: "islands",
    strokes: [
      // 台湾：岛外潮线 + 中央山脉
      markStroke(islandRings(TAIWAN, 2, 5, 199)),
      markStroke(ridgePeaks([120.9, 23.9], { count: 4, height: 13, seed: 211, width: 13 })),
      // 澎湖列岛
      stippleStroke(stipple([119.4, 23.6], { count: 14, radiusX: 16, radiusY: 7, seed: 223 })),
      // 海南：潮线 + 南部林地
      markStroke(islandRings(HAINAN, 2, 5, 227)),
      stippleStroke(stipple([109.8, 19.3], { count: 46, radiusX: 22, radiusY: 12, seed: 229 })),
      // 南海诸岛：只做点线，不标地名
      stippleStroke(stipple([113.5, 15.5], { count: 22, radiusX: 46, radiusY: 14, seed: 233 })),
      // 周边海面
      markStroke(waves([121.0, 24.5], { count: 20, radiusX: 34, radiusY: 44, seed: 239 })),
      markStroke(waves([110.5, 20.5], { count: 12, radiusX: 34, radiusY: 22, seed: 241 })),
    ],
  },
];
