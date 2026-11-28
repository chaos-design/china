import { describe, expect, it } from "vitest";

import {
  annalsAtOrBefore,
  buildChronicleEvents,
  buildEraBands,
  buildPeriodBands,
  formatYear,
  formatYearMonth,
  fromMonthIndex,
  getPeriodForMonth,
  latestWarAtOrBeforeMonth,
  monthRatio,
  pastWarsAtOrBeforeMonth,
  periodEndMonth,
  periodStartMonth,
  toMonthIndex,
  warStartMonth,
} from "./chronicle-time";
import { CHRONICLE_PERIODS } from "./registry";
import type { ChroniclePeriod, WarEvent } from "./types";

/** 时间模型以「月」为最小单位，且历史纪年没有公元 0 年。 */
describe("chronicle time model", () => {
  it("round-trips month indices across the BCE/CE boundary", () => {
    expect(toMonthIndex(-1, 12)).toBe(11);
    expect(toMonthIndex(1, 1)).toBe(12);
    expect(fromMonthIndex(11)).toEqual({ year: -1, month: 12 });
    expect(fromMonthIndex(12)).toEqual({ year: 1, month: 1 });
    for (const year of [-2070, -221, -1, 1, 202, 1840]) {
      for (const month of [1, 6, 12]) {
        expect(fromMonthIndex(toMonthIndex(year, month))).toEqual({ year, month });
      }
    }
  });

  it("formats years without a year zero", () => {
    expect(formatYear(-2070)).toBe("前2070");
    expect(formatYear(1840)).toBe("1840");
    expect(formatYearMonth({ year: -221, month: 3 })).toBe("前221年3月");
  });

  it("parses war start years with BCE, CE and approximate prefixes", () => {
    const war = (year: string): WarEvent => ({
      id: "x",
      name: "x",
      year,
      sideA: "a",
      sideB: "b",
      center: [110, 35],
      brief: "b",
      detail: "d",
      outcome: "o",
      sources: ["s"],
    });
    expect(warStartMonth(war("约前1600"))).toBe(toMonthIndex(-1600, 1));
    expect(warStartMonth(war("前230 — 前221"))).toBe(toMonthIndex(-230, 1));
    expect(warStartMonth(war("前202 — 公元8"))).toBe(toMonthIndex(-202, 1));
    expect(warStartMonth(war("755 — 763"))).toBe(toMonthIndex(755, 1));
    expect(warStartMonth(war("无年份"))).toBe(0);
  });

  it("maps any month to the last period whose start is not later", () => {
    expect(getPeriodForMonth(CHRONICLE_PERIODS, periodStartMonth(CHRONICLE_PERIODS[0])).id).toBe(
      "xia",
    );
    const qin = CHRONICLE_PERIODS.find((period) => period.id === "qin")!;
    expect(getPeriodForMonth(CHRONICLE_PERIODS, periodStartMonth(qin)).id).toBe("qin");
    // 边界年：商期起点即夏期终点年，归属商期
    const shang = CHRONICLE_PERIODS.find((period) => period.id === "shang")!;
    expect(getPeriodForMonth(CHRONICLE_PERIODS, periodStartMonth(shang)).id).toBe("shang");
  });

  it("builds touching period bands and covers era bands without overlap", () => {
    const bands = buildPeriodBands(CHRONICLE_PERIODS);
    expect(bands).toHaveLength(CHRONICLE_PERIODS.length);
    for (let i = 1; i < bands.length; i += 1) {
      expect(bands[i].startMonth).toBeGreaterThan(bands[i - 1].startMonth);
      expect(bands[i - 1].endMonth).toBe(bands[i].startMonth - 1);
    }
    const eras = buildEraBands(CHRONICLE_PERIODS);
    expect(eras).toHaveLength(6);
    for (let i = 1; i < eras.length; i += 1) {
      expect(eras[i].startMonth).toBeGreaterThan(eras[i - 1].endMonth);
    }
    expect(eras[eras.length - 1].endMonth).toBe(
      periodEndMonth(CHRONICLE_PERIODS[CHRONICLE_PERIODS.length - 1]),
    );
  });

  it("builds sorted events with month-level annotations", () => {
    const events = buildChronicleEvents(CHRONICLE_PERIODS);
    expect(events.length).toBeGreaterThan(40);
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i].month).toBeGreaterThanOrEqual(events[i - 1].month);
    }
    expect(events.some((event) => event.kind === "control")).toBe(true);
    expect(events.some((event) => event.kind === "city")).toBe(true);
    expect(events.find((event) => event.kind === "control")?.detail).toMatch(/年\d+月/);
  });

  it("returns only wars and annals already started by the current month", () => {
    const period: ChroniclePeriod = {
      id: "test",
      name: "测试",
      yearLabel: "前230 — 前221",
      startYear: -230,
      endYear: -221,
      era: "qin-han",
      summary: "test",
      polities: [],
      coreRegions: [],
      divisions: [],
      defenses: [],
      sources: ["s"],
      focus: { center: [110, 35], zoom: 4 },
      annals: [
        { year: -230, month: 3, kind: "politics", text: "甲" },
        { year: -225, kind: "war", text: "乙" },
      ],
      wars: [
        {
          id: "early",
          name: "早战",
          year: "前230 — 前229",
          sideA: "a",
          sideB: "b",
          center: [110, 35],
          brief: "b",
          detail: "d",
          outcome: "o",
          sources: ["s"],
        },
        {
          id: "late",
          name: "晚战",
          year: "前223",
          sideA: "a",
          sideB: "b",
          center: [110, 35],
          brief: "b",
          detail: "d",
          outcome: "o",
          sources: ["s"],
        },
      ],
      control: [{ year: -228, month: 10, by: "a", absorbed: "b", note: "并" }],
      cityChanges: [{ year: -227, city: "X", by: "a", note: "易主" }],
    };
    const atStart = periodStartMonth(period);
    expect(latestWarAtOrBeforeMonth(period, atStart)?.id).toBe("early");
    expect(pastWarsAtOrBeforeMonth(period, atStart, null)).toHaveLength(1);
    expect(annalsAtOrBefore(period, atStart).some((entry) => entry.text === "乙")).toBe(false);
    const later = toMonthIndex(-227, 1);
    const annals = annalsAtOrBefore(period, later);
    expect(annals[0].text).toMatch(/易主/);
    expect(annals.some((entry) => entry.monthKnown === false)).toBe(true);
    expect(annals.every((entry) => entry.month <= later)).toBe(true);
  });

  it("clamps month ratios", () => {
    expect(monthRatio(5, 0, 10)).toBe(0.5);
    expect(monthRatio(-5, 0, 10)).toBe(0);
    expect(monthRatio(20, 0, 10)).toBe(1);
    expect(monthRatio(1, 1, 1)).toBe(0);
  });
});
