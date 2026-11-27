import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
    expect(labels).toEqual(["编年与制度", "疆域与民族", "文化与交通", "区域与近代"]);
  });

  it("每个菜单条目都有已知维度，三个维度都有落点", () => {
    const covered = new Set<string>();
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        expect(item.dimensions?.length).toBeGreaterThan(0);
        for (const dimension of item.dimensions ?? []) {
          expect(["军事", "历史", "非物质文化遗产"]).toContain(dimension);
          covered.add(dimension);
        }
      }
    }
    expect([...covered].sort()).toEqual(["军事", "历史", "非物质文化遗产"].sort());
  });

  it("每个菜单入口都有轮播截图，且内容分类标签与首页入口一致", () => {
    const entries = new Map(
      HOME_ENTRY_ROUTES.filter(
        (entry): entry is typeof entry & { path: string } => typeof entry.path === "string",
      ).map((entry) => [entry.path, entry]),
    );

    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        const entry = entries.get(item.to);
        expect(entry, `${group.id}/${item.to} 没有对应的首页入口`).toBeDefined();
        expect(entry?.screenshot, `${item.to} 没有轮播截图`).toMatch(/^[a-z-]+\.jpg$/);
        if (entry?.screenshot) {
          expect(
            existsSync(resolve("public/home-screenshots", entry.screenshot)),
            `${entry.screenshot} 文件不存在`,
          ).toBe(true);
        }
        expect(
          [...(item.dimensions ?? [])].sort(),
          `${item.to} 的菜单标签与首页入口不一致`,
        ).toEqual([...(entry?.dimensions ?? [])].sort());
      }
    }
  });
});
