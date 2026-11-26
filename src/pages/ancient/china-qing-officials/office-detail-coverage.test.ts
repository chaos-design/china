import { describe, expect, it } from "vitest";

import { DYNASTY_ATLASES } from "./data";
import { getOfficeDuty } from "./office-duties";
import { layoutOfficeTree } from "./office-tree-layout";

describe("每个最小职位都有可解释的职能", () => {
  it.each(
    DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas] as const),
  )("%s 的全部节点均有职权范围与职能", (_id, atlas) => {
    const layout = layoutOfficeTree(atlas);
    for (const node of layout.nodes) {
      const duty = getOfficeDuty(node);
      expect(duty.scope.length).toBeGreaterThan(4);
      expect(duty.function.length).toBeGreaterThan(8);
    }
  });

  it("every office title is a single smallest post, never a merged label", () => {
    for (const atlas of DYNASTY_ATLASES) {
      for (const node of layoutOfficeTree(atlas).nodes) {
        // 荣衔组 / 分区是集合标题，下属已是独立节点；只约束实际职位。
        if (node.kind === "office") {
          expect(node.title).not.toMatch(/[、/·（）]/);
        }
      }
    }
  });

  it("carries semantic annotations into split nodes", () => {
    const annotated = DYNASTY_ATLASES.flatMap((atlas) => layoutOfficeTree(atlas).nodes).filter(
      (node) => node.annotation && node.annotation.length > 0,
    );
    expect(annotated.length).toBeGreaterThan(20);
  });
});
