import { describe, expect, it } from "vitest";
import { RANK_DYNASTIES } from "../china-ranks/rank-data";
import type { OfficialsDynastyId } from "./officials-data";
import {
  branchCounts,
  countPosts,
  findPost,
  getOfficialsDynasty,
  MERGED_RANK_NOTES,
  OFFICIALS_DYNASTIES,
  UNMERGED_RANK_SOURCES,
} from "./officials-data";

const EXPECTED_ORDER: readonly OfficialsDynastyId[] = [
  "qin",
  "han",
  "weijin",
  "suitang",
  "song",
  "yuan",
  "ming",
  "qing",
];

// 立体场景只认品级；名录里若出现这类集合名词，说明粒度退回了「类别」。
const VAGUE_TITLES = ["九卿", "三公", "百官", "诸官", "各级", "各类", "等官", "众官", "诸卫"];

describe("品秩全景数据", () => {
  it("keeps the eight dynasties in chronological order", () => {
    expect(OFFICIALS_DYNASTIES.map((dynasty) => dynasty.id)).toEqual(EXPECTED_ORDER);
  });

  it("gives every dynasty metadata, grades and a substantial office roster", () => {
    for (const dynasty of OFFICIALS_DYNASTIES) {
      expect(dynasty.period.length).toBeGreaterThan(6);
      expect(dynasty.system.length).toBeGreaterThan(3);
      expect(dynasty.summary.length).toBeGreaterThan(20);
      expect(dynasty.source.length).toBeGreaterThan(6);
      expect(dynasty.grades.length).toBeGreaterThanOrEqual(6);
      expect(countPosts(dynasty)).toBeGreaterThanOrEqual(20);
    }
  });

  it("uses stable grade ids and unique, specific office titles", () => {
    for (const dynasty of OFFICIALS_DYNASTIES) {
      expect(new Set(dynasty.grades.map((grade) => grade.id)).size).toBe(dynasty.grades.length);

      const gradesWithBothBranches = dynasty.grades.filter((grade) => {
        const counts = branchCounts(grade);
        return counts.civil > 0 && counts.military > 0;
      });
      expect(gradesWithBothBranches.length).toBeGreaterThanOrEqual(3);

      for (const grade of dynasty.grades) {
        expect(grade.label.length).toBeGreaterThan(0);
        expect(grade.caption.length).toBeGreaterThan(8);
        expect(grade.order).toBeGreaterThanOrEqual(0);
        expect(grade.order).toBeLessThanOrEqual(10);
        expect(new Set(grade.posts.map((post) => post.title)).size).toBe(grade.posts.length);

        for (const post of grade.posts) {
          expect(post.title.length).toBeGreaterThanOrEqual(2);
          expect(["civil", "military"]).toContain(post.branch);
          expect(post.intro.length).toBeGreaterThan(8);
          for (const vague of VAGUE_TITLES) {
            expect(post.title).not.toContain(vague);
          }
        }
      }
    }
  });

  it("keeps 秦汉 rank-stone grades marked as approximate only", () => {
    for (const dynasty of OFFICIALS_DYNASTIES) {
      for (const grade of dynasty.grades) {
        if (["qin", "han"].includes(dynasty.id)) {
          expect(grade.approx).toMatch(/约当/);
        } else {
          expect(grade.approx).toBeUndefined();
        }
      }
    }
  });

  it("attaches dynasty-matched figures instead of generic examples", () => {
    const figureOwner = new Map<string, string>();
    for (const dynasty of OFFICIALS_DYNASTIES) {
      const figures = dynasty.grades.flatMap((grade) =>
        grade.posts.flatMap((post) => post.figures ?? []),
      );
      expect(figures.length).toBeGreaterThanOrEqual(8);

      for (const figure of figures) {
        expect(figure.name.length).toBeGreaterThanOrEqual(2);
        expect(figure.note.length).toBeGreaterThan(6);
        const previous = figureOwner.get(figure.name);
        if (previous) {
          expect(previous).toBe(dynasty.id);
        }
        figureOwner.set(figure.name, dynasty.id);
      }
    }
  });

  it("looks dynasties up by id and resolves posts by grade + title", () => {
    expect(getOfficialsDynasty("ming")?.name).toBe("明");
    expect(getOfficialsDynasty("xia")).toBeUndefined();

    const qin = getOfficialsDynasty("qin")!;
    const match = findPost(qin, qin.grades[0]!.id, "丞相");
    expect(match?.grade.label).toBe("万石");
    expect(match?.post.branch).toBe("civil");
    expect(match?.post.figures?.map((figure) => figure.name)).toEqual(["王绾", "李斯"]);
    expect(findPost(qin, qin.grades[0]!.id, "军机大臣")).toBeNull();
    expect(findPost(qin, "missing-grade", "丞相")).toBeNull();
  });

  it("resolves every merge key to a real post and applies its fields", () => {
    const postIndex = new Map<
      string,
      { title: string; rank?: string; salary?: string; note?: string; modern?: string }
    >();
    for (const dynasty of OFFICIALS_DYNASTIES) {
      for (const grade of dynasty.grades) {
        for (const post of grade.posts) {
          postIndex.set(`${dynasty.id}:${post.title}`, post);
        }
      }
    }

    expect(Object.keys(MERGED_RANK_NOTES).length).toBeGreaterThan(90);
    for (const [key, entry] of Object.entries(MERGED_RANK_NOTES)) {
      const post = postIndex.get(key);
      expect(post, `合并键无对应官职：${key}`).toBeTruthy();
      const { source: _source, ...fields } = entry;
      const applied = Object.entries(fields);
      expect(applied.length, `${key} 缺少任何合并字段`).toBeGreaterThan(0);
      for (const [field, value] of applied) {
        expect(
          post?.[field as "rank" | "salary" | "note" | "modern"],
          `${key}.${field} 未生效`,
        ).toBe(value);
      }
    }

    // 抽查典型合并结果
    const qin = getOfficialsDynasty("qin")!;
    const chancellor = findPost(qin, "qin-wanshi", "丞相")!.post;
    expect(chancellor.rank).toBe("金印紫绶 · 秩万石");
    expect(chancellor.modern).toBe("国务院总理（参考）");

    const han = getOfficialsDynasty("han")!;
    expect(findPost(han, "han-wanshi", "丞相")!.post.salary).toBe("月俸约三百五十斛");
  });

  it("merges every sourced rank-data office into the roster or an explicit allowlist", () => {
    const expectedSources = new Set<string>();
    for (const dynasty of RANK_DYNASTIES) {
      for (const level of dynasty.levels) {
        for (const office of level.offices) {
          if (office.salary || office.note || office.modern) {
            expectedSources.add(`${dynasty.id}:${office.title}`);
          }
        }
      }
    }
    const coveredSources = new Set(Object.values(MERGED_RANK_NOTES).map((entry) => entry.source));

    for (const source of coveredSources) {
      expect(expectedSources.has(source), `合并来源在 rank-data 中已不存在：${source}`).toBe(true);
    }
    for (const key of UNMERGED_RANK_SOURCES) {
      expect(expectedSources.has(key), `白名单来源已无口径可跳过：${key}`).toBe(true);
    }
    for (const source of expectedSources) {
      expect(
        coveredSources.has(source) || UNMERGED_RANK_SOURCES.includes(source),
        `rank-data 官职口径未合并也未入白名单：${source}`,
      ).toBe(true);
    }
  });
});
