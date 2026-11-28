/**
 * 3D 名牌的确定性避让：营垒、部队与行动牌在同一张沙盘上可能叠在一起
 * （驻军贴着本营、两支部队并肩），这里按优先级把低优先级牌沿碰撞向量推开。
 * 纯函数、无随机数：排序只看 rank 与坐标，同一份数据每次得到同一布局，
 * 换幕重建后名牌不跳位。
 */

/** 单枚名牌的布局输入：世界平面坐标、半宽与优先级（数字越小越固定不动）。 */
export interface LabelCandidate {
  halfWidth: number;
  rank: number;
  x: number;
  z: number;
}

/** 避让安全距 = 双方半宽 + 余量；位移封顶让名牌始终贴着自己的部队。 */
const LABEL_MARGIN = 0.34;
const LABEL_MAX_SHIFT = 2.4;

export function resolveLabelOffsets<T extends LabelCandidate>(
  labels: readonly T[],
): Map<T, { dx: number; dz: number }> {
  const result = new Map<T, { dx: number; dz: number }>();
  const placed: Array<{ halfWidth: number; x: number; z: number }> = [];
  const order = labels
    .map((label, index) => ({ index, label }))
    .sort(
      (a, b) =>
        a.label.rank - b.label.rank ||
        a.label.x - b.label.x ||
        a.label.z - b.label.z ||
        a.index - b.index,
    );
  for (const { label } of order) {
    let dx = 0;
    let dz = 0;
    for (const anchor of placed) {
      const gapX = label.x + dx - anchor.x;
      const gapZ = label.z + dz - anchor.z;
      const dist = Math.hypot(gapX, gapZ);
      const minDist = label.halfWidth + anchor.halfWidth + LABEL_MARGIN;
      if (dist >= minDist) continue;
      // 完全重合时朝 -z（默认镜头的屏幕上方）推开，让部队牌浮在营垒牌上方。
      const nx = dist === 0 ? 0 : gapX / dist;
      const nz = dist === 0 ? -1 : gapZ / dist;
      const push = minDist - dist;
      dx += nx * push;
      dz += nz * push;
    }
    const shift = Math.hypot(dx, dz);
    if (shift > LABEL_MAX_SHIFT) {
      dx *= LABEL_MAX_SHIFT / shift;
      dz *= LABEL_MAX_SHIFT / shift;
    }
    result.set(label, { dx, dz });
    placed.push({ halfWidth: label.halfWidth, x: label.x + dx, z: label.z + dz });
  }
  return result;
}
