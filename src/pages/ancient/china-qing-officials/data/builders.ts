import type {
  AtlasBadge,
  AtlasLadderGroup,
  AtlasOfficeBranch,
  AtlasOfficeNode,
  AtlasRankLevel,
} from "./types";

/** 节点构造器：品级与说明均可省略，避免每个朝代重复写对象字面量。 */
export function node(
  id: string,
  title: string,
  extra: { rank?: string; note?: string; children?: readonly AtlasOfficeNode[] } = {},
): AtlasOfficeNode {
  return { id, title, ...extra };
}

/** 机构分区构造器：mark 为角标，nodes 为该区下的衙署。 */
export function branch(
  id: string,
  mark: string,
  title: string,
  summary: string,
  nodes: readonly AtlasOfficeNode[],
): AtlasOfficeBranch {
  return { id, mark, summary, title, nodes };
}

/**
 * 品级构造器：用数组下标推导 order，省去逐行写 order。
 * 俸禄柱高默认随品序线性递减，可用 salary 覆盖。
 */
export function level(
  label: string,
  grade: AtlasRankLevel["grade"],
  offices: string,
  extra: Partial<Omit<AtlasRankLevel, "label" | "grade" | "offices">> = {},
): AtlasRankLevel {
  return { label, grade, offices, order: 0, salary: 100, ...extra };
}

/**
 * 把一组品级按顺序编号：order 缺省时取数组下标，
 * salary 缺省时按序号递减（各级俸禄都能显式覆盖）。
 */
export function sequence(levels: readonly AtlasRankLevel[]): readonly AtlasRankLevel[] {
  return levels.map((item, index) => ({
    ...item,
    order: item.order || index,
    salary: item.salary || Math.max(6, 100 - index * 6),
  }));
}

/** 文武补子：按九品顺序把动物列表配成 badge 数组。 */
export function badges(animals: readonly string[]): readonly AtlasBadge[] {
  return animals.map((animal, index) => ({ animal, order: index + 1 }));
}

/** 阶梯分组：把连续品序合并成图中标注的一段。 */
export function ladder(label: string, note: string, orders: readonly number[]): AtlasLadderGroup {
  return { label, note, orders };
}
