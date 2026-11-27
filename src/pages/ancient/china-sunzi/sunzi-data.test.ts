import { describe, expect, it } from "vitest";

import { BATTLES } from "./battles";
import { PRINCIPLE_BY_ID, PRINCIPLES, THREAD } from "./principles";
import { STRATAGEM_BY_NUMBER, STRATAGEM_SETS, STRATAGEMS } from "./stratagems";
import { BRANCH_LABEL } from "./types";

describe("孙子兵法沙盘数据", () => {
  it("三役各四幕，战役与幕的 id 都唯一", () => {
    expect(BATTLES).toHaveLength(3);
    expect(new Set(BATTLES.map((battle) => battle.id)).size).toBe(BATTLES.length);

    for (const battle of BATTLES) {
      expect(battle.steps).toHaveLength(4);
      expect(new Set(battle.steps.map((step) => step.id)).size).toBe(4);
      expect(battle.name).toBeTruthy();
      expect(battle.period).toBeTruthy();
      expect(battle.summary).toBeTruthy();
      expect(battle.sources).toContain("《");
    }
  });

  it("每一幕引用的阵营、要义、控区都真实存在", () => {
    for (const battle of BATTLES) {
      const forceIds = new Set(battle.forces.map((force) => force.id));
      const regionIds = new Set(battle.regions.map((region) => region.id));
      expect(battle.forces.filter((force) => force.side === "a")).toHaveLength(1);
      expect(battle.forces.filter((force) => force.side === "b")).toHaveLength(1);

      for (const step of battle.steps) {
        expect(PRINCIPLE_BY_ID[step.principleId]).toBeDefined();
        expect(step.units.length).toBeGreaterThan(0);
        for (const unit of step.units) {
          expect(forceIds.has(unit.id)).toBe(true);
          expect(Object.keys(BRANCH_LABEL)).toContain(unit.branch);
        }
        for (const regionId of step.held) {
          expect(regionIds.has(regionId)).toBe(true);
        }
        for (const move of step.moves) {
          expect(move.from).not.toEqual(move.to);
          expect(move.kind).toMatch(/^(advance|flank|feint|pursuit)$/);
        }
      }
    }
  });

  it("所有点位都落在沙盘视框内", () => {
    for (const battle of BATTLES) {
      for (const place of battle.places) {
        expect(place.x).toBeGreaterThan(0);
        expect(place.x).toBeLessThan(1000);
        expect(place.y).toBeGreaterThan(0);
        expect(place.y).toBeLessThan(640);
      }
      for (const step of battle.steps) {
        for (const unit of step.units) {
          expect(unit.x).toBeGreaterThan(0);
          expect(unit.x).toBeLessThan(1000);
          expect(unit.y).toBeGreaterThan(0);
          expect(unit.y).toBeLessThan(640);
        }
      }
    }
  });

  it("六条要义各有出处，贯穿表覆盖全部要义", () => {
    expect(PRINCIPLES).toHaveLength(6);
    expect(new Set(PRINCIPLES.map((principle) => principle.id)).size).toBe(6);

    for (const principle of PRINCIPLES) {
      expect(principle.quote).toBeTruthy();
      expect(principle.source).toContain("《孙子兵法");
      expect(principle.plain.length).toBeGreaterThan(10);
    }
    expect(new Set(THREAD.map((entry) => entry.principleId))).toEqual(
      new Set(PRINCIPLES.map((principle) => principle.id)),
    );
  });

  it("三十六计六套各六计，编号连续且原文与白话齐备", () => {
    expect(STRATAGEMS).toHaveLength(36);
    expect(STRATAGEM_SETS).toHaveLength(6);
    expect(STRATAGEMS.map((item) => item.number)).toEqual(
      Array.from({ length: 36 }, (_, index) => index + 1),
    );

    for (const group of STRATAGEM_SETS) {
      expect(STRATAGEMS.filter((item) => item.set === group.id)).toHaveLength(6);
    }
    for (const item of STRATAGEMS) {
      expect(STRATAGEM_BY_NUMBER[item.number]).toBe(item);
      expect(item.verse.length).toBeGreaterThan(5);
      expect(item.plain.length).toBeGreaterThan(5);
      expect(item.name.length).toBeGreaterThanOrEqual(3);
      if (item.link) {
        const battle = BATTLES.find((candidate) => candidate.id === item.link?.battleId);
        expect(battle?.steps.some((step) => step.id === item.link?.stepId)).toBe(true);
      }
    }
  });
});
