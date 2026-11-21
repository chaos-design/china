import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { DYNASTY_ATLASES } from "./data/registry";
import {
  BADGE_IMAGES,
  badgeImage,
  HAT_IMAGES,
  hatImage,
  ROBE_IMAGES,
  robeImage,
} from "./rank-images";

/** 真实图档的静态完整性：每个 src 必须指向真实存在的 public 文件（同 resource.test.ts 的死链守卫）。 */
describe("rank-images table integrity", () => {
  const allImages = [
    ...Object.values(BADGE_IMAGES),
    ...Object.values(HAT_IMAGES),
    ...Object.values(ROBE_IMAGES),
  ];

  it("每张图的 src 都指向真实存在的 public/qing-officials 文件", () => {
    expect(allImages.length).toBeGreaterThan(30);
    const publicRoot = join(process.cwd(), "public");
    for (const image of allImages) {
      expect(image.src.startsWith("/qing-officials/")).toBe(true);
      expect(() => readFileSync(join(publicRoot, image.src.slice(1)))).not.toThrow();
    }
  });

  it("每张图都带藏品短注与 Commons 文件页链接（credit + sourceUrl 约定）", () => {
    for (const image of allImages) {
      expect(image.caption.length).toBeGreaterThan(4);
      expect(image.source.startsWith("https://commons.wikimedia.org/wiki/File:")).toBe(true);
    }
  });

  it("明清同物异名（狮/狮子、熊/熊罴）解析到同一张实物照", () => {
    expect(badgeImage("狮子")?.src).toBe(badgeImage("狮")?.src);
    expect(badgeImage("熊罴")?.src).toBe(badgeImage("熊")?.src);
    expect(badgeImage("不存在的动物")).toBeUndefined();
    expect(hatImage(undefined)).toBeUndefined();
    expect(robeImage("qing", undefined)).toBeUndefined();
    expect(robeImage("qing", "不存在的服色")).toBeUndefined();
  });
});

/**
 * 覆盖口径：明清补子除 鹌鹑 / 练雀 / 犀牛 外全部落实物照；顶戴只在明清宝石顶与
 * 秦汉印绶上落图（周/魏晋/宋元/辽金/北魏的冠制统一走手绘暖帽兜底）；朝服以清七组
 * 全图，另落 明绯袍 / 宋元绯袍 / 秦汉黑袍三幅。改名或删表都会在这里炸。
 */
describe("rank-images coverage against dynasty data", () => {
  /** 明清补子尚未找到实物照的三种动物（手绘方补兜底）。 */
  const BADGE_GAPS = new Set(["鹌鹑", "练雀", "犀牛"]);

  it("明清补子动物要么有实物照、要么是登记过的缺口", () => {
    for (const atlas of DYNASTY_ATLASES) {
      if (!atlas.badgesAvailable) continue;
      for (const badge of [...atlas.civilBadges, ...atlas.militaryBadges]) {
        const resolved = badgeImage(badge.animal);
        if (BADGE_GAPS.has(badge.animal)) {
          expect(resolved, `${atlas.id} · ${badge.animal} 应保持兜底`).toBeUndefined();
        } else {
          expect(resolved, `${atlas.id} · ${badge.animal}`).toBeDefined();
        }
      }
    }
  });

  it("明清顶戴材质与秦汉印绶全部落图，早期冠制走手绘兜底", () => {
    const hatCovered = new Set(["ming", "qing", "qin", "han"]);
    for (const atlas of DYNASTY_ATLASES) {
      for (const item of atlas.levels) {
        const resolved = hatImage(item.hat);
        if (hatCovered.has(atlas.id)) {
          if (item.hat === "青绶") {
            expect(resolved, `${atlas.id} · 青绶 应保持兜底`).toBeUndefined();
          } else {
            expect(resolved, `${atlas.id} · ${item.hat ?? "未详"}`).toBeDefined();
          }
        } else {
          expect(resolved, `${atlas.id} · ${item.hat ?? "未详"} 应保持兜底`).toBeUndefined();
        }
      }
    }
  });

  it("清七组朝服 + 明 / 宋绯袍 + 秦黑袍落图，其余朝色样兜底", () => {
    const expected: Readonly<Record<string, readonly string[]>> = {
      qing: ["石青色绣金", "石青色绣银", "青色", "蓝色", "月白", "花青", "灰蓝"],
      ming: ["绯袍"],
      song: ["绯袍"],
      qin: ["黑色（尚水德）"],
    };
    for (const atlas of DYNASTY_ATLASES) {
      const withImage = new Set(expected[atlas.id] ?? []);
      for (const item of atlas.levels) {
        const resolved = robeImage(atlas.id, item.robe);
        if (item.robe && withImage.has(item.robe)) {
          expect(resolved, `${atlas.id} · ${item.robe}`).toBeDefined();
        } else {
          expect(resolved, `${atlas.id} · ${item.robe ?? "未详"} 应保持色样兜底`).toBeUndefined();
        }
      }
    }
  });
});
