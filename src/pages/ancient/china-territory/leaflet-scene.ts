import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  buildCapitalSpecs,
  buildCitySpecs,
  buildCoreRegionSpecs,
  buildDefenseSpecs,
  buildDivisionSpecs,
  buildPolitySpecs,
  buildWarSpec,
  DEFENSE_ZOOM,
  DIVISION_ZOOM,
  getPeriodBounds,
} from "./territory-overlays";
import type { ChroniclePeriod, WarEvent } from "./types";

/**
 * Leaflet 场景层（命令式，jsdom 无真实瓦片环境，coverage 排除）。
 * React 侧只通过这一层操作地图：切期重建覆盖层、选战争飞行聚焦、
 * 图层开关、缩放渐进显隐。瓦片源沿用四渡赤水沙盘已验证的
 * Esri World Imagery + 高德中文注记组合。
 */

export type TerritoryLayerKey = "territory" | "capitals" | "divisions" | "defenses" | "wars";

export interface TerritorySceneCallbacks {
  /** 战争图上要素被点击（战场标记 / 箭头）。 */
  onWarElementClick?: (warId: string) => void;
  /** 地图初始化完成。 */
  onReady?: () => void;
}

export interface TerritoryScene {
  setPeriod(period: ChroniclePeriod, animate: boolean): void;
  /** 年度推进的战争层：activeWar 画完整部署（箭头/包围圈/战场），pastWars 只留战场标记。 */
  setWarState(activeWar: WarEvent | null, pastWars: readonly WarEvent[]): void;
  setLayerVisible(key: TerritoryLayerKey, visible: boolean): void;
  setModernLabels(visible: boolean): void;
  flyToWar(war: WarEvent): void;
  resetView(): void;
  destroy(): void;
}

const MAP_VIEW = { center: [35.5, 105] as [number, number], zoom: 4.4 };
const ESRI_ATTRIBUTION = "© Esri, Maxar, Earthstar Geographics";
const AMAP_ATTRIBUTION = "© AutoNavi (高德地图)";
const BOUNDS_PADDING: [number, number] = [24, 24];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tooltipHtml(title: string, note?: string): string {
  const titleHtml = `<div class="tch-tip-name">${escapeHtml(title)}</div>`;
  return note ? `${titleHtml}<div class="tch-tip-note">${escapeHtml(note)}</div>` : titleHtml;
}

function polityLabelIcon(name: string, color: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-polity-label" style="--polity-color:${color}">${escapeHtml(name)}</span>`,
  });
}

function capitalIcon(color: string, kind: "main" | "secondary", name: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-capital ${kind === "main" ? "is-main" : "is-secondary"}" style="--polity-color:${color}"><i>★</i>${escapeHtml(name)}</span>`,
  });
}

function coreRegionIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-core-label">${escapeHtml(name)}</span>`,
  });
}

function cityIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-city"><i></i>${escapeHtml(name)}</span>`,
  });
}

function divisionIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-division"><i></i>${escapeHtml(name)}</span>`,
  });
}

function defensePointIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-defense-point"><i>▲</i>${escapeHtml(name)}</span>`,
  });
}

function battleIcon(side: 1 | 2): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-battle is-side${side}"><i>⚔</i></span>`,
  });
}

function arrowTipIcon(side: 1 | 2, angleDeg: number): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-arrow-tip is-side${side}" style="transform:translate(-50%,-50%) rotate(${angleDeg.toFixed(1)}deg)"></span>`,
  });
}

