import { describe, expect, it } from "vitest";

import { capitalsOf, citiesOf, controlSignature, resolvePeriodAt } from "./chronicle-control";
import { periodStartMonth, toMonthIndex } from "./chronicle-time";
import { CHRONICLE_PERIODS } from "./registry";
import type { ChroniclePeriod } from "./types";

function makePeriod(): ChroniclePeriod {
  const polity = (id: string, x: number, name = id): ChroniclePeriod["polities"][number] => ({
    id,
    name,
    color: "#123456",
    note: `${name} note`,
    territory: [
      [x, 30],
      [x + 1, 30],
      [x + 1, 31],
      [x + 1, 31],
      [x, 30],
    ],
    capitals: [{ name: `${name}都`, ll: [x + 0.5, 30.5], kind: "main" }],
    cities: [{ name: `${name}城`, ll: [x + 0.6, 30.6] }],
    sources: ["s"],
  });
  return {
    id: "test",
    name: "测试",
    yearLabel: "100 — 200",
    startYear: 100,
    endYear: 200,
    era: "sui-tang",
    summary: "test",
    polities: [polity("a", 100), polity("b", 110), polity("c", 120)],
    coreRegions: [],
    divisions: [],
    defenses: [],
    wars: [],
    sources: ["s"],
    focus: { center: [110, 30], zoom: 4 },
    control: [
      { year: 120, month: 6, by: "b", absorbed: "a", note: "b 并 a" },
      { year: 150, month: 3, by: "c", absorbed: "b", note: "c 并 b" },
    ],
    cityChanges: [
      { year: 130, city: "c城", by: "a", note: "c城归 a" },
      { year: 160, city: "c城", by: "b", note: "c城归 b" },
    ],
  };
}

describe("chronicle control resolution", () => {
  it("keeps every polity separate before any change", () => {
    const resolved = resolvePeriodAt(makePeriod(), toMonthIndex(100, 1));
    expect(resolved.activePolities).toHaveLength(3);
    expect(resolved.controlHistory).toEqual([]);
    expect(resolved.cities).toHaveLength(6);
    expect(resolved.cities.every((city) => !city.changed)).toBe(true);
    expect(controlSignature(resolved)).toContain("a|");
  });

  it("transfers absorbed territory to the taker and never double-counts it", () => {
    const period = makePeriod();
    const afterA = resolvePeriodAt(period, toMonthIndex(120, 6));
    expect(afterA.activePolities.map((entry) => entry.polity.id)).toEqual(["b", "c"]);
    const b = afterA.polities.find((entry) => entry.polity.id === "b")!;
    expect(b.absorbedNames).toEqual(["a"]);
    expect(b.rings).toHaveLength(2);
    expect(b.rings[1].kind).toBe("absorbed");
    expect(b.rings[1].fromPolity?.id).toBe("a");
    expect(b.rings[1].sinceYear).toBe(120);
    // a 的都城随疆域一并转归 b
    expect(capitalsOf(afterA, "b").map((city) => city.name)).toContain("a都");
    expect(capitalsOf(afterA, "a")).toHaveLength(0);
  });

  it("chains successive annexations to the final owner", () => {
    const resolved = resolvePeriodAt(makePeriod(), toMonthIndex(150, 3));
    expect(resolved.activePolities.map((entry) => entry.polity.id)).toEqual(["c"]);
    const c = resolved.polities.find((entry) => entry.polity.id === "c")!;
    expect(c.rings).toHaveLength(3);
    expect(c.absorbedNames).toEqual(["a", "b"]);
    // 原本属于 b 的都城与城，连同其吞并的 a 都归最终控制方 c
    expect(capitalsOf(resolved, "c").map((city) => city.name)).toEqual(["a都", "b都", "c都"]);
    expect(resolved.cities.find((city) => city.name === "b都")?.polity?.id).toBe("c");
    expect(citiesOf(resolved, "c").map((city) => city.name)).toEqual(["a城", "b城", "c城"]);
  });

  it("follows city changes through later annexations", () => {
    const period = makePeriod();
    const resolved = resolvePeriodAt(period, toMonthIndex(160, 1));
    const city = resolved.cities.find((entry) => entry.name === "c城")!;
    expect(city.polity?.id).toBe("c");
    expect(city.originPolity.id).toBe("c");
    // 城经 a → b 易主，但 b 最终被 c 吞并，城又回到原主 c 名下，不再标「易主」
    expect(city.changed).toBe(false);
    expect(city.change?.year).toBe(160);
    expect(resolved.cityHistory[0].year).toBe(160);
    // 最近 12 个月窗口内的控制变更
    const recent = resolvePeriodAt(period, toMonthIndex(151, 1));
    expect(recent.recentChanges.map((change) => change.year)).toEqual([150]);
  });

  it("handles unclaimed annexation and local control zones", () => {
    const period = makePeriod();
    period.control = [{ year: 120, by: null, absorbed: "a", note: "a 退出图面" }];
    period.controlZones = [
      {
        id: "z",
        name: "飞地",
        ring: [
          [105, 30],
          [106, 30],
          [106, 31],
          [105, 30],
        ],
        polityId: "a",
        note: "zone",
        changes: [{ year: 130, by: "b", note: "转归 b" }],
      },
    ];
    const before = resolvePeriodAt(period, toMonthIndex(119, 12));
    expect(before.activePolities).toHaveLength(3);
    expect(before.zones[0].polity?.id).toBe("a");
    const after = resolvePeriodAt(period, toMonthIndex(130, 1));
    expect(after.activePolities.map((entry) => entry.polity.id)).toEqual(["b", "c"]);
    expect(after.zones[0].polity?.id).toBe("b");
    expect(after.polities.find((entry) => entry.polity.id === "a")?.absorbedBy).toBeNull();
  });

  it("resolves every shipped period without overlapping control", () => {
    for (const period of CHRONICLE_PERIODS) {
      for (const month of [
        periodStartMonth(period),
        toMonthIndex(Math.round((period.startYear + period.endYear) / 2), 6),
      ]) {
        const resolved = resolvePeriodAt(period, month);
        // 每个疆域环恰好挂在一个在场政权名下
        const activeIds = new Set(resolved.activePolities.map((entry) => entry.polity.id));
        for (const active of resolved.activePolities) {
          expect(active.rings.length).toBeGreaterThan(0);
          for (const ring of active.rings) {
            expect(activeIds.has(ring.polity.id)).toBe(true);
          }
        }
        expect(controlSignature(resolved)).toBe(controlSignature(resolvePeriodAt(period, month)));
      }
    }
  });
});
