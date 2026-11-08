import { describe, expect, it } from "vitest";
import {
  ATLAS_ITEMS,
  ATLAS_LABELS,
  ATLAS_VIEW,
  estimateLabelWidth,
  getVisibleItems,
  placeLabels,
} from "./atlas-items";
import { FRONTIER_POLICIES } from "./frontier-policies";
import { MIGRATION_EVENTS } from "./migration-events";
import { projectMigration } from "./migration-projection";
import { TERRITORY_SNAPSHOTS } from "./territory-snapshots";

describe("统一图谱数据", () => {
  it("把三份史料数据汇总成 22 条且 id 唯一", () => {
    expect(ATLAS_ITEMS).toHaveLength(
      TERRITORY_SNAPSHOTS.length + MIGRATION_EVENTS.length + FRONTIER_POLICIES.length,
    );
    expect(new Set(ATLAS_ITEMS.map((item) => item.id)).size).toBe(ATLAS_ITEMS.length);
    expect(ATLAS_ITEMS.filter((item) => item.topic === "territory")).toHaveLength(6);
    expect(ATLAS_ITEMS.filter((item) => item.topic === "migration")).toHaveLength(8);
    expect(ATLAS_ITEMS.filter((item) => item.topic === "frontier")).toHaveLength(8);
  });

  it("详情文案与出处逐条来自原始数据，不另造史实", () => {
    const territory = ATLAS_ITEMS.filter((item) => item.topic === "territory");
    const migration = ATLAS_ITEMS.filter((item) => item.topic === "migration");
    const frontier = ATLAS_ITEMS.filter((item) => item.topic === "frontier");

    TERRITORY_SNAPSHOTS.forEach((snapshot, index) => {
      expect(territory[index]?.description).toBe(snapshot.description);
      expect(territory[index]?.sources).toEqual(snapshot.sources);
      expect(territory[index]?.notes[0]).toBe(`都城 · ${snapshot.capital.name}`);
      expect(territory[index]?.year).toBe(snapshot.year);
    });
    MIGRATION_EVENTS.forEach((event, index) => {
      expect(migration[index]?.description).toBe(event.description);
      expect(migration[index]?.sources).toEqual(event.sources);
      expect(migration[index]?.route?.d).toMatch(/^M /);
      expect(migration[index]?.notes[0]).toContain("途经 · ");
    });
    FRONTIER_POLICIES.forEach((policy, index) => {
      expect(frontier[index]?.description).toBe(policy.description);
      expect(frontier[index]?.sources).toEqual(policy.sources);
      expect(frontier[index]?.notes[0]).toBe(`治所 · ${policy.seat.name}`);
      expect(frontier[index]?.notes).toContain(`防御范围 · ${policy.defenseScope}`);
    });
  });

  it("所有条目的说明、出处与点位齐备", () => {
    for (const item of ATLAS_ITEMS) {
      expect(item.description.length).toBeGreaterThan(10);
      expect(item.sources.length).toBeGreaterThan(0);
      expect(item.period.length).toBeGreaterThan(0);
      expect(item.points.length).toBeGreaterThan(0);
      expect(Number.isFinite(item.primary[0])).toBe(true);
      expect(Number.isFinite(item.primary[1])).toBe(true);
    }
  });

  it("固定视野包住底图与全部点位（含图幅以西的撒马尔罕）", () => {
    expect(ATLAS_VIEW.x).toBeLessThan(0);
    expect(ATLAS_VIEW.width).toBeGreaterThan(151.5);
    const samarkand = projectMigration(66.97, 39.65);
    expect(samarkand[0]).toBeGreaterThan(ATLAS_VIEW.x);
    for (const item of ATLAS_ITEMS) {
      for (const { point } of item.points) {
        expect(point[0]).toBeGreaterThanOrEqual(ATLAS_VIEW.x);
        expect(point[0]).toBeLessThanOrEqual(ATLAS_VIEW.x + ATLAS_VIEW.width);
        expect(point[1]).toBeGreaterThanOrEqual(ATLAS_VIEW.y);
        expect(point[1]).toBeLessThanOrEqual(ATLAS_VIEW.y + ATLAS_VIEW.height);
      }
    }
    expect(ATLAS_VIEW.box).toBe(
      `${ATLAS_VIEW.x} ${ATLAS_VIEW.y} ${ATLAS_VIEW.width} ${ATLAS_VIEW.height}`,
    );
  });

  it("按图层过滤时保持注册顺序", () => {
    expect(getVisibleItems("all")).toBe(ATLAS_ITEMS);
    expect(getVisibleItems("territory").every((item) => item.topic === "territory")).toBe(true);
    expect(getVisibleItems("migration")).toHaveLength(8);
    expect(getVisibleItems("frontier").map((item) => item.short)).toEqual(
      FRONTIER_POLICIES.map((policy) => policy.institution),
    );
  });
});

