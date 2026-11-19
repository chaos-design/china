import { describe, expect, it } from "vitest";
import { getOfficeDuty } from "./office-duties";
import type { OfficeTreeNode } from "./office-tree-layout";

function makeNode(overrides: Partial<OfficeTreeNode> = {}): OfficeTreeNode {
  return {
    children: [],
    depth: 2,
    id: "test-node",
    kind: "office",
    parent: "root",
    title: "未知官职",
    x: 0,
    y: 0,
    z: 0,
    ...overrides,
  };
}

describe("getOfficeDuty — 每个原子的职权说明", () => {
  it("returns the curated scope and function for a known office", () => {
    const duty = getOfficeDuty(makeNode({ title: "军机处", kind: "branch" }));
    expect(duty.scope).toContain("军国要务");
    expect(duty.function).toContain("最高决策");
  });

  it("exposes both a scope and a function for the emperor", () => {
    const duty = getOfficeDuty(makeNode({ title: "皇帝", kind: "root", depth: 0 }));
    expect(duty.scope.length).toBeGreaterThan(0);
    expect(duty.function.length).toBeGreaterThan(0);
  });

  it("matches a title with a slash suffix by its base name", () => {
    const duty = getOfficeDuty(makeNode({ title: "锦衣卫 / 东厂" }));
    expect(duty.scope).toContain("侦查");
  });

  it("falls back to the node's own note when the title is not in the lexicon", () => {
    const duty = getOfficeDuty(makeNode({ title: "某冷门属官", note: "掌 specialty 事务" }));
    expect(duty.function).toBe("掌 specialty 事务");
    expect(duty.scope).toContain("职权见");
  });

  it.each([
    "root",
    "honorary",
    "branch",
    "office",
  ] as const)("gives a generic duty for an unknown %s node without a note", (kind) => {
    const duty = getOfficeDuty(makeNode({ kind, title: "无名节点" }));
    expect(duty.scope.length).toBeGreaterThan(0);
    expect(duty.function.length).toBeGreaterThan(0);
  });
});
