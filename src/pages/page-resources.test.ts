import { describe, expect, it } from "vitest";

import { HOME_ENTRY_ROUTES } from "./page-resources";

describe("page resources", () => {
  it("keeps enterable home entries before preview entries", () => {
    const firstPreviewIndex = HOME_ENTRY_ROUTES.findIndex((entry) => entry.status === "preview");
    const lastEnterableIndex = HOME_ENTRY_ROUTES.reduce(
      (lastIndex, entry, index) => (entry.path ? index : lastIndex),
      -1,
    );

    expect(lastEnterableIndex).toBeGreaterThan(-1);
    // 守的是排序不变量，不是「必须存在 preview 条目」：全部专题转正后 preview 区
    // 会整体消失；未来的筹备中条目重新出现时，仍须排在所有可进入条目之后且不带路径。
    if (firstPreviewIndex !== -1) {
      expect(lastEnterableIndex).toBeLessThan(firstPreviewIndex);
      expect(HOME_ENTRY_ROUTES.slice(firstPreviewIndex).every((entry) => !entry.path)).toBe(true);
    }
  });

  it("uses the integrated silk road html resource instead of a preview entry", () => {
    expect(HOME_ENTRY_ROUTES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/silk-road",
          status: "available",
          title: "丝绸之路与海疆发展史",
        }),
      ]),
    );
    expect(HOME_ENTRY_ROUTES).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "preview",
          title: "丝路与海疆线索",
        }),
      ]),
    );
  });
});
