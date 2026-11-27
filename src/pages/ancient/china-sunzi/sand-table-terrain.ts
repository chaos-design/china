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

/** 实际铺到网格上的地表高度：把噪声幅度压到控区覆膜之下，避免地形穿片。 */
export function surfaceHeight(x: number, z: number): number {
  // 放大起伏并整体抬离托盘顶面：谷地不露出底盘，山脊又足够立体。
  return terrainHeight(x, z) * 0.48 + 0.34;
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
