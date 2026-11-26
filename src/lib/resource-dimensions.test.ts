import { describe, expect, it } from "vitest";

import {
  ALL_RESOURCE_DIMENSIONS,
  matchesResourceDimension,
  RESOURCE_DIMENSION_FILTERS,
  RESOURCE_DIMENSIONS,
} from "./resource-dimensions";

describe("资源维度词表", () => {
  it("筛选项固定为全部加三个维度，顺序即界面顺序", () => {
    expect(RESOURCE_DIMENSION_FILTERS).toEqual([
      ALL_RESOURCE_DIMENSIONS,
      "军事",
      "历史",
      "非物质文化遗产",
    ]);
    expect(RESOURCE_DIMENSIONS).toHaveLength(3);
  });

  it("「全部」放行所有条目，包括未标注维度的旧条目", () => {
    expect(matchesResourceDimension(undefined, ALL_RESOURCE_DIMENSIONS)).toBe(true);
    expect(matchesResourceDimension(["军事"], ALL_RESOURCE_DIMENSIONS)).toBe(true);
  });

  it("具体维度只命中显式标注的条目", () => {
    expect(matchesResourceDimension(["军事", "历史"], "军事")).toBe(true);
    expect(matchesResourceDimension(["军事", "历史"], "非物质文化遗产")).toBe(false);
    expect(matchesResourceDimension(undefined, "历史")).toBe(false);
  });
});
