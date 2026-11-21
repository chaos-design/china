import { describe, expect, it } from "vitest";

import { getDynastyPath, IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { EXAM_MILESTONES, IMPERIAL_EXAM_LADDER, SIDE_ROUTES } from "./ladder";
import { ENTRANCE_KIND_LABELS, type EntranceKind } from "./types";

describe("imperial exam ladder data", () => {
  it("runs from 童生 to 翰林 with unique stations", () => {
    expect(IMPERIAL_EXAM_LADDER[0]?.station).toBe("童生");
    const stations = IMPERIAL_EXAM_LADDER.map((step) => step.station);
    expect(new Set(stations).size).toBe(stations.length);
    expect(IMPERIAL_EXAM_LADDER.length).toBeGreaterThanOrEqual(5);

    for (const step of IMPERIAL_EXAM_LADDER) {
      expect(step.detail.length).toBeGreaterThan(15);
      if (step.tag) {
        expect(step.tag.length).toBeGreaterThan(0);
      }
    }
  });

  it("gates every station after the first", () => {
    // 首站「童生」是起点，无需关卡；此后每一站都要过一道考试才能到达
    expect(IMPERIAL_EXAM_LADDER[0]?.gate).toBeUndefined();

    for (const step of IMPERIAL_EXAM_LADDER.slice(1)) {
      expect(step.gate).toBeDefined();
      expect(step.gate?.name.length).toBeGreaterThan(1);
      expect(step.gate?.detail.length).toBeGreaterThan(10);
    }
  });

  it("keeps odds claims marked as estimates", () => {
    for (const step of IMPERIAL_EXAM_LADDER) {
      if (step.gate?.odds) {
        expect(step.gate.odds).toContain("约");
      }
    }
  });

  it("describes the side routes with a note about the promotion ceiling", () => {
    expect(SIDE_ROUTES.routes.length).toBeGreaterThanOrEqual(3);
    expect(SIDE_ROUTES.note).toContain("天花板");
    for (const route of SIDE_ROUTES.routes) {
      expect(route.name.length).toBeGreaterThan(0);
      expect(route.detail.length).toBeGreaterThan(6);
    }
  });

  it("keeps milestones chronological by stated year", () => {
    expect(EXAM_MILESTONES.length).toBeGreaterThanOrEqual(5);
    for (const milestone of EXAM_MILESTONES) {
      expect(milestone.year.length).toBeGreaterThan(0);
      expect(milestone.event.length).toBeGreaterThan(2);
    }
    // 前134 必须排在首位，1905 收尾
    expect(EXAM_MILESTONES[0]?.year).toBe("前134");
    expect(EXAM_MILESTONES[EXAM_MILESTONES.length - 1]?.year).toBe("1905");
  });
});

describe("imperial exam dynasties data", () => {
  it("keeps ids lowercase-unique and spans 先秦 through 清", () => {
    const ids = IMPERIAL_EXAM_DYNASTIES.map((dynasty) => dynasty.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+$/);
    }
    expect(IMPERIAL_EXAM_DYNASTIES[0]?.id).toBe("preqin");
    expect(IMPERIAL_EXAM_DYNASTIES[IMPERIAL_EXAM_DYNASTIES.length - 1]?.id).toBe("qing");
    expect(IMPERIAL_EXAM_DYNASTIES.length).toBeGreaterThanOrEqual(7);
  });

  it("gives every dynasty entry routes across known kinds", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.name.length).toBeGreaterThan(0);
      expect(dynasty.headline.length).toBeGreaterThan(4);
      expect(dynasty.period).toMatch(/前\d+|\d{3,4}/);
      expect(dynasty.entry.routes.length).toBeGreaterThanOrEqual(3);

      for (const route of dynasty.entry.routes) {
        expect(Object.keys(ENTRANCE_KIND_LABELS)).toContain(route.kind);
        expect(ENTRANCE_KIND_LABELS[route.kind as EntranceKind].length).toBeGreaterThan(0);
        expect(route.name.length).toBeGreaterThan(1);
        expect(route.detail.length).toBeGreaterThan(8);
      }
    }
  });

  it("gives every dynasty promotion mechanisms and a multi-stage ladder", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.promotion.summary.length).toBeGreaterThan(15);
      expect(dynasty.promotion.mechanisms.length).toBeGreaterThanOrEqual(2);
      for (const mechanism of dynasty.promotion.mechanisms) {
        expect(mechanism.name.length).toBeGreaterThan(1);
        expect(mechanism.detail.length).toBeGreaterThan(8);
      }
      expect(dynasty.promotion.ladder.length).toBeGreaterThanOrEqual(4);
      for (const stage of dynasty.promotion.ladder) {
        expect(stage.length).toBeGreaterThan(0);
      }
    }
  });

  it("attaches a sourced career sample with at least four dated steps", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.career.subject.length).toBeGreaterThan(1);
      expect(dynasty.career.subjectIntro.length).toBeGreaterThan(8);
      // 出处必须落在正史本传
      expect(dynasty.career.source).toMatch(/《[^》]+·[^》]+》/);
      expect(dynasty.career.steps.length).toBeGreaterThanOrEqual(4);

      const stepKeys = dynasty.career.steps.map((step) => `${step.year}-${step.role}`);
      expect(new Set(stepKeys).size).toBe(stepKeys.length);

      for (const step of dynasty.career.steps) {
        expect(step.year.length).toBeGreaterThan(1);
        expect(step.role.length).toBeGreaterThan(1);
      }
    }
  });

  it("provides unique terms and named sources for every dynasty", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.terms.length).toBeGreaterThanOrEqual(2);
      const termNames = dynasty.terms.map((term) => term.name);
      expect(new Set(termNames).size).toBe(termNames.length);
      for (const term of dynasty.terms) {
        expect(term.explanation.length).toBeGreaterThan(8);
      }
      expect(dynasty.sources.length).toBeGreaterThanOrEqual(1);
      for (const source of dynasty.sources) {
        expect(source).toMatch(/《[^》]+》/);
      }
    }
  });

  it("resolves dynasties by id and returns undefined for unknown ids", () => {
    expect(getDynastyPath("han")?.name).toBe("汉");
    expect(getDynastyPath("qing")?.name).toBe("清");
    expect(getDynastyPath("qing-dynasty")).toBeUndefined();
    expect(getDynastyPath("")).toBeUndefined();
  });
});
