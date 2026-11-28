import { describe, expect, it } from "vitest";

import { CHRONICLE_PERIODS, getChroniclePeriod } from "./registry";
import {
  buildCapitalSpecs,
  buildCoreRegionSpecs,
  buildDefenseSpecs,
  buildDivisionSpecs,
  buildPolitySpecs,
  buildWarList,
  buildWarSpec,
  DEFENSE_ZOOM,
  DIVISION_ZOOM,
  getPeriodBounds,
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

  it("war spec derives arrows with tips, battles, encircles and a padded bounds box", () => {
    const ans = getChroniclePeriod("tang").wars.find((w) => w.id === "anshi-zhiluan");
    expect(ans).toBeDefined();
    const spec = buildWarSpec(ans!);
    expect(spec.arrows.length).toBeGreaterThanOrEqual(2);
    for (const arrow of spec.arrows) {
      expect(arrow.latlngs.length).toBeGreaterThanOrEqual(2);
      expect(Number.isFinite(arrow.tipAngleDeg)).toBe(true);
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
