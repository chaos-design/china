import type { OfficeBranch, OfficialGrade, OfficialPost } from "./officials-data";

/**
 * 立体场景的 HUD 排布（纯函数、不碰 DOM）：
 * 把每一级品级节点的投影坐标压成不重叠的右侧名录行，
 * 让「同一层级」在屏幕上也落在同一高度。
 */

export interface GradeProjection {
  /** 品级节点在画布中的投影 x。 */
  x: number;
  /** 品级节点在画布中的投影 y。 */
  y: number;
  id: string;
}

export interface HudRow extends GradeProjection {
  /** 名录卡片中心应落在的 y（已做间距压缩与边界收敛）。 */
  rowY: number;
}

export interface HudLayoutOptions {
  minGap: number;
  minY: number;
  maxY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function layoutHudRows(
  projections: readonly GradeProjection[],
  options: HudLayoutOptions,
): HudRow[] {
  if (projections.length === 0) {
    return [];
  }

  const sorted = [...projections].sort((first, second) => first.y - second.y);
  const span = Math.max(0, options.maxY - options.minY);
  const gap = Math.min(options.minGap, span / Math.max(1, sorted.length - 1));

  const rows = sorted.map((projection) => ({
    ...projection,
    rowY: clamp(projection.y, options.minY, options.maxY),
  }));

  // 先自上而下推开，再整体回移，最后夹回边界：保证顺序、最小间距与可见范围。
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const previous = rows[index - 1];
    if (!row || !previous) {
      continue;
    }
    row.rowY = Math.max(row.rowY, previous.rowY + gap);
  }

  const last = rows[rows.length - 1];
  const overflow = last ? last.rowY - options.maxY : 0;
  if (overflow > 0) {
    for (const row of rows) {
      row.rowY -= overflow;
    }
    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      const previous = rows[index - 1];
      if (!row || !previous) {
        continue;
      }
      row.rowY = Math.max(row.rowY, previous.rowY + gap);
    }
  }

  for (const row of rows) {
    row.rowY = clamp(row.rowY, options.minY, options.maxY);
  }

  return rows;
}

export type BranchFilter = "all" | OfficeBranch;

export function visiblePosts(grade: OfficialGrade, filter: BranchFilter): readonly OfficialPost[] {
  if (filter === "all") {
    return grade.posts;
  }
  return grade.posts.filter((post) => post.branch === filter);
}

export function postsByBranch(
  grade: OfficialGrade,
  filter: BranchFilter,
): { civil: readonly OfficialPost[]; military: readonly OfficialPost[] } {
  const posts = visiblePosts(grade, filter);
  return {
    civil: posts.filter((post) => post.branch === "civil"),
    military: posts.filter((post) => post.branch === "military"),
  };
}
