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
 * React 侧只通过这一层操作地图：按月份重建控制图、选战争飞行聚焦、
 * 图层开关、缩放渐进显隐。瓦片源沿用四渡赤水沙盘已验证的
 * Esri World Imagery + 高德中文注记组合。
 *
 * 视觉约定：
 * - 已并入的旧疆域用接管方颜色 + 细虚线绘制，保留旧界但不另立颜色；
 * - 军事箭头宽度按屏幕像素锁定（随缩放重算），主攻粗、次要细；
 * - 所有 tooltip 统一向下、无小箭头、限宽两行，完整内容交给右侧面板。
 */

export type TerritoryLayerKey = "territory" | "capitals" | "divisions" | "defenses" | "wars";

export interface PolityHoverInfo {
  polityId: string;
  name: string;
  color: string;
  note: string;
  kind: "own" | "absorbed";
  fromName?: string;
  sinceYear?: number;
  absorbedNames: string[];
}

export interface WarOpHoverInfo {
  warId: string;
  name: string;
  side: 1 | 2;
  kind: "advance" | "retreat" | "battle" | "encircle";
  note?: string;
}

export interface TerritorySceneCallbacks {
  /** 战争图上要素被点击（战场标记 / 箭头）。 */
  onWarElementClick?: (warId: string) => void;
  /** 政权疆域悬停（完整内容交给右侧面板）。 */
  onPolityHover?: (info: PolityHoverInfo | null) => void;
  /** 军事要素悬停（完整内容交给右侧面板）。 */
  onWarOpHover?: (info: WarOpHoverInfo | null) => void;
  /** 地图初始化完成。 */
  onReady?: () => void;
}

export interface TerritoryScene {
  /** 按月份重建控制图；只有控制状态变化时才需要调用（由 React 侧去重）。 */
  setPeriod(period: ChroniclePeriod, month: number, animate: boolean): void;
  /** 年度推进的战争层：activeWar 画完整部署（箭头/包围圈/战场），pastWars 只留战场标记。 */
  setWarState(activeWar: WarEvent | null, pastWars: readonly WarEvent[], month: number): void;
  setLayerVisible(key: TerritoryLayerKey, visible: boolean): void;
  setModernLabels(visible: boolean): void;
  flyToWar(war: WarEvent): void;
  resetView(): void;
  destroy(): void;
}

const MAP_VIEW = { center: [35.5, 105] as [number, number], zoom: 4.4 };
const ESRI_ATTRIBUTION = "© Esri, Maxar, Earthstar Geographics";
const AMAP_ATTRIBUTION = "© AutoNavi (高德地图)";
/** 左侧编年目录占位（展开时 216px + 间距），避免疆域被菜单压住。 */
const FIT_PADDING_TOP_LEFT: [number, number] = [236, 28];
/** 底部控制条占位。 */
const FIT_PADDING_BOTTOM_RIGHT: [number, number] = [28, 92];
const FIT_MAX_ZOOM = 6.5;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function tooltipHtml(title: string, note?: string, meta?: string): string {
  const titleHtml = `<div class="tch-tip-name">${escapeHtml(title)}</div>`;
  const noteHtml = note ? `<div class="tch-tip-note">${escapeHtml(note)}</div>` : "";
  const metaHtml = meta ? `<div class="tch-tip-meta">${escapeHtml(meta)}</div>` : "";
  return `${titleHtml}${noteHtml}${metaHtml}`;
}

function polityLabelIcon(name: string, color: string, absorbed: boolean): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-polity-label${absorbed ? " is-absorbed" : ""}" style="--polity-color:${color}">${escapeHtml(name)}</span>`,
  });
}

function capitalIcon(
  color: string,
  kind: "main" | "secondary",
  name: string,
  changed: boolean,
): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-capital ${kind === "main" ? "is-main" : "is-secondary"}${changed ? " is-changed" : ""}" style="--polity-color:${color}"><i>★</i>${escapeHtml(name)}</span>`,
  });
}

function coreRegionIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-core-label">${escapeHtml(name)}</span>`,
  });
}

function cityIcon(name: string, color: string, changed: boolean): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-city${changed ? " is-changed" : ""}" style="--polity-color:${color}"><i></i>${escapeHtml(name)}</span>`,
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

function arrowTipIcon(side: 1 | 2, angleDeg: number, priority: 1 | 2): L.DivIcon {
  return L.divIcon({
    className: "tch-label-anchor",
    html: `<span class="tch-arrow-tip is-side${side}${priority === 2 ? " is-secondary" : ""}" style="transform:translate(-50%,-50%) rotate(${angleDeg.toFixed(1)}deg)"></span>`,
  });
}

/** 当前缩放级别下 1° 经度对应的屏幕像素。 */
function pxPerDegree(map: L.Map): number {
  return (256 * 2 ** map.getZoom()) / 360;
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
  // 战争要素单独一层，压在同区划/疆域之上（但仍在都城等 marker 之下）。
  map.createPane("tchWarPane");
  const warPane = map.getPane("tchWarPane");
  if (warPane) warPane.style.zIndex = "450";
  const warGroup = L.layerGroup().addTo(map);

  const layerVisible: Record<TerritoryLayerKey, boolean> = {
    territory: true,
    capitals: true,
    divisions: true,
    defenses: true,
    wars: true,
  };
  let currentPeriod: ChroniclePeriod | null = null;
  let currentMonth = 0;
  let currentActiveWar: WarEvent | null = null;
  let currentPastWars: readonly WarEvent[] = [];
  let hasWarContent = false;

  function applyGroupVisibility(): void {
    const zoom = map.getZoom();
    defenseGroup[layerVisible.defenses && zoom >= DEFENSE_ZOOM ? "addTo" : "removeFrom"](map);
    divisionGroup[layerVisible.divisions && zoom >= DIVISION_ZOOM ? "addTo" : "removeFrom"](map);
    baseGroup[layerVisible.territory ? "addTo" : "removeFrom"](map);
    warGroup[layerVisible.wars && hasWarContent ? "addTo" : "removeFrom"](map);
  }

  function renderWarState(
    activeWar: WarEvent | null,
    pastWars: readonly WarEvent[],
    month: number,
  ): void {
    currentActiveWar = activeWar;
    currentPastWars = pastWars;
    currentMonth = month;
    warGroup.clearLayers();
    // 历史战场：淡化圆点累积显示，标记「打过哪里」
    for (const past of pastWars) {
      const spec = buildWarSpec(past, { pxPerDegree: pxPerDegree(map) });
      for (const battle of spec.battles) {
        const marker = L.marker(battle.latlng, {
          icon: battleIcon(battle.side),
          opacity: 0.42,
          interactive: false,
        });
        marker.bindTooltip(tooltipHtml(`${battle.name}（${past.year}）`, undefined, "历史战场"), {
          className: "tch-tip",
          direction: "bottom",
          offset: [0, 10],
          opacity: 1,
        });
        warGroup.addLayer(marker);
      }
    }
    if (!activeWar) {
      hasWarContent = pastWars.length > 0;
      applyGroupVisibility();
      return;
    }
    hasWarContent = true;
    const spec = buildWarSpec(activeWar, {
      pxPerDegree: pxPerDegree(map),
      primaryWidthPx: 12,
      secondaryWidthPx: 8,
    });
    // 军事推进箭头：advance 为锥形箭杆 + 倒钩箭头的多边形；retreat 为虚线撤退线
    for (const arrow of spec.arrows) {
      const color = arrow.side === 1 ? "#ff6b52" : "#59a7ff";
      const primary = arrow.priority === 1;
      if (arrow.kind === "advance" && arrow.ring) {
        const polygon = L.polygon(arrow.ring, {
          pane: "tchWarPane",
          color,
          weight: primary ? 1.6 : 1.1,
          opacity: primary ? 0.95 : 0.78,
          fillColor: color,
          fillOpacity: primary ? 0.82 : 0.62,
          className: primary ? "tch-arrow tch-arrow-primary" : "tch-arrow tch-arrow-secondary",
        });
        polygon.bindTooltip(tooltipHtml(arrow.name, undefined, primary ? "主攻方向" : "次要方向"), {
          className: "tch-tip",
          sticky: true,
          direction: "bottom",
          offset: [0, 10],
          opacity: 1,
        });
        polygon.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
        polygon.on("mouseover", () =>
          callbacks.onWarOpHover?.({
            warId: activeWar.id,
            name: arrow.name,
            side: arrow.side,
            kind: "advance",
            note: arrow.note,
          }),
        );
        polygon.on("mouseout", () => callbacks.onWarOpHover?.(null));
        warGroup.addLayer(polygon);
      } else {
        const line = L.polyline(arrow.path, {
          pane: "tchWarPane",
          color,
          weight: primary ? 2.6 : 1.7,
          opacity: primary ? 0.9 : 0.72,
          dashArray: arrow.kind === "retreat" ? "7 6" : undefined,
          className: "tch-arrow tch-arrow-line",
        });
        line.bindTooltip(tooltipHtml(arrow.name, undefined, "撤退路线"), {
          className: "tch-tip",
          direction: "bottom",
          offset: [0, 10],
          opacity: 1,
        });
        line.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
        line.on("mouseover", () =>
          callbacks.onWarOpHover?.({
            warId: activeWar.id,
            name: arrow.name,
            side: arrow.side,
            kind: "retreat",
            note: arrow.note,
          }),
        );
        line.on("mouseout", () => callbacks.onWarOpHover?.(null));
        warGroup.addLayer(line);
        const tip = L.marker(arrow.tipAt, {
          icon: arrowTipIcon(arrow.side, arrow.tipAngleDeg, arrow.priority),
          interactive: false,
        });
        warGroup.addLayer(tip);
      }
    }
    for (const encircle of spec.encircles) {
      const ring = L.polygon(encircle.latlngs, {
        pane: "tchWarPane",
        color: "#ff6b52",
        weight: 1.6,
        fill: false,
        dashArray: "6 6",
        opacity: 0.85,
        className: "tch-encircle",
      });
      ring.bindTooltip(tooltipHtml(encircle.name, undefined, "包围圈"), {
        className: "tch-tip",
        direction: "bottom",
        offset: [0, 10],
        opacity: 1,
      });
      ring.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
      ring.on("mouseover", () =>
        callbacks.onWarOpHover?.({
          warId: activeWar.id,
          name: encircle.name,
          side: 1,
          kind: "encircle",
        }),
      );
      ring.on("mouseout", () => callbacks.onWarOpHover?.(null));
      warGroup.addLayer(ring);
    }
    for (const battle of spec.battles) {
      const marker = L.marker(battle.latlng, { icon: battleIcon(battle.side) });
      marker.bindTooltip(tooltipHtml(battle.name, undefined, "战场"), {
        className: "tch-tip",
        direction: "bottom",
        offset: [0, 8],
        opacity: 1,
      });
      marker.on("click", () => callbacks.onWarElementClick?.(activeWar.id));
      marker.on("mouseover", () =>
        callbacks.onWarOpHover?.({
          warId: activeWar.id,
          name: battle.name,
          side: battle.side,
          kind: "battle",
          note: battle.note,
        }),
      );
      marker.on("mouseout", () => callbacks.onWarOpHover?.(null));
      warGroup.addLayer(marker);
    }
    applyGroupVisibility();
  }

  function renderPeriod(period: ChroniclePeriod, month: number, animate: boolean): void {
    baseGroup.clearLayers();
    defenseGroup.clearLayers();
    divisionGroup.clearLayers();

    for (const polity of buildPolitySpecs(period, month)) {
      for (const ring of polity.rings) {
        const absorbed = ring.kind === "absorbed";
        const polygon = L.polygon(ring.ring, {
          color: polity.color,
          weight: absorbed ? 1 : 2.2,
          opacity: absorbed ? 0.55 : 0.95,
          fillColor: polity.color,
          fillOpacity: absorbed ? 0.2 : 0.26,
          dashArray: absorbed ? "3 5" : undefined,
          className: absorbed ? "tch-territory is-absorbed" : "tch-territory",
        });
        const hoverInfo: PolityHoverInfo = {
          polityId: polity.id,
          name: absorbed && ring.fromName ? `${ring.fromName}旧疆` : polity.name,
          color: polity.color,
          note: absorbed
            ? `已并入${polity.name}${ring.sinceYear ? `（${formatYear(ring.sinceYear)}）` : ""}`
            : polity.note,
          kind: ring.kind,
          fromName: ring.fromName,
          sinceYear: ring.sinceYear,
          absorbedNames: polity.absorbedNames,
        };
        polygon.bindTooltip(
          tooltipHtml(
            hoverInfo.name,
            clampText(hoverInfo.note, 48),
            absorbed ? `旧界 · 现属${polity.name}` : "点击右侧查看完整说明",
          ),
          {
            className: "tch-tip tch-tip-polity",
            sticky: true,
            direction: "bottom",
            opacity: 1,
          },
        );
        polygon.on("mouseover", () => callbacks.onPolityHover?.(hoverInfo));
        polygon.on("mouseout", () => callbacks.onPolityHover?.(null));
        baseGroup.addLayer(polygon);
        // 并入的旧疆在环心补一枚小号标签：写旧政权名，颜色随接管方。
        if (absorbed) {
          const label = L.marker(bboxCenterLatLng(ring.ring), {
            icon: polityLabelIcon(
              ring.fromName ? `${ring.fromName}旧疆` : polity.name,
              polity.color,
              true,
            ),
            interactive: false,
          });
          baseGroup.addLayer(label);
        }
      }
      if (polity.looseRing) {
        const loose = L.polygon(polity.looseRing, {
          color: polity.color,
          weight: 1.3,
          opacity: 0.5,
          fill: false,
          dashArray: "5 7",
          interactive: false,
        });
        baseGroup.addLayer(loose);
      }
      const label = L.marker(polity.labelAt, {
        icon: polityLabelIcon(polity.name, polity.color, false),
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
      label.bindTooltip(tooltipHtml(core.name, clampText(core.note, 42), "核心地区"), {
        className: "tch-tip",
        direction: "bottom",
        opacity: 1,
      });
      baseGroup.addLayer(label);
    }

    for (const capital of buildCapitalSpecs(period, month)) {
      const marker = L.marker(capital.latlng, {
        icon: capitalIcon(capital.color, capital.kind, capital.name, capital.changed),
      });
      const kindLabel = capital.kind === "main" ? "都城" : "陪都";
      marker.bindTooltip(
        tooltipHtml(
          `${capital.name} · ${capital.polityName}`,
          clampText(capital.note ?? "", 42),
          capital.changed ? `${kindLabel} · 原属${capital.originName}` : kindLabel,
        ),
        { className: "tch-tip", direction: "bottom", offset: [0, 8], opacity: 1 },
      );
      baseGroup.addLayer(marker);
    }

    for (const defense of buildDefenseSpecs(period)) {
      if (defense.line) {
        const line = L.polyline(defense.line, {
          color: "#ffb347",
          weight: 2.2,
          opacity: 0.8,
          dashArray: defense.kind === "长城" || defense.kind === "边墙" ? "8 5" : undefined,
        });
        line.bindTooltip(
          tooltipHtml(`${defense.name} · ${defense.kind}`, clampText(defense.note, 42)),
          {
            className: "tch-tip",
            sticky: true,
            direction: "bottom",
            opacity: 1,
          },
        );
        defenseGroup.addLayer(line);
      } else if (defense.point) {
        const marker = L.marker(defense.point, { icon: defensePointIcon(defense.name) });
        marker.bindTooltip(
          tooltipHtml(`${defense.name} · ${defense.kind}`, clampText(defense.note, 42)),
          { className: "tch-tip", direction: "bottom", offset: [0, 8], opacity: 1 },
        );
        defenseGroup.addLayer(marker);
      }
    }

    for (const city of buildCitySpecs(period, month)) {
      const marker = L.marker(city.latlng, {
        icon: cityIcon(city.name, city.color, city.changed),
      });
      marker.bindTooltip(
        tooltipHtml(
          `${city.name} · ${city.polityName}`,
          clampText(city.note ?? "", 42),
          city.changed ? `原属${city.originName}` : undefined,
        ),
        { className: "tch-tip", direction: "bottom", offset: [0, 8], opacity: 1 },
      );
      defenseGroup.addLayer(marker);
    }

    for (const division of buildDivisionSpecs(period)) {
      const marker = L.marker(division.latlng, { icon: divisionIcon(division.name) });
      marker.bindTooltip(
        tooltipHtml(`${division.name} · ${division.kind}`, clampText(division.note, 42)),
        { className: "tch-tip", direction: "bottom", offset: [0, 8], opacity: 1 },
      );
      divisionGroup.addLayer(marker);
    }

    applyGroupVisibility();

    const bounds = getPeriodBounds(period, month);
    if (animate) {
      map.flyToBounds(bounds, {
        paddingTopLeft: FIT_PADDING_TOP_LEFT,
        paddingBottomRight: FIT_PADDING_BOTTOM_RIGHT,
        maxZoom: FIT_MAX_ZOOM,
        duration: 0.8,
      });
    } else {
      map.fitBounds(bounds, {
        paddingTopLeft: FIT_PADDING_TOP_LEFT,
        paddingBottomRight: FIT_PADDING_BOTTOM_RIGHT,
        maxZoom: FIT_MAX_ZOOM,
        animate: false,
      });
    }
  }

  map.on("zoomend", () => {
    applyGroupVisibility();
    // 缩放后重算箭头屏幕宽度（避免放大成巨箭）
    if (hasWarContent) {
      renderWarState(currentActiveWar, currentPastWars, currentMonth);
    }
  });

  callbacks.onReady?.();

  return {
    setPeriod(period, month, animate) {
      currentPeriod = period;
      currentMonth = month;
      renderPeriod(period, month, animate);
    },
    setWarState(activeWar, pastWars, month) {
      renderWarState(activeWar, pastWars, month);
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
      const spec = buildWarSpec(war, { pxPerDegree: pxPerDegree(map) });
      map.flyToBounds(spec.bounds, {
        paddingTopLeft: FIT_PADDING_TOP_LEFT,
        paddingBottomRight: [360, 120],
        maxZoom: 8,
        duration: 0.8,
      });
    },
    resetView() {
      if (currentPeriod) {
        map.flyToBounds(getPeriodBounds(currentPeriod, currentMonth), {
          paddingTopLeft: FIT_PADDING_TOP_LEFT,
          paddingBottomRight: FIT_PADDING_BOTTOM_RIGHT,
          maxZoom: FIT_MAX_ZOOM,
          duration: 0.7,
        });
      }
    },
    destroy() {
      map.off("zoomend");
      map.remove();
    },
  };
}

function formatYear(year: number): string {
  return year < 0 ? `前${-year}` : `${year}`;
}

/** 环的包围盒中心（Leaflet [lat, lng]）。 */
function bboxCenterLatLng(ring: Array<[number, number]>): [number, number] {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const [lat, lng] of ring) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}
