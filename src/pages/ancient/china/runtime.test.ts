import { describe, expect, it } from "vitest";

import { DYNASTIES, MINORITIES, TYPE_COLOR } from "./data/runtime-data";
import {
  computeCompactDynastyLayouts,
  computeMinorityRows,
  formatRuntimeYear,
  formatRuntimeYearSpan,
  getDynastyBlockLength,
  getDynastyBranchZ,
  getDynastyLabelFontSize,
  getMinorityLabelX,
  getMinorityTrackZ,
  resetDynastyFilterButtons,
} from "./runtime";

type RuntimeDynastyFixture = {
  name: string;
  start?: number;
  end?: number;
  group?: string;
  branch?: string | number;
  colorKey?: string;
  relations?: Array<{ y: string; t: string }>;
};

type RuntimeMinorityFixture = {
  name: string;
  desc: string;
};

function getColorDistance(colorA: number, colorB: number) {
  const redA = (colorA >> 16) & 255;
  const greenA = (colorA >> 8) & 255;
  const blueA = colorA & 255;
  const redB = (colorB >> 16) & 255;
  const greenB = (colorB >> 8) & 255;
  const blueB = colorB & 255;

  return Math.hypot(redA - redB, greenA - greenB, blueA - blueB);
}

describe("runtime year formatting", () => {
  it("formats BCE years with the 前 prefix", () => {
    expect(formatRuntimeYear(-221)).toBe("前221");
  });

  it("formats CE year spans with a duration", () => {
    expect(formatRuntimeYearSpan(100, 200)).toBe("100-200(100年)");
  });

  it("keeps reversed or zero-length spans from showing negative duration", () => {
    expect(formatRuntimeYearSpan(200, 100)).toBe("200-100(0年)");
  });

  it("places minority labels inside their bands", () => {
    expect(getMinorityLabelX(40)).toBeCloseTo(41.2);
    expect(getMinorityLabelX(0)).toBeCloseTo(1.2);
  });

  it("clears generated dynasty filter buttons before rebuilding them", () => {
    const container = document.createElement("div");
    container.innerHTML = "<button>秦</button><button>汉</button>";

    resetDynastyFilterButtons(container);

    expect(container.children).toHaveLength(0);
    expect(() => resetDynastyFilterButtons(null)).not.toThrow();
  });

  it("staggers minority bands that overlap or sit too close in time", () => {
    const rows = computeMinorityRows([
      { side: "top", life: [100, 200] },
      { side: "top", life: [180, 260] },
      { side: "top", life: [230, 300] },
      { side: "bottom", life: [210, 250] },
    ]);

    expect(rows).toEqual([0, 1, 2, 0]);
  });

  it("reuses a minority band row only after the visual gap is clear", () => {
    const rows = computeMinorityRows(
      [
        { side: "top", life: [100, 200] },
        { side: "top", life: [250, 300] },
        { side: "top", life: [270, 320] },
      ],
      40,
    );

    expect(rows).toEqual([0, 0, 1]);
  });

  it("keeps minority tracks outside the dynasty branch block zone", () => {
    expect(getMinorityTrackZ("top", 0)).toBeLessThanOrEqual(-40);
    expect(getMinorityTrackZ("bottom", 0)).toBeGreaterThanOrEqual(40);
    expect(getMinorityTrackZ("bottom", 1) - getMinorityTrackZ("bottom", 0)).toBe(6);
  });

  it("compacts numeric dynasty branches while keeping side branches away from center blocks", () => {
    expect(getDynastyBranchZ("north")).toBe(-13);
    expect(getDynastyBranchZ("south")).toBe(13);
    expect(getDynastyBranchZ(24)).toBe(24);
    expect(getDynastyBranchZ(-8)).toBe(-8);
  });

  it("gives short Five Dynasties and Ten Kingdoms blocks readable sizing", () => {
    expect(getDynastyBlockLength(1, "后汉", true)).toBeCloseTo(10);
    expect(getDynastyBlockLength(1, "荆南", true)).toBeCloseTo(10);
    expect(getDynastyBlockLength(1, "南唐故地", true)).toBeCloseTo(16.4);
    expect(getDynastyLabelFontSize(true)).toBe(20);
    expect(getDynastyLabelFontSize(false)).toBe(30);
  });

  it("keeps every Five Dynasties and Ten Kingdoms block wide enough for its name", () => {
    const dynasties = DYNASTIES as RuntimeDynastyFixture[];
    const compactDynasties = dynasties.filter(
      (dynasty) => dynasty.group === "wudai" || dynasty.group === "shiguo",
    );

    expect(compactDynasties.length).toBeGreaterThan(0);
    compactDynasties.forEach((dynasty) => {
      const rawLength = ((dynasty.end ?? 0) - (dynasty.start ?? 0)) * (360 / 2230);

      expect(getDynastyBlockLength(rawLength, dynasty.name, true)).toBeGreaterThanOrEqual(10);
    });
  });

  it("keeps neighboring Five Dynasties and Ten Kingdoms colors visually distinct", () => {
    const dynasties = DYNASTIES as RuntimeDynastyFixture[];
    const colors = TYPE_COLOR as Record<string, number>;
    const compactGroups = new Map<string, RuntimeDynastyFixture[]>();
    const compactDynasties = dynasties.filter(
      (dynasty) => dynasty.group === "wudai" || dynasty.group === "shiguo",
    );

    compactDynasties.forEach((dynasty) => {
      const branchKey = `${dynasty.group}:${dynasty.branch ?? "center"}`;
      compactGroups.set(branchKey, [...(compactGroups.get(branchKey) ?? []), dynasty]);
    });

    compactGroups.forEach((groupDynasties) => {
      for (let i = 0; i < groupDynasties.length; i++) {
        for (let j = i + 1; j < groupDynasties.length; j++) {
          const colorA = colors[groupDynasties[i].colorKey ?? ""];
          const colorB = colors[groupDynasties[j].colorKey ?? ""];

          expect(getColorDistance(colorA, colorB)).toBeGreaterThanOrEqual(60);
        }
      }
    });
  });

  it("separates overlapping Five Dynasties and Ten Kingdoms blocks into stable z lanes", () => {
    const layouts = computeCompactDynastyLayouts(
      [
        { name: "杨吴", start: 902, end: 937, branch: 8 },
        { name: "吴越", start: 907, end: 978, branch: 8 },
        { name: "闽", start: 909, end: 945, branch: 8 },
      ],
      (year: number) => year,
    );
    const zValues = [layouts.get(0)?.z, layouts.get(1)?.z, layouts.get(2)?.z];

    expect(new Set(zValues).size).toBe(3);
  });

  it("keeps actual compact dynasty layouts from sharing z space when their display spans overlap", () => {
    const dynasties = DYNASTIES as RuntimeDynastyFixture[];
    const layouts = computeCompactDynastyLayouts(dynasties, (year: number) => year * (360 / 2230));
    const compactLayouts = Array.from(layouts.values());

    for (let i = 0; i < compactLayouts.length; i++) {
      for (let j = i + 1; j < compactLayouts.length; j++) {
        const first = compactLayouts[i];
        const second = compactLayouts[j];
        const overlaps = first.xStart < second.xEnd + 0.6 && first.xEnd > second.xStart - 0.6;

        if (overlaps) {
          expect(
            Math.abs(first.z - second.z),
            `${first.name} and ${second.name} should not share z space`,
          ).toBeGreaterThanOrEqual(3.6);
        }
      }
    }
  });

  it("keeps the Huihe rename to Huihu in chronology data", () => {
    const dynasties = DYNASTIES as RuntimeDynastyFixture[];
    const minorities = MINORITIES as RuntimeMinorityFixture[];
    const tang = dynasties.find((dynasty) => dynasty.name === "唐");
    const huihe = minorities.find((minority) => minority.name === "回纥");

    expect(tang?.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          y: "788",
          t: expect.stringContaining("改国号为回鹘"),
        }),
      ]),
    );
    expect(huihe?.desc).toContain("改称回鹘");
  });
});
