import { describe, expect, it } from "vitest";

import { toMonthIndex } from "./chronicle-time";
import { CHRONICLE_ERAS, CHRONICLE_PERIODS, periodsOfEra } from "./registry";
import { ERA_LABELS } from "./types";

/**
 * 编年数据不变量：20 期、唯一 id、编年有序；每期每个政权的多边形必须是
 * 单一闭合环（≥3 顶点、首尾重合、不自检出的重复段）；所有坐标落在东亚
 * 合理范围内；每期与每场战争必须携带出处。
 */

const LON_MIN = 72;
const LON_MAX = 142;
const LAT_MIN = 15;
const LAT_MAX = 58;

function isLngLatInBounds(ll: readonly [number, number]): boolean {
  return ll[0] >= LON_MIN && ll[0] <= LON_MAX && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX;
}

/** 线段相交检测（不含共享端点的相邻边）。用于捕获「双环/自粘贴」式自相交。 */
function segmentsIntersect(
  a1: readonly [number, number],
  a2: readonly [number, number],
  b1: readonly [number, number],
  b2: readonly [number, number],
): boolean {
  const d1 = crossProduct(a1, a2, b1);
  const d2 = crossProduct(a1, a2, b2);
  const d3 = crossProduct(b1, b2, a1);
  const d4 = crossProduct(b1, b2, a2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function crossProduct(
  o: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function findSelfIntersection(ring: readonly (readonly [number, number])[]): string | null {
  const n = ring.length;
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 2; j < n - 1; j += 1) {
      // 跳过相邻边与闭合边共享端点的情况
      if (i === 0 && j === n - 2) continue;
      if (segmentsIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        return `边 ${i}(${ring[i].join(",")}) 与边 ${j}(${ring[j].join(",")}) 相交`;
      }
    }
  }
  return null;
}

function forEachPoint(
  period: (typeof CHRONICLE_PERIODS)[number],
  visit: (ll: readonly [number, number], where: string) => void,
) {
  for (const polity of period.polities) {
    for (const [index, ll] of polity.territory.entries()) {
      visit(ll, `${polity.id}.territory[${index}]`);
    }
    for (const [index, ll] of (polity.looseTerritory ?? []).entries()) {
      visit(ll, `${polity.id}.looseTerritory[${index}]`);
    }
    for (const capital of polity.capitals) {
      visit(capital.ll, `${polity.id}.capital(${capital.name})`);
    }
  }
  for (const region of period.coreRegions) {
    visit(region.ll, `coreRegion(${region.name})`);
    for (const [index, ll] of (region.polygon ?? []).entries()) {
      visit(ll, `coreRegion(${region.name}).polygon[${index}]`);
    }
  }
  for (const division of period.divisions) {
    visit(division.seat, `division(${division.name})`);
  }
  for (const defense of period.defenses) {
    for (const [index, ll] of (defense.points ?? []).entries()) {
      visit(ll, `defense(${defense.name}).points[${index}]`);
    }
    if (defense.ll) visit(defense.ll, `defense(${defense.name})`);
  }
  for (const war of period.wars) {
    visit(war.center, `war(${war.name}).center`);
    for (const [index, op] of (war.ops ?? []).entries()) {
      for (const [pointIndex, ll] of (op.points ?? []).entries()) {
        visit(ll, `war(${war.name}).ops[${index}].points[${pointIndex}]`);
      }
      if (op.ll) visit(op.ll, `war(${war.name}).ops[${index}](${op.name})`);
    }
  }
}

describe("chronicle data invariants", () => {
  it("exactly 20 periods ordered chronologically by startYear", () => {
    expect(CHRONICLE_PERIODS).toHaveLength(20);
    const starts = CHRONICLE_PERIODS.map((period) => period.startYear);
    for (let i = 1; i < starts.length; i += 1) {
      expect(starts[i]).toBeGreaterThan(starts[i - 1]);
    }
    // 起点为夏（约前2070），终点为清（至1840）
    expect(CHRONICLE_PERIODS[0].id).toBe("xia");
    expect(CHRONICLE_PERIODS[19].id).toBe("qing");
  });

  it("period ids are unique and era grouping is consistent", () => {
    const ids = CHRONICLE_PERIODS.map((period) => period.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(CHRONICLE_ERAS)).toEqual(
      new Set(["pre-qin", "qin-han", "wei-jin", "sui-tang", "song-yuan", "ming-qing"]),
    );
    for (const era of CHRONICLE_ERAS) {
      const eraPeriods = periodsOfEra(era);
      expect(eraPeriods.length).toBeGreaterThan(0);
      for (const period of eraPeriods) {
        expect(period.era).toBe(era);
      }
    }
    // 每组按编年有序
    for (const era of CHRONICLE_ERAS) {
      const starts = periodsOfEra(era).map((period) => period.startYear);
      for (let i = 1; i < starts.length; i += 1) {
        expect(starts[i]).toBeGreaterThan(starts[i - 1]);
      }
    }
  });

  it("every period carries era label coverage, summary, sources and a focus", () => {
    for (const period of CHRONICLE_PERIODS) {
      expect(ERA_LABELS[period.era]).toBeTruthy();
      expect(period.summary.length).toBeGreaterThan(30);
      expect(period.sources.length).toBeGreaterThan(0);
      expect(period.yearLabel).toMatch(/前|—/);
      expect(period.focus.zoom).toBeGreaterThanOrEqual(3);
      expect(period.focus.zoom).toBeLessThanOrEqual(8);
      expect(isLngLatInBounds(period.focus.center)).toBe(true);
    }
  });

  it("territory polygons are simple closed rings within bounds", () => {
    const offenders: string[] = [];
    for (const period of CHRONICLE_PERIODS) {
      for (const polity of period.polities) {
        const tag = `${period.id}/${polity.id}`;
        expect(polity.name.length).toBeGreaterThan(0);
        expect(polity.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(polity.territory.length).toBeGreaterThanOrEqual(3);
        const first = polity.territory[0];
        const last = polity.territory[polity.territory.length - 1];
        expect(last[0]).toBe(first[0]);
        expect(last[1]).toBe(first[1]);
        // 无重复顶点段（防双环/自粘贴）；闭合点是首点重合，先去掉再查
        const key = (ll: readonly [number, number]) => `${ll[0]},${ll[1]}`;
        const keys = polity.territory.slice(0, -1).map(key);
        if (new Set(keys).size !== keys.length) {
          const seen = new Set<string>();
          for (const k of keys) {
            if (seen.has(k)) offenders.push(`${tag}: 重复顶点 ${k}`);
            seen.add(k);
          }
        }
        const crossing = findSelfIntersection(polity.territory);
        if (crossing) offenders.push(`${tag}: 自相交 ${crossing}`);
        for (const ll of polity.territory) {
          if (!isLngLatInBounds(ll)) offenders.push(`${tag}: 越界 ${ll.join(",")}`);
        }
        // 每个都城必须在主疆域环的包围盒内（粗粒度一致性）
        const xs = polity.territory.map((ll) => ll[0]);
        const ys = polity.territory.map((ll) => ll[1]);
        const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as const;
        for (const capital of polity.capitals) {
          expect(capital.name.length).toBeGreaterThan(0);
          expect(isLngLatInBounds(capital.ll)).toBe(true);
          if (
            capital.ll[0] < bbox[0] - 0.5 ||
            capital.ll[0] > bbox[2] + 0.5 ||
            capital.ll[1] < bbox[1] - 0.5 ||
            capital.ll[1] > bbox[3] + 0.5
          ) {
            offenders.push(`${tag}: 都城 ${capital.name} ${capital.ll.join(",")} 超出疆域包围盒`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every coordinate on the map stays within East Asia bounds", () => {
    const offenders: string[] = [];
    for (const period of CHRONICLE_PERIODS) {
      forEachPoint(period, (ll, where) => {
        if (!isLngLatInBounds(ll)) offenders.push(`${period.id}/${where} = ${ll.join(",")}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("wars carry sides, dates, outcome and sources; ops are well formed", () => {
    for (const period of CHRONICLE_PERIODS) {
      expect(period.wars.length).toBeGreaterThanOrEqual(1);
      const warIds = period.wars.map((war) => war.id);
      expect(new Set(warIds).size).toBe(warIds.length);
      for (const war of period.wars) {
        expect(war.name.length).toBeGreaterThan(1);
        expect(war.sideA.length).toBeGreaterThan(0);
        expect(war.sideB.length).toBeGreaterThan(0);
        expect(war.year).not.toBe("");
        expect(war.brief.length).toBeGreaterThan(8);
        expect(war.detail.length).toBeGreaterThan(20);
        expect(war.outcome.length).toBeGreaterThan(0);
        expect(war.scale?.length ?? 0).toBeGreaterThan(3);
        expect(war.losses?.length ?? 0).toBeGreaterThan(3);
        expect(war.sources.length).toBeGreaterThan(0);
        expect(isLngLatInBounds(war.center)).toBe(true);
        for (const op of war.ops ?? []) {
          expect([1, 2]).toContain(op.side);
          expect(op.name.length).toBeGreaterThan(0);
          if (op.kind === "arrow" || op.kind === "encircle") {
            expect(op.points?.length).toBeGreaterThanOrEqual(2);
          } else {
            expect(op.ll).toBeTruthy();
          }
        }
      }
    }
  });

  it("divisions and defenses are populated with notes", () => {
    const offenders: string[] = [];
    for (const period of CHRONICLE_PERIODS) {
      expect(period.divisions.length).toBeGreaterThanOrEqual(3);
      for (const division of period.divisions) {
        expect(division.name.length).toBeGreaterThan(0);
        expect(division.kind.length).toBeGreaterThan(0);
        if (division.note.length <= 2)
          offenders.push(`${period.id}/division(${division.name}): 注释过短`);
        if (!isLngLatInBounds(division.seat))
          offenders.push(`${period.id}/division(${division.name}): 越界`);
      }
      for (const defense of period.defenses) {
        expect(defense.name.length).toBeGreaterThan(0);
        expect(defense.kind.length).toBeGreaterThan(0);
        if (defense.note.length <= 4)
          offenders.push(`${period.id}/defense(${defense.name}): 注释过短`);
        if (defense.points) expect(defense.points.length).toBeGreaterThanOrEqual(2);
        else expect(defense.ll).toBeTruthy();
      }
    }
    expect(offenders).toEqual([]);
    // 重点期锁数量：秦 36 郡采样≥16、明两京十三司+羁縻≥18、清十八省+将军辖区=25
    const qin = CHRONICLE_PERIODS.find((period) => period.id === "qin");
    expect(qin?.divisions.length).toBeGreaterThanOrEqual(16);
    const ming = CHRONICLE_PERIODS.find((period) => period.id === "ming");
    expect(ming?.divisions.length).toBeGreaterThanOrEqual(18);
    const qing = CHRONICLE_PERIODS.find((period) => period.id === "qing");
    expect(qing?.divisions.length).toBe(25);
  });

  it("split-era periods present multiple polities", () => {
    const expectations: Record<string, number> = {
      chunqiu: 8,
      zhanguo: 7,
      sanguo: 3,
      "dongjin-shiliuguo": 2,
      nanbeichao: 3,
      "wudai-shiguo": 9,
      beisong: 4,
      "nansong-jin": 5,
      ming: 3,
    };
    for (const [id, count] of Object.entries(expectations)) {
      const period = CHRONICLE_PERIODS.find((entry) => entry.id === id);
      expect(period?.polities.length).toBe(count);
    }
  });

  it("control and city changes reference real polities, cities and ordered dates", () => {
    for (const period of CHRONICLE_PERIODS) {
      const ids = new Set(period.polities.map((polity) => polity.id));
      const cityNames = new Set(
        period.polities.flatMap((polity) => [
          ...polity.capitals.map((capital) => capital.name),
          ...(polity.cities ?? []).map((city) => city.name),
        ]),
      );
      let lastMonth = -Infinity;
      for (const change of period.control ?? []) {
        expect(ids.has(change.absorbed), `${period.id}: 未知被吞并政权 ${change.absorbed}`).toBe(
          true,
        );
        if (change.by) {
          expect(ids.has(change.by), `${period.id}: 未知接管方 ${change.by}`).toBe(true);
        }
        expect(change.note.length).toBeGreaterThan(3);
        expect(change.month ?? 1).toBeGreaterThanOrEqual(1);
        expect(change.month ?? 1).toBeLessThanOrEqual(12);
        const month = toMonthIndex(change.year, change.month ?? 1);
        expect(month).toBeGreaterThanOrEqual(lastMonth);
        lastMonth = month;
      }
      for (const change of period.cityChanges ?? []) {
        expect(cityNames.has(change.city), `${period.id}: 未知城市 ${change.city}`).toBe(true);
        if (change.by) expect(ids.has(change.by)).toBe(true);
        expect(change.note.length).toBeGreaterThan(3);
      }
      for (const zone of period.controlZones ?? []) {
        expect(ids.has(zone.polityId)).toBe(true);
        expect(zone.ring.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("every period carries annals and figures with sourced, ordered records", () => {
    for (const period of CHRONICLE_PERIODS) {
      const annals = period.annals ?? [];
      expect(annals.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < annals.length; i += 1) {
        expect(annals[i].year).toBeGreaterThanOrEqual(annals[i - 1].year);
      }
      for (const annal of annals) {
        expect(annal.text.length).toBeGreaterThan(5);
        expect(["capital", "war", "politics", "person", "territory"]).toContain(annal.kind);
        if (annal.month != null) {
          expect(annal.month).toBeGreaterThanOrEqual(1);
          expect(annal.month).toBeLessThanOrEqual(12);
        }
        if (annal.polityId) {
          expect(period.polities.some((polity) => polity.id === annal.polityId)).toBe(true);
        }
      }
      const figures = period.figures ?? [];
      expect(figures.length).toBeGreaterThanOrEqual(3);
      const names = new Set<string>();
      for (const figure of figures) {
        expect(names.has(figure.name), `${period.id}: 人物重复 ${figure.name}`).toBe(false);
        names.add(figure.name);
        expect(figure.role.length).toBeGreaterThan(0);
        expect(figure.life.length).toBeGreaterThan(5);
        expect(figure.fate.length).toBeGreaterThan(2);
        expect(["loyal", "treacherous", "notable"]).toContain(figure.stance);
        if (figure.birthYear != null && figure.deathYear != null) {
          expect(figure.deathYear).toBeGreaterThan(figure.birthYear);
        }
        if (figure.birthMonth != null) {
          expect(figure.birthMonth).toBeGreaterThanOrEqual(1);
          expect(figure.birthMonth).toBeLessThanOrEqual(12);
        }
        if (figure.deathMonth != null) {
          expect(figure.deathMonth).toBeGreaterThanOrEqual(1);
          expect(figure.deathMonth).toBeLessThanOrEqual(12);
        }
      }
      // 正统与乱政两端都要有选例（先秦等无「奸臣」概念者用 notable 兜底）
      expect(new Set(figures.map((figure) => figure.stance)).size).toBeGreaterThanOrEqual(2);
    }
    // 宋朝帝姬按史实列在南宋期
    expect(
      CHRONICLE_PERIODS.find((period) => period.id === "nansong-jin")?.figures?.some(
        (figure) => figure.role === "帝姬",
      ),
    ).toBe(true);
  });
});
