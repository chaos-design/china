export type BoardPoint = readonly [number, number];

/** Closed polygon for a schematic control region. Pure so the layout can be tested without a DOM. */
export function polygonPath(points: readonly BoardPoint[]): string {
  if (points.length === 0) return "";
  const commands = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`);
  return `${commands.join(" ")} Z`;
}

/** A gently bowed route between two map positions; the bow is a fixed share of the segment length. */
export function routePath(from: BoardPoint, to: BoardPoint, bend = 0.16): string {
  const middleX = (from[0] + to[0]) / 2;
  const middleY = (from[1] + to[1]) / 2;
  const deltaX = to[0] - from[0];
  const deltaY = to[1] - from[1];
  const controlX = middleX - deltaY * bend;
  const controlY = middleY + deltaX * bend;
  return `M${from[0]} ${from[1]} Q${controlX.toFixed(1)} ${controlY.toFixed(1)} ${to[0]} ${to[1]}`;
}

/** Arithmetic centre of a region, used to place its label inside the drawn polygon. */
export function centroid(points: readonly BoardPoint[]): BoardPoint {
  if (points.length === 0) return [0, 0];
  const sums = points.reduce((total, [x, y]) => [total[0] + x, total[1] + y], [0, 0] as [
    number,
    number,
  ]);
  return [sums[0] / points.length, sums[1] / points.length];
}

/** Midpoint quadratics through a chain of lon/lat-style points; used for schematic rivers. */
export function smoothPath(points: readonly BoardPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]} ${points[0][1]}`;
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index];
    const [nextX, nextY] = points[index + 1];
    path += ` Q${x} ${y} ${(x + nextX) / 2} ${(y + nextY) / 2}`;
  }
  const last = points[points.length - 1];
  return `${path} L${last[0]} ${last[1]}`;
}