describe("标注避让", () => {
  it("字宽按全角/半角分别估算", () => {
    expect(estimateLabelWidth("南越置郡")).toBeGreaterThan(estimateLabelWidth("A B"));
    expect(estimateLabelWidth("")).toBe(1.8);
  });

  it("每条标注都有引导线，且起点就是条目的标图点", () => {
    const placements = placeLabels(ATLAS_ITEMS);
    expect(placements).toHaveLength(ATLAS_ITEMS.length);
    ATLAS_ITEMS.forEach((item, index) => {
      const placement = placements[index];
      expect(placement?.id).toBe(item.id);
      expect(placement?.leader.x1).toBe(item.primary[0]);
      expect(placement?.leader.y1).toBe(item.primary[1]);
      // 引导线总是把标签推离标图点，避免文字压住符号
      expect(
        Math.hypot(placement!.x - item.primary[0], placement!.y - item.primary[1]),
      ).toBeGreaterThan(0);
    });
  });

  it("标签框互不重叠、不越界、也不压住其它标图点", () => {
    const placements = placeLabels(ATLAS_ITEMS);
    const boxes = placements.map((placement) => ({
      x0: placement.x - placement.width / 2,
      x1: placement.x + placement.width / 2,
      y0: placement.y - placement.height / 2,
      y1: placement.y + placement.height / 2,
    }));
    const anchors = ATLAS_ITEMS.map((item) => item.primary);

    boxes.forEach((box, index) => {
      expect(box.x0).toBeGreaterThanOrEqual(ATLAS_VIEW.x);
      expect(box.x1).toBeLessThanOrEqual(ATLAS_VIEW.x + ATLAS_VIEW.width);
      expect(box.y0).toBeGreaterThanOrEqual(ATLAS_VIEW.y);
      expect(box.y1).toBeLessThanOrEqual(ATLAS_VIEW.y + ATLAS_VIEW.height);

      boxes.slice(0, index).forEach((other) => {
        const overlapX = Math.min(box.x1, other.x1) - Math.max(box.x0, other.x0);
        const overlapY = Math.min(box.y1, other.y1) - Math.max(box.y0, other.y0);
        expect(overlapX > 0 && overlapY > 0).toBe(false);
      });

      // 标签框不能盖住其它条目的锚点
      anchors.forEach(([ax, ay], anchorIndex) => {
        if (anchorIndex === index) return;
        const covered = ax > box.x0 && ax < box.x1 && ay > box.y0 && ay < box.y1;
        expect(covered).toBe(false);
      });
    });
  });

  it("同城地点被引导线错开，且布局是确定性的", () => {
    const first = placeLabels(ATLAS_ITEMS);
    const second = placeLabels(ATLAS_ITEMS);
    expect(first).toEqual(second);

    const [changanX, changanY] = projectMigration(108.94, 34.34);
    const changan = first.filter((placement) => {
      const item = ATLAS_ITEMS.find((candidate) => candidate.id === placement.id);
      return item?.primary[0] === changanX && item?.primary[1] === changanY;
    });
    expect(changan.length).toBeGreaterThanOrEqual(4);
    const positions = new Set(changan.map((placement) => `${placement.x},${placement.y}`));
    expect(positions.size).toBe(changan.length);
    for (const placement of changan) {
      const length = Math.hypot(
        placement.leader.x2 - placement.leader.x1,
        placement.leader.y2 - placement.leader.y1,
      );
      expect(length).toBeGreaterThan(0);
    }
  });

  it("全量布局被冻结为常量，与单次计算一致", () => {
    expect(ATLAS_LABELS.size).toBe(ATLAS_ITEMS.length);
    for (const placement of placeLabels(ATLAS_ITEMS)) {
      expect(ATLAS_LABELS.get(placement.id)).toEqual(placement);
    }
  });
});