export function createTerritoryScene(
  container: HTMLElement,
  callbacks: TerritorySceneCallbacks,
): TerritoryScene {
  const map = L.map(container, {
    center: MAP_VIEW.center,
    zoom: MAP_VIEW.zoom,
    minZoom: 3,
    maxZoom: 12,
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true,
    zoomSnap: 0.25,
  });
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 18,
      attribution: ESRI_ATTRIBUTION,
    },
  ).addTo(map);
  const modernLabels = L.tileLayer(
    "https://webst0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    { maxZoom: 18, subdomains: ["1", "2", "3", "4"], opacity: 0.85, attribution: AMAP_ATTRIBUTION },
  ).addTo(map);

  const baseGroup = L.layerGroup().addTo(map);
  const defenseGroup = L.layerGroup().addTo(map);
  const divisionGroup = L.layerGroup().addTo(map);
  const warGroup = L.layerGroup().addTo(map);

  const layerVisible: Record<TerritoryLayerKey, boolean> = {
    territory: true,
    capitals: true,
    divisions: true,
    defenses: true,
    wars: true,
  };
  let currentPeriod: ChroniclePeriod | null = null;
  let hasWarContent = false;

  function applyGroupVisibility(): void {
    const zoom = map.getZoom();
    defenseGroup[layerVisible.defenses && zoom >= DEFENSE_ZOOM ? "addTo" : "removeFrom"](map);
    divisionGroup[layerVisible.divisions && zoom >= DIVISION_ZOOM ? "addTo" : "removeFrom"](map);
    baseGroup[layerVisible.territory ? "addTo" : "removeFrom"](map);
    warGroup[layerVisible.wars && hasWarContent ? "addTo" : "removeFrom"](map);
  }

  map.on("zoomend", applyGroupVisibility);

  function renderWarState(activeWar: WarEvent | null, pastWars: readonly WarEvent[]): void {
    warGroup.clearLayers();
    // 历史战场：淡化圆点累积显示，标记「打过哪里」
    for (const past of pastWars) {
      const spec = buildWarSpec(past);
      for (const battle of spec.battles) {
        const marker = L.marker(battle.latlng, {
          icon: battleIcon(battle.side),
          opacity: 0.45,
        });
        marker.bindTooltip(tooltipHtml(`${battle.name}（${past.year}）`), {
          className: "tch-tip",
          direction: "top",
          offset: [0, -10],
        });
        marker.on("click", () => callbacks.onWarElementClick?.(past.id));
        warGroup.addLayer(marker);
      }
    }
    if (!activeWar) {
      hasWarContent = false;
      applyGroupVisibility();
      return;
    }
    hasWarContent = true;
    const spec = buildWarSpec(activeWar);
    // 军事推进箭头：advance 为锥形箭杆 + 倒钩箭头的多边形；retreat 为虚线撤退线
    for (const arrow of spec.arrows) {
      const color = arrow.side === 1 ? "#ff6b52" : "#59a7ff";
      if (arrow.kind === "advance" && arrow.ring) {
        const polygon = L.polygon(arrow.ring, {
          color,
          weight: 1.5,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: 0.8,
        });
        polygon.bindTooltip(tooltipHtml(arrow.name), { className: "tch-tip", sticky: true });
        polygon.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
        warGroup.addLayer(polygon);
      } else {
        const line = L.polyline(arrow.path, {
          color,
          weight: 2.5,
          opacity: 0.9,
          dashArray: arrow.kind === "retreat" ? "7 6" : undefined,
        });
        line.bindTooltip(tooltipHtml(arrow.name), { className: "tch-tip", direction: "top" });
        line.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
        warGroup.addLayer(line);
        const tip = L.marker(arrow.tipAt, {
          icon: arrowTipIcon(arrow.side, arrow.tipAngleDeg),
          interactive: false,
        });
        warGroup.addLayer(tip);
      }
    }
    for (const encircle of spec.encircles) {
      const ring = L.polygon(encircle.latlngs, {
        color: "#ff6b52",
        weight: 2,
        fill: false,
        dashArray: "6 6",
        opacity: 0.9,
      });
      ring.bindTooltip(tooltipHtml(encircle.name), { className: "tch-tip", direction: "top" });
      ring.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
      warGroup.addLayer(ring);
    }
    for (const battle of spec.battles) {
      const marker = L.marker(battle.latlng, { icon: battleIcon(battle.side) });
      marker.bindTooltip(tooltipHtml(battle.name), {
        className: "tch-tip",
        direction: "top",
        offset: [0, -10],
      });
      marker.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
      warGroup.addLayer(marker);
    }
    applyGroupVisibility();
  }

  function renderPeriod(period: ChroniclePeriod, animate: boolean): void {
    baseGroup.clearLayers();
    defenseGroup.clearLayers();
    divisionGroup.clearLayers();

    for (const polity of buildPolitySpecs(period)) {
      const polygon = L.polygon(polity.ring, {
        color: polity.color,
        weight: 2.2,
        opacity: 0.95,
        fillColor: polity.color,
        fillOpacity: 0.26,
      });
      polygon.bindTooltip(tooltipHtml(polity.name, polity.note), {
        className: "tch-tip",
        sticky: true,
      });
      baseGroup.addLayer(polygon);
      if (polity.looseRing) {
        const loose = L.polygon(polity.looseRing, {
          color: polity.color,
          weight: 1.5,
          opacity: 0.55,
          fill: false,
          dashArray: "5 7",
          interactive: false,
        });
        baseGroup.addLayer(loose);
      }
      const label = L.marker(polity.labelAt, {
        icon: polityLabelIcon(polity.name, polity.color),
        interactive: false,
      });
      baseGroup.addLayer(label);
    }

    for (const core of buildCoreRegionSpecs(period)) {
      if (core.ring) {
        const polygon = L.polygon(core.ring, {
          color: "#f5c66b",
          weight: 1,
          opacity: 0.5,
          fillColor: "#f5c66b",
          fillOpacity: 0.1,
          interactive: false,
        });
        baseGroup.addLayer(polygon);
      }
      const label = L.marker(core.latlng, { icon: coreRegionIcon(core.name) });
      label.bindTooltip(tooltipHtml(core.name, core.note), {
        className: "tch-tip",
        direction: "top",
      });
      baseGroup.addLayer(label);
    }

    for (const capital of buildCapitalSpecs(period)) {
      const marker = L.marker(capital.latlng, {
        icon: capitalIcon(capital.color, capital.kind, capital.name),
      });
      const kindLabel = capital.kind === "main" ? "都城" : "陪都";
      marker.bindTooltip(
        tooltipHtml(
          `${capital.name} · ${capital.polityName}`,
          `${kindLabel}${capital.note ? `｜${capital.note}` : ""}`,
        ),
        { className: "tch-tip", direction: "top", offset: [0, -10] },
      );
      baseGroup.addLayer(marker);
    }

    for (const defense of buildDefenseSpecs(period)) {
      if (defense.line) {
        const line = L.polyline(defense.line, {
          color: "#ffb347",
          weight: 2.5,
          opacity: 0.85,
          dashArray: defense.kind === "长城" || defense.kind === "边墙" ? "8 5" : undefined,
        });
        line.bindTooltip(tooltipHtml(`${defense.name} · ${defense.kind}`, defense.note), {
          className: "tch-tip",
          sticky: true,
        });
        defenseGroup.addLayer(line);
      } else if (defense.point) {
        const marker = L.marker(defense.point, { icon: defensePointIcon(defense.name) });
        marker.bindTooltip(tooltipHtml(`${defense.name} · ${defense.kind}`, defense.note), {
          className: "tch-tip",
          direction: "top",
          offset: [0, -8],
        });
        defenseGroup.addLayer(marker);
      }
    }

    for (const city of buildCitySpecs(period)) {
      const marker = L.marker(city.latlng, { icon: cityIcon(city.name) });
      marker.bindTooltip(tooltipHtml(`${city.name} · ${city.polityName}`, city.note), {
        className: "tch-tip",
        direction: "top",
        offset: [0, -8],
      });
      defenseGroup.addLayer(marker);
    }

    for (const division of buildDivisionSpecs(period)) {
      const marker = L.marker(division.latlng, { icon: divisionIcon(division.name) });
      marker.bindTooltip(tooltipHtml(`${division.name} · ${division.kind}`, division.note), {
        className: "tch-tip",
        direction: "top",
        offset: [0, -8],
      });
      divisionGroup.addLayer(marker);
    }

    renderWarState(null, []);
    applyGroupVisibility();

    const bounds = getPeriodBounds(period);
    if (animate) {
      map.flyToBounds(bounds, { padding: BOUNDS_PADDING, duration: 0.9 });
    } else {
      map.fitBounds(bounds, { padding: BOUNDS_PADDING, animate: false });
    }
  }

  callbacks.onReady?.();

  return {
    setPeriod(period, animate) {
      currentPeriod = period;
      hasWarContent = false;
      renderPeriod(period, animate);
    },
    setWarState(activeWar, pastWars) {
      renderWarState(activeWar, pastWars);
    },
    setLayerVisible(key, visible) {
      layerVisible[key] = visible;
      applyGroupVisibility();
    },
    setModernLabels(visible) {
      if (visible) {
        modernLabels.addTo(map);
      } else {
        map.removeLayer(modernLabels);
      }
    },
    flyToWar(war) {
      const spec = buildWarSpec(war);
      map.flyToBounds(spec.bounds, { padding: BOUNDS_PADDING, duration: 0.8 });
    },
    resetView() {
      if (currentPeriod) {
        map.flyToBounds(getPeriodBounds(currentPeriod), { padding: BOUNDS_PADDING, duration: 0.7 });
      }
    },
    destroy() {
      map.off("zoomend", applyGroupVisibility);
      map.remove();
    },
  };
}
