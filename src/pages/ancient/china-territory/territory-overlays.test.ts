import { describe, expect, it } from "vitest";

import { CHRONICLE_PERIODS, getChroniclePeriod } from "./registry";
import {
  buildArrowPolygon,
  buildCapitalSpecs,
  buildCitySpecs,
  buildCoreRegionSpecs,
  buildDefenseSpecs,
  buildDivisionSpecs,
  buildPolitySpecs,
  buildTimeStops,
  buildWarList,
  buildWarSpec,
  DEFENSE_ZOOM,
  DIVISION_ZOOM,
  directionIndicator,
  findRingSelfIntersection,
  getPeriodBounds,
  insetRing,
  latestWarAtOrBefore,
  parseWarYearRange,
  pastWarsAtOrBefore,
  smoothRing,
  toLatLng,
} from "./territory-overlays";

describe("territory-overlays", () => {
  it("converts lng/lat data tuples into leaflet lat/lng", () => {
    expect(toLatLng([116.4, 39.9])).toEqual([39.9, 116.4]);
  });

  it("builds polity specs with closed rings and label anchors for every period", () => {
    for (const period of CHRONICLE_PERIODS) {
      const specs = buildPolitySpecs(period);
      expect(specs).toHaveLength(period.polities.length);
      for (const spec of specs) {
        expect(spec.ring.length).toBeGreaterThanOrEqual(3);
        expect(spec.ring[0]).toEqual(spec.ring[spec.ring.length - 1]);
        for (const [lat, lng] of spec.ring) {
          expect(lat).toBeGreaterThan(-90);
          expect(lat).toBeLessThan(90);
          expect(lng).toBeGreaterThan(-180);
          expect(lng).toBeLessThan(180);
        }
        const [labelLat, labelLng] = spec.labelAt;
        // 标注锚点应落在环包围盒内（容差半度）
        const lats = spec.ring.map((p) => p[0]);
        const lngs = spec.ring.map((p) => p[1]);
        expect(labelLat).toBeGreaterThanOrEqual(Math.min(...lats) - 0.5);
        expect(labelLat).toBeLessThanOrEqual(Math.max(...lats) + 0.5);
        expect(labelLng).toBeGreaterThanOrEqual(Math.min(...lngs) - 0.5);
        expect(labelLng).toBeLessThanOrEqual(Math.max(...lngs) + 0.5);
      }
    }
  });

  it("战国 produces seven polity rings; 明 three; 北宋 four", () => {
    expect(buildPolitySpecs(getChroniclePeriod("zhanguo")).map((s) => s.name)).toEqual([
      "秦国",
      "赵国",
      "魏国",
      "韩国",
      "燕国",
      "齐国",
      "楚国",
    ]);
    expect(buildPolitySpecs(getChroniclePeriod("ming"))).toHaveLength(3);
    expect(buildPolitySpecs(getChroniclePeriod("beisong"))).toHaveLength(4);
  });

  it("羁縻范围（loose ring）随政权带出", () => {
    const han = buildPolitySpecs(getChroniclePeriod("xi-han"));
    const empire = han[0];
    expect(empire.looseRing).toBeDefined();
    expect(empire.looseRing?.length).toBeGreaterThanOrEqual(3);
  });

  it("capital specs carry polity name and color; 秦 capitals land inside territory bbox", () => {
    const qin = getChroniclePeriod("qin");
    const capitals = buildCapitalSpecs(qin);
    expect(capitals.length).toBeGreaterThanOrEqual(1);
    const xianyang = capitals.find((c) => c.name === "咸阳");
    expect(xianyang?.polityName).toBe("秦帝国");
    expect(xianyang?.kind).toBe("main");
    const polity = buildPolitySpecs(qin)[0];
    const lats = polity.ring.map((p) => p[0]);
    const lngs = polity.ring.map((p) => p[1]);
    expect(xianyang?.latlng[0]).toBeGreaterThanOrEqual(Math.min(...lats));
    expect(xianyang?.latlng[0]).toBeLessThanOrEqual(Math.max(...lats));
    expect(xianyang?.latlng[1]).toBeGreaterThanOrEqual(Math.min(...lngs));
    expect(xianyang?.latlng[1]).toBeLessThanOrEqual(Math.max(...lngs));
  });

  it("core regions keep optional polygons; 汉 has 河西 core region", () => {
    const han = buildCoreRegionSpecs(getChroniclePeriod("xi-han"));
    const hexi = han.find((r) => r.name === "河西");
    expect(hexi).toBeDefined();
    expect(hexi?.note).toContain("走廊");
  });

  it("division specs keep kind and note; 清 exposes exactly 25 divisions", () => {
    const qing = buildDivisionSpecs(getChroniclePeriod("qing"));
    expect(qing).toHaveLength(25);
    expect(qing.filter((d) => d.kind === "将军辖区")).toHaveLength(5);
    const ming = buildDivisionSpecs(getChroniclePeriod("ming"));
    expect(ming.some((d) => d.name === "奴儿干都司")).toBe(true);
  });

  it("defense specs split into lines and points", () => {
    const qin = buildDefenseSpecs(getChroniclePeriod("qin"));
    const changcheng = qin.find((d) => d.name === "秦长城");
    expect(changcheng?.line?.length).toBeGreaterThanOrEqual(10);
    const lingqu = qin.find((d) => d.name === "灵渠");
    expect(lingqu?.point).toBeDefined();
    const ming = buildDefenseSpecs(getChroniclePeriod("ming"));
    // 九边 = 边墙 1 条 + 九镇 9 点
    expect(ming.filter((d) => d.kind === "边镇")).toHaveLength(9);
  });

  it("insetRing keeps the ring closed and strictly inside the original bounds", () => {
    const ring: Array<[number, number]> = [
      [110, 30],
      [114, 30],
      [114, 34],
      [110, 34],
      [110, 30],
    ];
    const inset = insetRing(ring);
    expect(inset[0]).toEqual(inset[inset.length - 1]);
    for (const [lng, lat] of inset) {
      expect(lng).toBeGreaterThanOrEqual(110);
      expect(lng).toBeLessThanOrEqual(114);
      expect(lat).toBeGreaterThanOrEqual(30);
      expect(lat).toBeLessThanOrEqual(34);
    }
    expect(inset[0][0]).toBeGreaterThan(110);
  });

  it("direction indicators point along the route without reaching the target city", () => {
    const path: Array<[number, number]> = [
      [110, 35],
      [114, 34],
      [118, 32],
      [120, 30],
    ];
    const indicator = directionIndicator(path);
    expect(indicator.path).toHaveLength(2);
    expect(indicator.tip).not.toEqual(path[path.length - 1]);
    expect(indicator.tip[0]).toBeGreaterThan(path[0][0]);
    expect(indicator.tip[1]).toBeLessThan(path[0][1]);
    expect(Number.isFinite(indicator.angle)).toBe(true);
    // 箭头只占路线中段一小截（经度跨度远小于全路径）
    expect(indicator.tip[0] - indicator.path[0][0]).toBeLessThan(
      path[path.length - 1][0] - path[0][0],
    );
  });

  it("war spec derives arrow polygons with tips, battles, encircles and a padded bounds box", () => {
    const ans = getChroniclePeriod("tang").wars.find((w) => w.id === "anshi-zhiluan");
    expect(ans).toBeDefined();
    const spec = buildWarSpec(ans!);
    expect(spec.arrows.length).toBeGreaterThanOrEqual(2);
    for (const arrow of spec.arrows) {
      expect(arrow.path.length).toBeGreaterThanOrEqual(2);
      expect(Number.isFinite(arrow.tipAngleDeg)).toBe(true);
      if (arrow.kind === "advance") {
        expect(arrow.ring).toBeDefined();
        expect(arrow.ring!.length).toBeGreaterThanOrEqual(8);
        expect(arrow.ring![0]).toEqual(arrow.ring![arrow.ring!.length - 1]);
      } else {
        expect(arrow.ring).toBeUndefined();
      }
    }
    const [[s, w], [n, e]] = spec.bounds;
    expect(s).toBeLessThan(n);
    expect(w).toBeLessThan(e);
    // 包围盒覆盖战场（洛阳 lat 34.6）并留有余量
    const luoyangLat = 34.6;
    expect(s).toBeLessThan(luoyangLat);
    expect(n).toBeGreaterThan(luoyangLat);
    // 回纥助唐的箭头北至漠北（lat 45），包围盒应覆盖
    expect(n).toBeGreaterThan(44.5);
  });

  it("special wars carry phase progressions; 安史之乱 has 9 phases", () => {
    const spec = buildWarSpec(
      getChroniclePeriod("tang").wars.find((w) => w.id === "anshi-zhiluan")!,
    );
    expect(spec.phases).toHaveLength(9);
    expect(spec.phases![0].year).toBe("755 十一月");
    const plain = buildWarSpec(getChroniclePeriod("tang").wars.find((w) => w.id === "huangchao")!);
    expect(plain.phases).toBeUndefined();
  });

  it("smoothRing densifies rings into closed organic curves without self-intersection", () => {
    for (const period of CHRONICLE_PERIODS) {
      for (const polity of period.polities) {
        const smooth = smoothRing(polity.territory, { seed: `${period.id}/${polity.id}` });
        expect(smooth.length).toBeGreaterThanOrEqual(polity.territory.length * 5);
        expect(smooth[0]).toEqual(smooth[smooth.length - 1]);
        const crossing = findRingSelfIntersection(smooth);
        expect(crossing, `${period.id}/${polity.id}: ${crossing ?? ""}`).toBeNull();
        for (const [lng, lat] of smooth) {
          expect(lng).toBeGreaterThan(70);
          expect(lng).toBeLessThan(145);
          expect(lat).toBeGreaterThan(14);
          expect(lat).toBeLessThan(58);
        }
      }
    }
  });

  it("buildArrowPolygon produces a closed ring hugging its path", () => {
    const path: [number, number][] = [
      [110.0, 35.0],
      [112.0, 36.0],
      [114.0, 37.0],
    ];
    const ring = buildArrowPolygon(path);
    expect(ring.length).toBeGreaterThanOrEqual(16);
    // 闭合
    expect(ring[0][0]).toBeCloseTo(ring[ring.length - 1][0], 6);
    expect(ring[0][1]).toBeCloseTo(ring[ring.length - 1][1], 6);
    // 所有环点到路径线段的距离都在箭头宽度量级内
    const pointSegDist = (
      [px, py]: [number, number],
      [ax, ay]: [number, number],
      [bx, by]: [number, number],
    ): number => {
      const dx = bx - ax;
      const dy = by - ay;
      const lenSq = dx * dx + dy * dy || 1e-9;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    };
    for (const point of ring) {
      const minDist = Math.min(
        ...path.slice(0, -1).map((seg, i) => pointSegDist(point, seg, path[i + 1])),
      );
      expect(minDist).toBeLessThan(0.95);
    }
    // 短路径（两点）也可用
    const short = buildArrowPolygon([
      [110.0, 35.0],
      [111.0, 35.5],
    ]);
    expect(short.length).toBeGreaterThanOrEqual(8);
  });

  it("parseWarYearRange handles BC, AD spans and slashes", () => {
    expect(parseWarYearRange("约前1600")).toEqual([-1600, -1600]);
    expect(parseWarYearRange("前260")).toEqual([-260, -260]);
    expect(parseWarYearRange("前230 — 前221")).toEqual([-230, -221]);
    expect(parseWarYearRange("前202 — 公元8")).toEqual([-202, 8]);
    expect(parseWarYearRange("前354 / 前341")).toEqual([-354, -341]);
    expect(parseWarYearRange("755 — 763")).toEqual([755, 763]);
    expect(parseWarYearRange("1644")).toEqual([1644, 1644]);
    expect(parseWarYearRange("23")).toEqual([23, 23]);
  });

  it("buildTimeStops sorts periods and wars into a monotonic year axis", () => {
    const stops = buildTimeStops(CHRONICLE_PERIODS);
    expect(stops.length).toBe(20 + CHRONICLE_PERIODS.reduce((sum, p) => sum + p.wars.length, 0));
    for (let i = 1; i < stops.length; i += 1) {
      expect(stops[i].year).toBeGreaterThanOrEqual(stops[i - 1].year);
    }
    expect(stops[0].kind).toBe("period");
    expect(stops[0].label).toBe("夏");
    const qingIndex = CHRONICLE_PERIODS.findIndex((p) => p.id === "qing");
    const qingStops = stops.filter((s) => s.periodIndex === qingIndex);
    expect(qingStops[0].year).toBe(1644);
    expect(stops.some((s) => s.warId === "ru-guan" && s.year === 1644)).toBe(true);
  });

  it("latestWarAtOrBefore picks the most recent campaign for a year", () => {
    const tang = getChroniclePeriod("tang");
    expect(latestWarAtOrBefore(tang, 629)).toBeNull();
    expect(latestWarAtOrBefore(tang, 630)?.id).toBe("mie-dongtujue");
    expect(latestWarAtOrBefore(tang, 900)?.id).toBe("huangchao");
    const past = pastWarsAtOrBefore(tang, 900, "huangchao");
    expect(past.map((w) => w.id)).toEqual(["mie-dongtujue", "anshi-zhiluan"]);
  });

  it("city specs carry polity color; 战国秦 has 栎阳", () => {
    const zhanguo = buildCitySpecs(getChroniclePeriod("zhanguo"));
    expect(zhanguo.length).toBeGreaterThanOrEqual(15);
    const liyang = zhanguo.find((c) => c.name === "栎阳");
    expect(liyang?.polityName).toBe("秦国");
    const qingCities = buildCitySpecs(getChroniclePeriod("qing"));
    expect(qingCities.some((c) => c.name === "广州")).toBe(true);
  });

  it("襄阳 war yields an encircle ring and both sides' battles", () => {
    const xiangyang = getChroniclePeriod("nansong-jin").wars.find((w) => w.id === "xiangyang");
    const spec = buildWarSpec(xiangyang!);
    expect(spec.encircles).toHaveLength(1);
    expect(spec.encircles[0].latlngs[0]).toEqual(
      spec.encircles[0].latlngs[spec.encircles[0].latlngs.length - 1],
    );
    expect(spec.battles.length).toBe(2);
  });

  it("war list mirrors period.wars order and fields", () => {
    const list = buildWarList(getChroniclePeriod("nansong-jin"));
    expect(list.map((w) => w.name)).toEqual(["郾城之战", "采石之战", "襄阳之战", "崖山海战"]);
  });

  it("period bounds wrap all polities with padding; 小邦按数据环取景", () => {
    const qing = getPeriodBounds(getChroniclePeriod("qing"));
    // 清极盛北界外兴安岭以南（54.6 + 0.5 pad），西界帕米尔（74.5 - 0.5）
    expect(qing[0][0]).toBeLessThan(28);
    expect(qing[1][1]).toBeGreaterThan(140);
    const xia = getPeriodBounds(getChroniclePeriod("xia"));
    // 夏为小邦，按数据联合包围盒 + 0.5° 余量取景
    expect(xia[0][0]).toBeCloseTo(33.8 - 0.5, 5);
    expect(xia[1][0]).toBeCloseTo(36.1 + 0.5, 5);
  });

  it("progressive zoom thresholds keep divisions after defenses", () => {
    expect(DEFENSE_ZOOM).toBe(5);
    expect(DIVISION_ZOOM).toBe(6);
    expect(DIVISION_ZOOM).toBeGreaterThan(DEFENSE_ZOOM);
  });
});
