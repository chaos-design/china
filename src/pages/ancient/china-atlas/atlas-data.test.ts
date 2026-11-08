import { describe, expect, it } from "vitest";

import { ATLAS_DYNASTIES } from "./dynasties";
import { ATLAS_TOPICS, getAtlasTopic, getOtherAtlasTopics } from "./topics";
import type { AtlasTopicId } from "./types";

const ALL_TOPIC_IDS: readonly AtlasTopicId[] = ["territory", "migration", "frontier"];

describe("atlas topics registry", () => {
  it("covers exactly the three planned topics", () => {
    expect(ATLAS_TOPICS.map((topic) => topic.id)).toEqual(ALL_TOPIC_IDS);
  });

  it("keeps paths on the /china/atlas/<id> convention", () => {
    for (const topic of ATLAS_TOPICS) {
      expect(topic.path).toBe(`/china/atlas/${topic.id}`);
    }
  });

  it("gives every topic a label, tagline and non-empty planned features", () => {
    for (const topic of ATLAS_TOPICS) {
      expect(topic.label.length).toBeGreaterThan(0);
      expect(topic.tagline.length).toBeGreaterThan(0);
      expect(topic.description.length).toBeGreaterThan(0);
      expect(topic.plannedFeatures.length).toBeGreaterThan(0);
      for (const feature of topic.plannedFeatures) {
        expect(feature.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns the topic for a known id and throws for an unknown one", () => {
    expect(getAtlasTopic("territory").id).toBe("territory");
    expect(() => getAtlasTopic("dynasty" as AtlasTopicId)).toThrow(/未知的图谱主题/);
  });

  it("lists the other topics for cross links, in registry order", () => {
    expect(getOtherAtlasTopics("territory").map((topic) => topic.id)).toEqual([
      "migration",
      "frontier",
    ]);
    expect(getOtherAtlasTopics("frontier").map((topic) => topic.id)).toEqual([
      "territory",
      "migration",
    ]);
  });
});

describe("atlas dynasties skeleton", () => {
  it("starts with the four planned dynasties in chronological order", () => {
    expect(ATLAS_DYNASTIES.map((dynasty) => dynasty.id)).toEqual(["han", "tang", "song", "yuan"]);
    expect(ATLAS_DYNASTIES.map((dynasty) => dynasty.label)).toEqual(["汉", "唐", "宋", "元"]);
  });

  it("plans content for every topic on every dynasty", () => {
    for (const dynasty of ATLAS_DYNASTIES) {
      for (const topicId of ALL_TOPIC_IDS) {
        expect(dynasty.planned[topicId], `${dynasty.id}/${topicId}`).toBeTruthy();
      }
    }
  });

  it("keeps period strings non-empty", () => {
    for (const dynasty of ATLAS_DYNASTIES) {
      expect(dynasty.period).toMatch(/\d/);
    }
  });
});
