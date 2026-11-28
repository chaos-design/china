import type { SandPalette } from "./sand-table-figures";
import {
  BOARD_DEPTH,
  BOARD_WIDTH,
  boardToWorld,
  type ContourGrid,
  contourSegmentsAt,
  pointInPolygon,
  sampleContourGrid,
} from "./sand-table-terrain";
import type { BattleStep, MapScene } from "./types";

/**
 * 烘焙舆图皮肤：把整张沙盘的「图面」一次性烘进一张高分辨率画布——
 * 低分辨率采样高度场算山体阴影（hillshade），放大后用矢量叠印等高线、
 * 控区套染、经纬网与边缘晕影。这是真实军事沙盘的制作法：起伏的地台上
 * 贴一张印好的图，立体感来自地形本身 + 烘焙明暗，而不是贴花。
 * 纯确定性输出：同一数据 + 同一令牌色，每次烘出同一张图。
 */

export const SKIN_WIDTH = 1024;
export const SKIN_HEIGHT = 684;
/** 低分辨率采样格：山体阴影在这层算，放大后只保留柔和的明暗。 */
const SAMPLE_WIDTH = 510;
const SAMPLE_HEIGHT = 340;

/** 画布像素 → 世界平面坐标（画布上边是北）。 */
export function skinPixelToWorld(px: number, py: number): { x: number; z: number } {
  return {
    x: -BOARD_WIDTH / 2 + (px / SKIN_WIDTH) * BOARD_WIDTH,
    z: -BOARD_DEPTH / 2 + (py / SKIN_HEIGHT) * BOARD_DEPTH,
  };
}

/** 世界平面坐标 → 画布像素。 */
export function worldToSkinPixel(x: number, z: number): { px: number; py: number } {
  return {
    px: ((x + BOARD_WIDTH / 2) / BOARD_WIDTH) * SKIN_WIDTH,
    py: ((z + BOARD_DEPTH / 2) / BOARD_DEPTH) * SKIN_HEIGHT,
  };
}

/** 棋盘像素坐标 → 画布像素（棋盘 [-25,1025]×[-30,670] 覆盖整张画布）。 */
export function boardToSkinPixel(bx: number, by: number): { px: number; py: number } {
  const world = boardToWorld([bx, by]);
  return worldToSkinPixel(world.x, world.z);
}

/**
 * 山体阴影：由采样高度场的中心差分求法线，与暖主光（场景 key 灯同向）点积。
 * 返回 [0,1]，1 = 正对光源。
 */
export function hillshadeAt(heights: Float32Array, index: number, w: number, h: number): number {
  const ix = index % w;
  const iz = Math.floor(index / w);
  const left = heights[iz * w + Math.max(0, ix - 1)];
  const right = heights[iz * w + Math.min(w - 1, ix + 1)];
  const up = heights[Math.max(0, iz - 1) * w + ix];
  const down = heights[Math.min(h - 1, iz + 1) * w + ix];
  const cellW = BOARD_WIDTH / (w - 1);
  const cellH = BOARD_DEPTH / (h - 1);
  const dhdx = (right - left) / (2 * cellW);
  const dhdz = (down - up) / (2 * cellH);
  // 法线 = normalize(-∂h/∂x, 1, -∂h/∂z)。
  const nx = -dhdx;
  const ny = 1;
  const nz = -dhdz;
  const length = Math.hypot(nx, ny, nz);
  // 与 key 灯 (18, 26, 9) 同向。
  const dot = (nx * 18 + ny * 26 + nz * 9) / (length * Math.hypot(18, 26, 9));
  return Math.max(0, Math.min(1, dot));
}

