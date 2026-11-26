import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { DYNASTY_ATLASES } from "./data/registry";
import {
  BADGE_IMAGES,
  badgeImage,
  HAT_IMAGES,
  hatImage,
  MING_BADGE_IMAGES,
  ROBE_IMAGES,
  robeImage,
} from "./rank-images";

/** 真实图档的静态完整性：每个 src 必须指向真实存在的 public 文件（同 resource.test.ts 的死链守卫）。 */
describe("rank-images table integrity", () => {
  const allImages = [
    ...Object.values(BADGE_IMAGES),
    ...Object.values(MING_BADGE_IMAGES),
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

  it("同物异名（狮/狮子、熊/熊罴）在清表内解析到同一张实物照，明表按明制书写", () => {
    expect(badgeImage("狮子", "qing")?.src).toBe(badgeImage("狮", "qing")?.src);
    expect(badgeImage("熊罴", "qing")?.src).toBe(badgeImage("熊", "qing")?.src);
    expect(badgeImage("不存在的动物")).toBeUndefined();
    expect(hatImage(undefined)).toBeUndefined();
    expect(robeImage("qing", undefined)).toBeUndefined();
    expect(robeImage("qing", "不存在的服色")).toBeUndefined();
  });

  it("明代同名动物不挪用清代实物：明表与清表各归各朝", () => {
    expect(MING_BADGE_IMAGES.狮子).toBeDefined();
    expect(badgeImage("狮子", "ming")?.src).toBe("/qing-officials/badge-ming-shizi.jpg");
    expect(badgeImage("狮", "ming")).toBeUndefined();
    expect(badgeImage("仙鹤", "ming")).toBeUndefined();
    // 未传朝代的旧调用保持清表语义（清页与无朝代上下文都用清制实物）。
    expect(badgeImage("狮子")?.src).toBe(badgeImage("狮")?.src);
  });
});

/**
 * 覆盖口径（2026-11）：清代补子除 鹌鹑 / 练雀 / 犀牛 外全部落实物照；明代
 * 只落本朝实物（孔雀 / 鹭鸶 / 鸂鶒 / 狮子 / 虎），其余回落手绘方补——
 * 明页不挪用清代实物。顶戴只在明清宝石顶与秦汉印绶上落图（周/魏晋/宋元/
 * 辽/金/西夏/北魏的冠制统一走手绘暖帽兜底）；朝服以清七组全图，另落 明绯袍 /
 * 宋绯袍 / 秦黑袍一幅。改名或删表都会在这里炸。
 */
describe("rank-images coverage against dynasty data", () => {
  /** 各朝补子尚未找到本朝实物照的动物（手绘方补兜底）。 */
  const BADGE_GAPS: Readonly<Record<string, ReadonlySet<string>>> = {
    ming: new Set([
      "仙鹤",
      "锦鸡",
      "云雁",
      "白鹇",
      "黄鹂",
      "鹌鹑",
      "豹",
      "熊罴",
      "彪",
      "犀牛",
      "海马",
    ]),
    qing: new Set(["鹌鹑", "练雀", "犀牛"]),
  };

  it("明清补子动物要么有本朝实物照、要么是登记过的缺口", () => {
    for (const atlas of DYNASTY_ATLASES) {
      if (!atlas.badgesAvailable) continue;
      const gaps = BADGE_GAPS[atlas.id] ?? new Set<string>();
      for (const badge of [...atlas.civilBadges, ...atlas.militaryBadges]) {
        const resolved = badgeImage(badge.animal, atlas.id);
        if (gaps.has(badge.animal)) {
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
