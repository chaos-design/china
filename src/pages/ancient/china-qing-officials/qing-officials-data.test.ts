import { describe, expect, it } from "vitest";

import {
  QING_CIVIL_BADGES,
  QING_HONORARY_RANKS,
  QING_LADDER_GROUPS,
  QING_MILITARY_BADGES,
  QING_OFFICE_BRANCHES,
  QING_RANK_LEVELS,
  type QingOfficeNode,
} from "./qing-officials-data";

function collectIds(nodes: readonly QingOfficeNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...(node.children ? collectIds(node.children) : [])]);
}

describe("清代官制图谱数据", () => {
  it("covers all six office branches with stable unique node ids", () => {
    expect(QING_OFFICE_BRANCHES.map((branch) => branch.id)).toEqual([
      "central",
      "assistant",
      "household",
      "province",
      "frontier",
      "local",
    ]);

    const ids = QING_OFFICE_BRANCHES.flatMap((branch) => collectIds(branch.nodes));
    const honoraryIds = collectIds(QING_HONORARY_RANKS);
    expect(new Set([...ids, ...honoraryIds]).size).toBe(ids.length + honoraryIds.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it("keeps the six boards together under 佐理部", () => {
    const assistant = QING_OFFICE_BRANCHES.find((branch) => branch.id === "assistant");
    const sixBoards = assistant?.nodes.find((node) => node.id === "six-boards");
    expect(sixBoards?.children?.map((node) => node.title)).toEqual([
      "吏部",
      "户部",
      "礼部",
      "兵部",
      "刑部",
      "工部",
    ]);
  });

  it("has nine grades each with 正 and 从, descending salaries", () => {
    expect(QING_RANK_LEVELS).toHaveLength(18);
    const gradeNames = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    for (let order = 1; order <= 9; order += 1) {
      const pair = QING_RANK_LEVELS.filter((level) => level.order === order);
      expect(pair.map((level) => level.grade)).toEqual(["正", "从"]);
      expect(pair.map((level) => level.label)).toEqual([
        `正${gradeNames[order - 1]}品`,
        `从${gradeNames[order - 1]}品`,
      ]);
    }
    for (let index = 1; index < QING_RANK_LEVELS.length; index += 1) {
      expect(QING_RANK_LEVELS[index]?.salary).toBeLessThanOrEqual(
        QING_RANK_LEVELS[index - 1]!.salary,
      );
    }
    expect(QING_RANK_LEVELS.every((level) => level.hat && level.robe && level.offices)).toBe(true);
  });

  it("pairs nine civil and nine military badge animals to grades 1—9", () => {
    expect(QING_CIVIL_BADGES.map((badge) => badge.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(QING_MILITARY_BADGES.map((badge) => badge.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(QING_CIVIL_BADGES.every((badge) => badge.animal.length > 0)).toBe(true);
    expect(QING_MILITARY_BADGES.every((badge) => badge.animal.length > 0)).toBe(true);
  });

  it("keeps ladder groups in rank order and covering grades 1—9", () => {
    const flattened = QING_LADDER_GROUPS.flatMap((group) => group.orders);
    expect(flattened).toEqual([1, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
