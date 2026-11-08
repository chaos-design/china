import { describe, expect, it } from "vitest";

import { INSTITUTION_TOPICS } from "./index";

describe("institution topics data", () => {
  it("keeps ids and slugs kebab-case and unique", () => {
    for (const topic of INSTITUTION_TOPICS) {
      expect(topic.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(topic.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    const ids = INSTITUTION_TOPICS.map((topic) => topic.id);
    const slugs = INSTITUTION_TOPICS.map((topic) => topic.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every topic an intro, a description and non-trivial scope labels", () => {
    for (const topic of INSTITUTION_TOPICS) {
      expect(topic.name.length).toBeGreaterThan(0);
      expect(topic.intro.length).toBeGreaterThan(30);
      expect(topic.description.length).toBeGreaterThan(10);
      expect(topic.scope.length).toBeGreaterThan(4);
    }
  });

  it("orders eras chronologically and keeps each era self-contained", () => {
    for (const topic of INSTITUTION_TOPICS) {
      expect(topic.eras.length).toBeGreaterThanOrEqual(5);
      const titles = topic.eras.map((era) => era.title);
      expect(new Set(titles).size).toBe(titles.length);

      for (const era of topic.eras) {
        expect(era.dynasty.length).toBeGreaterThan(0);
        expect(era.period).toMatch(/前\d+|约前\d+|\d{3,4}/);
        expect(era.summary.length).toBeGreaterThan(15);
        expect(era.points.length).toBeGreaterThanOrEqual(3);
        expect(era.points.length).toBeLessThanOrEqual(4);
        for (const point of era.points) {
          expect(point.length).toBeGreaterThan(12);
        }
        expect(era.legacy.length).toBeGreaterThan(10);
      }
    }
  });

  it("gives every topic a balanced set of key terms", () => {
    for (const topic of INSTITUTION_TOPICS) {
      expect(topic.keyTerms.length).toBeGreaterThanOrEqual(6);
      expect(topic.keyTerms.length).toBeLessThanOrEqual(10);
      const names = topic.keyTerms.map((term) => term.name);
      expect(new Set(names).size).toBe(names.length);

      for (const term of topic.keyTerms) {
        expect(term.era.length).toBeGreaterThan(0);
        expect(term.explanation.length).toBeGreaterThan(10);
      }
    }
  });

  it("first and last era dynasties differ so the evolution spans dynasties", () => {
    for (const topic of INSTITUTION_TOPICS) {
      const dynasties = topic.eras.map((era) => era.dynasty);
      expect(new Set(dynasties).size).toBeGreaterThan(1);
    }
  });
});
