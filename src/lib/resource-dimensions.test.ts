import { describe, expect, it } from "vitest";

import {
  ALL_RESOURCE_DIMENSIONS,
  matchesResourceDimension,
  matchesResourceDimensionId,
  RESOURCE_DIMENSION_FILTERS,
  RESOURCE_DIMENSION_LABELS,
  RESOURCE_DIMENSIONS,
} from "./resource-dimensions";

describe("资源维度词表", () => {
  it("维度就是现有菜单四分组，标签与分组名同源同序", () => {
    expect(RESOURCE_DIMENSIONS).toEqual(["chronology", "atlas", "culture", "region"]);
    expect(RESOURCE_DIMENSION_LABELS).toEqual({
      atlas: "历史地理",
      chronology: "编年与制度",
      culture: "文化与交通",
      region: "地域与近代",
    });
    expect(RESOURCE_DIMENSION_FILTERS).toEqual([
      { id: ALL_RESOURCE_DIMENSIONS, label: "全览" },
      { id: "chronology", label: "编年与制度" },
      { id: "atlas", label: "历史地理" },
      { id: "culture", label: "文化与交通" },
      { id: "region", label: "地域与近代" },
    ]);
  });

  it("「全览」放行所有条目，包括未标注维度的旧条目", () => {
    expect(matchesResourceDimension(undefined, ALL_RESOURCE_DIMENSIONS)).toBe(true);
    expect(matchesResourceDimension(["region"], ALL_RESOURCE_DIMENSIONS)).toBe(true);
    expect(matchesResourceDimensionId("culture", ALL_RESOURCE_DIMENSIONS)).toBe(true);
  });

  it("具体维度只命中标注该分组的条目", () => {
    expect(matchesResourceDimension(["region"], "region")).toBe(true);
    expect(matchesResourceDimension(["region"], "atlas")).toBe(false);
    expect(matchesResourceDimension(undefined, "chronology")).toBe(false);
    expect(matchesResourceDimensionId("region", "atlas")).toBe(false);
  });
});
