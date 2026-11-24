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
});
