import type { BoardPoint } from "./board-geometry";

/** 沙盘尺寸（世界单位）与棋盘像素到世界单位的换算。 */
export const BOARD_WIDTH = 42;
export const BOARD_DEPTH = 28;
export const BOARD_SCALE = 0.04;
export const BOARD_CENTER: BoardPoint = [500, 320];

/** 棋盘坐标 → 沙盘平面坐标。 */
export function boardToWorld(point: BoardPoint): { x: number; z: number } {
  return {
    x: (point[0] - BOARD_CENTER[0]) * BOARD_SCALE,
    z: (point[1] - BOARD_CENTER[1]) * BOARD_SCALE,
  };
}

/**
 * 分层起伏地形：北缘主山脊、南缘次山脊、中部河谷和细碎丘壑。
 * 纯函数，便于在美国式沙盘灯位下校验高度区间，也让 3D 与降级俯视图共用一套地形语义。
 */
export function terrainHeight(x: number, z: number): number {
  const mainRidge = 0.92 * Math.exp(-(((z + 6.4) / 3.6) ** 2)) * (0.72 + 0.28 * Math.cos(x * 0.38));
  const southRidge =
    0.48 * Math.exp(-(((z - 8.2) / 4.4) ** 2)) * (0.68 + 0.32 * Math.sin(x * 0.29));
  const valley = -0.34 * Math.exp(-(((x + 0.6) / 2.6) ** 2));
  const undulation = 0.11 * Math.sin(x * 0.74 + z * 0.41) + 0.07 * Math.cos(z * 0.95 - x * 0.22);
  return mainRidge + southRidge + valley + undulation;
}

/** 实际铺到网格上的地表高度：加大起伏并整体抬离托盘顶面，谷地不露出底盘。 */
export function surfaceHeight(x: number, z: number): number {
  return terrainHeight(x, z) * 0.6 + 0.3;
}

/** 地表材质分层：低地偏纸、缓坡偏赭、高处压墨。返回混墨比例 [0,1]。 */
export function terrainInk(height: number): number {
  const t = Math.max(0, Math.min(1, (height + 0.35) / 1.4));
  return 0.06 + t * t * 0.62;
}

/** 射线法：判断世界坐标是否落在多边形控区内（边界按区外处理）。 */
export function pointInPolygon(x: number, z: number, points: readonly BoardPoint[]): boolean {
  let inside = false;
  for (
    let index = 0, previous = points.length - 1;
    index < points.length;
    previous = index, index += 1
  ) {
    const current = boardToWorld(points[index]);
    const prior = boardToWorld(points[previous]);
    const crosses =
      current.z > z !== prior.z > z &&
      x < ((prior.x - current.x) * (z - current.z)) / (prior.z - current.z) + current.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * 模型默认朝 +z；用 from→to 求朝向角，供士兵、坐骑、战车与船共用。
 * 没有行动线时按阵营朝对手（我方 +x，敌方 -x）。
 */
export function facingAngle(from: BoardPoint, to: BoardPoint): number {
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

export function sideFacingAngle(side: "a" | "b"): number {
  return side === "a" ? Math.PI / 2 : -Math.PI / 2;
}

/**
 * 军事沙盘的等高线：对地表高度场做一次均匀采样，供 marching squares 复用。
 * 采样在世界坐标上进行（与可见网格同源），保证等高线贴合渲染出来的沙面。
 */
export interface ContourGrid {
  heights: Float32Array;
  nx: number;
  nz: number;
  x0: number;
  z0: number;
  dx: number;
  dz: number;
}

export function sampleContourGrid(nx = 100, nz = 66): ContourGrid {
  const x0 = -BOARD_WIDTH / 2;
  const z0 = -BOARD_DEPTH / 2;
  const dx = BOARD_WIDTH / (nx - 1);
  const dz = BOARD_DEPTH / (nz - 1);
  const heights = new Float32Array(nx * nz);
  for (let iz = 0; iz < nz; iz += 1) {
    const z = z0 + iz * dz;
    for (let ix = 0; ix < nx; ix += 1) {
      heights[iz * nx + ix] = surfaceHeight(x0 + ix * dx, z);
    }
  }
  return { dx, dz, heights, nx, nz, x0, z0 };
}

/**
 * marching squares：返回指定高度的等值线段平面数组 [x1,z1,x2,z2, …]（世界坐标）。
 * 只输出线段不拼连续折线，供 THREE.LineSegments 直接消费；确定性，无随机数。
 */
export function contourSegmentsAt(grid: ContourGrid, level: number): number[] {
  const segments: number[] = [];
  const { dx, dz, heights, nx, nz } = grid;
  for (let iz = 0; iz < nz - 1; iz += 1) {
    for (let ix = 0; ix < nx - 1; ix += 1) {
      const ax = grid.x0 + ix * dx;
      const az = grid.z0 + iz * dz;
      const h00 = heights[iz * nx + ix];
      const h10 = heights[iz * nx + ix + 1];
      const h01 = heights[(iz + 1) * nx + ix];
      const h11 = heights[(iz + 1) * nx + ix + 1];
      // 角点编码：高于 level 记 1（左上 8、右上 4、左下 2、右下 1）。
      let code = 0;
      if (h00 > level) code |= 8;
      if (h10 > level) code |= 4;
      if (h01 > level) code |= 2;
      if (h11 > level) code |= 1;
      if (code === 0 || code === 15) continue;
      // 网格边上的插值点：只有跨越 level 的边才被取用，分母必非零。
      const topX = ax + ((level - h00) / (h10 - h00)) * dx;
      const bottomX = ax + ((level - h01) / (h11 - h01)) * dx;
      const leftZ = az + ((level - h00) / (h01 - h00)) * dz;
      const rightZ = az + ((level - h10) / (h11 - h10)) * dz;
      const emit = (x1: number, z1: number, x2: number, z2: number) => {
        segments.push(x1, z1, x2, z2);
      };
      switch (code) {
        case 1:
        case 14:
          emit(bottomX, az + dz, ax + dx, rightZ);
          break;
        case 2:
        case 13:
          emit(ax, leftZ, bottomX, az + dz);
          break;
        case 3:
        case 12:
          emit(ax, leftZ, ax + dx, rightZ);
          break;
        case 4:
        case 11:
          emit(topX, az, ax + dx, rightZ);
          break;
        case 5:
        case 10:
          // 右侧 / 左侧整体高于 level：等值线穿过上下两条边。
          emit(topX, az, bottomX, az + dz);
          break;
        case 6:
          // 右上 + 左下高于 level（对角鞍点）：绕 TR 与 BL 各一段。
          emit(topX, az, ax + dx, rightZ);
          emit(ax, leftZ, bottomX, az + dz);
          break;
        case 9:
          // 左上 + 右下高于 level（对角鞍点）：绕 TL 与 BR 各一段。
          emit(ax, leftZ, topX, az);
          emit(bottomX, az + dz, ax + dx, rightZ);
          break;
        case 7:
        case 8:
          emit(ax, leftZ, topX, az);
          break;
      }
    }
  }
  return segments;
}
