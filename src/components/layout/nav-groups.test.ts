import { describe, expect, it } from "vitest";

import { RESOURCE_DIMENSION_LABELS, RESOURCE_DIMENSIONS } from "../../lib/resource-dimensions";
import { HOME_ENTRY_ROUTES } from "../../pages/page-resources";
import { findNavGroupId, NAV_GROUPS, type NavGroup } from "./nav-groups";

/** 与 routes.tsx 的嵌套路由匹配口径一致：本体或任意子路由都算命中。 */
function matches(path: string, pathname: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

describe("NAV_GROUPS 菜单数据治理", () => {
  it("分组 id 与名称唯一，导语、地图分区、条目都不为空", () => {
    const ids = NAV_GROUPS.map((group) => group.id);
    const labels = NAV_GROUPS.map((group) => group.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);

    for (const group of NAV_GROUPS) {
      expect(group.blurb.length).toBeGreaterThan(0);
      expect(group.items.length).toBeGreaterThan(0);
      expect(["north", "culture", "islands"]).toContain(group.mapZone);
      for (const item of group.items) {
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.to.startsWith("/")).toBe(true);
        expect(item.highlights.length).toBeGreaterThan(0);
        expect(new Set(item.highlights).size).toBe(item.highlights.length);
      }
    }
  });

  it("入口路径不重复，且每个入口都能反查回自己的分组", () => {
    const paths = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to));
    expect(new Set(paths).size).toBe(paths.length);

    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        expect(findNavGroupId(item.to, matches)).toBe(group.id);
      }
    }
  });

  it("activePaths 只用于同组子路由的分组高亮，不重复菜单入口", () => {
    const entryPaths = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to));

    for (const group of NAV_GROUPS) {
      for (const path of group.activePaths ?? []) {
        expect(entryPaths).not.toContain(path);
        expect(path.startsWith("/china/")).toBe(true);
        expect(findNavGroupId(path, matches)).toBe(group.id);
      }
    }
  });

  it("未知路由不归属任何分组，首页与 404 落回默认高亮由站点菜单决定", () => {
    expect(findNavGroupId("/not-a-route", matches)).toBeUndefined();
    expect(findNavGroupId("/", matches)).toBeUndefined();
  });

  it("菜单分组保持四列编辑顺序，避免后续新增时悄悄挤掉旧列", () => {
    const labels = NAV_GROUPS.map((group: NavGroup) => group.label);
    expect(labels).toEqual(["编年与制度", "历史地理", "文化与交通", "地域与近代"]);
  });

  it("分组 id / 标签与维度 id / 维度名一一对应", () => {
    expect(NAV_GROUPS.map((group) => group.id)).toEqual([...RESOURCE_DIMENSIONS]);
    for (const group of NAV_GROUPS) {
      expect(RESOURCE_DIMENSION_LABELS[group.id]).toBe(group.label);
    }
  });

  it("每个首页入口的维度就是它对应菜单项所属的分组", () => {
    for (const entry of HOME_ENTRY_ROUTES) {
      if (!entry.path) continue;
      const group = NAV_GROUPS.find((candidate) =>
        candidate.items.some((item) => item.to === entry.path),
      );
      expect(group).toBeDefined();
      expect(entry.dimensions).toEqual([group?.id]);
    }
  });
});