/** 高度分带：低地留纸、缓坡薄赭、脊线压墨。返回 ochre 混合比与 ink 混合比。 */
export function heightBand(height: number): { ink: number; ochre: number } {
  const low = smoothStep(0.1, 0.34, height);
  const high = smoothStep(0.5, 0.86, height);
  return { ink: high * 0.16, ochre: 0.12 + low * 0.3 };
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const CONTOUR_LEVELS = [0.14, 0.3, 0.46, 0.62, 0.78];

function paintSkin(
  canvas: HTMLCanvasElement,
  battle: MapScene,
  step: BattleStep,
  colors: SandPalette,
  grid: ContourGrid,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const w = SAMPLE_WIDTH;
  const h = SAMPLE_HEIGHT;
  // 低分辨率层：高度分带 × 山体阴影。
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const smallContext = small.getContext("2d");
  if (!smallContext) return;
  const image = smallContext.createImageData(w, h);
  for (let iz = 0; iz < h; iz += 1) {
    for (let ix = 0; ix < w; ix += 1) {
      const index = iz * w + ix;
      const height = grid.heights[index];
      const shade = hillshadeAt(grid.heights, index, w, h);
      const band = heightBand(height);
      const base = colors.paper.clone().lerp(colors.ochre, band.ochre).lerp(colors.ink, band.ink);
      // 山体阴影乘入：亮面 1.1、背光面 0.78——提亮基底，避免阴影发闷。
      const light = 0.78 + shade * 0.32;
      const offset = index * 4;
      image.data[offset] = Math.min(255, base.r * 255 * light);
      image.data[offset + 1] = Math.min(255, base.g * 255 * light);
      image.data[offset + 2] = Math.min(255, base.b * 255 * light);
      image.data[offset + 3] = 255;
    }
  }
  smallContext.putImageData(image, 0, 0);
  // 平滑放大到底图分辨率，只保留柔和的明暗（矢量层在放大后叠印）。
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(small, 0, 0, SKIN_WIDTH, SKIN_HEIGHT);

  // 控区套染：己方朱 / 敌方青的淡墨套印，软边（shadowBlur 出晕）。
  for (const region of battle.regions) {
    const held = step.held.includes(region.id);
    const tone = held ? colors.a : colors.b;
    context.save();
    context.beginPath();
    const points = region.points;
    points.forEach((point, index) => {
      const { px, py } = boardToSkinPixel(point[0], point[1]);
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    context.closePath();
    context.shadowColor = `#${tone.getHexString()}`;
    context.shadowBlur = 18;
    context.fillStyle = `#${tone.getHexString()}`;
    context.globalAlpha = held ? 0.3 : 0.24;
    context.fill();
    context.globalAlpha = 0.9;
    context.shadowBlur = 0;
    context.lineWidth = 2.4;
    context.strokeStyle = `#${tone.getHexString()}`;
    context.stroke();
    context.restore();
  }

  // 等高线：矢量叠印，比 3D 线段更细密清晰；每两级加一条计曲线。
  context.save();
  context.lineWidth = 1.4;
  for (let levelIndex = 0; levelIndex < CONTOUR_LEVELS.length; levelIndex += 1) {
    const segments = contourSegmentsAt(grid, CONTOUR_LEVELS[levelIndex]);
    if (segments.length === 0) continue;
    context.strokeStyle =
      levelIndex % 2 === 1 ? `#${colors.ink.getHexString()}` : `#${colors.ink.getHexString()}66`;
    context.globalAlpha = levelIndex % 2 === 1 ? 0.46 : 0.34;
    context.beginPath();
    for (let index = 0; index < segments.length; index += 4) {
      const a = worldToSkinPixel(segments[index], segments[index + 1]);
      const b = worldToSkinPixel(segments[index + 2], segments[index + 3]);
      context.moveTo(a.px, a.py);
      context.lineTo(b.px, b.py);
    }
    context.stroke();
  }
  context.restore();

  // 经纬网：量图网格，比 3D 细线更匀。
  context.save();
  context.strokeStyle = `#${colors.ink.getHexString()}22`;
  context.lineWidth = 1;
  context.beginPath();
  for (let x = -BOARD_WIDTH / 2 + 7; x < BOARD_WIDTH / 2; x += 7) {
    const { px } = worldToSkinPixel(x, 0);
    context.moveTo(px, 0);
    context.lineTo(px, SKIN_HEIGHT);
  }
  for (let z = -BOARD_DEPTH / 2 + 7; z < BOARD_DEPTH / 2; z += 7) {
    const { py } = worldToSkinPixel(0, z);
    context.moveTo(0, py);
    context.lineTo(SKIN_WIDTH, py);
  }
  context.stroke();
  context.restore();

  // 边缘晕影：用旧沙盘的压墨边角。
  const vignette = context.createRadialGradient(
    SKIN_WIDTH / 2,
    SKIN_HEIGHT / 2,
    SKIN_HEIGHT * 0.42,
    SKIN_WIDTH / 2,
    SKIN_HEIGHT / 2,
    SKIN_WIDTH * 0.62,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `#${colors.ink.getHexString()}33`);
  context.fillStyle = vignette;
  context.fillRect(0, 0, SKIN_WIDTH, SKIN_HEIGHT);
}

/** 烘焙结果的形状说明（供测试断言，不依赖 canvas 实现）。 */
export interface MapSkinResult {
  canvas: HTMLCanvasElement;
  grid: ContourGrid;
  key: string;
}

function skinKey(battle: MapScene, step: BattleStep, colors: SandPalette): string {
  const colorKeys = [colors.ink, colors.paper, colors.a, colors.b, colors.ochre]
    .map((color) => color.getHexString())
    .join("-");
  const held = [...step.held].join(",");
  return `${battle.id}:${step.id}:${held}:${colorKeys}`;
}

let cachedSkin: MapSkinResult | null = null;

/**
 * 取烘焙好的舆图皮肤（同 key 直接复用画布）。
 * 数据、幕次或令牌色任一变化都会重新烘焙；主题切换自动跟进。
 */
export function getMapSkin(battle: MapScene, step: BattleStep, colors: SandPalette): MapSkinResult {
  const key = skinKey(battle, step, colors);
  if (cachedSkin && cachedSkin.key === key) return cachedSkin;
  // 采样格与低分辨率画布 1:1 对齐：像素循环直接按 grid.heights 取高度。
  const grid = sampleContourGrid(SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_WIDTH;
  canvas.height = SKIN_HEIGHT;
  paintSkin(canvas, battle, step, colors, grid);
  cachedSkin = { canvas, grid, key };
  return cachedSkin;
}

/** 供场景判断某格是否在己方控区（烘焙层与 3D 元素共用的口径）。 */
export function regionHeld(
  battle: MapScene,
  step: BattleStep,
  x: number,
  z: number,
): boolean | null {
  for (const region of battle.regions) {
    if (pointInPolygon(x, z, region.points)) {
      return step.held.includes(region.id);
    }
  }
  return null;
}
