import { useCallback, useMemo } from "react";

import { cn } from "../../../lib/utils";
import { type FocusRegion, getAtlasFocus, regionOfPoints } from "./atlas-focus";
import { ATLAS_ITEMS, type AtlasLayerId, getVisibleItems } from "./atlas-items";
import { AtlasMap } from "./atlas-map";
import { getDynastyOutline } from "./dynasty-overlay";
import { getDynastyTerritory } from "./dynasty-territories";
import { useMapView } from "./map-view";
import type { AtlasDynastyId } from "./types";

export interface MapStageProps {
  /** 是否播放画线、流动光点与脉冲。 */
  animated: boolean;
  /** 当前朝代断面；null 表示只画现代疆域底图。 */
  dynasty: AtlasDynastyId | null;
  /** 悬停中的条目 id。 */
  hoveredId: string | null;
  layer: AtlasLayerId;
  /** 悬停 / 点选标注回调。 */
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  /** 「回到全览」：清空选中与朝代（状态在页面层）。 */
  onResetView: () => void;
  onToggleAnimated: () => void;
  /** 选中的条目 id；null 表示全览。 */
  selectedId: string | null;
}

type LegendSymbolId = "solid" | "hollow" | "square" | "defense" | "line" | "area";

const LEGEND: readonly { label: string; symbol: LegendSymbolId }[] = [
  { label: "都城 / 终点", symbol: "solid" },
  { label: "节点 / 途经地", symbol: "hollow" },
  { label: "治所方印", symbol: "square" },
  { label: "防御范围（示意）", symbol: "defense" },
  { label: "当朝疆域（示意）", symbol: "area" },
  { label: "引导线标注", symbol: "line" },
];

/** 图例只列当前图层真正出现的符号；行高固定，切换图层不会造成位移。 */
function legendSymbols(
  layer: AtlasLayerId,
  dynasty: AtlasDynastyId | null,
): readonly LegendSymbolId[] {
  const base: LegendSymbolId[] = [];
  if (dynasty) base.push("area");
  if (layer === "frontier") base.push("square", "defense", "line");
  else if (layer !== "all") base.push("solid", "hollow", "line");
  else base.push("solid", "hollow", "square", "defense", "line");
  return base;
}

function LegendSymbol({ symbol }: { symbol: LegendSymbolId }) {
  if (symbol === "area") {
    return (
      <svg aria-hidden="true" height="12" viewBox="0 0 12 12" width="12">
        <path
          d="M2 5 Q2 2 6 2 Q10 2 10 6 Q10 10 6 10 Q2 10 2 5 Z"
          fill="hsl(var(--vermillion) / 0.12)"
          stroke="hsl(var(--vermillion) / 0.7)"
          strokeDasharray="1.4 1.1"
          strokeWidth="0.9"
        />
      </svg>
    );
  }
  if (symbol === "defense") {
    return (
      <svg aria-hidden="true" height="12" viewBox="0 0 12 12" width="12">
        <circle
          cx="6"
          cy="6"
          fill="hsl(var(--ochre) / 0.08)"
          r="4.6"
          stroke="hsl(var(--ochre) / 0.7)"
          strokeDasharray="1.4 1.1"
          strokeWidth="0.9"
        />
      </svg>
    );
  }
  if (symbol === "line") {
    return (
      <svg aria-hidden="true" height="8" viewBox="0 0 22 8" width="22">
        <path d="M0,4 L22,4" fill="none" stroke="hsl(var(--ink) / 0.5)" strokeWidth="1" />
        <circle cx="1" cy="4" fill="hsl(var(--vermillion))" r="1.8" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
      {symbol === "square" ? (
        <rect fill="hsl(var(--ochre))" height="7" width="7" x="1.5" y="1.5" />
      ) : (
        <circle
          cx="5"
          cy="5"
          fill={symbol === "solid" ? "hsl(var(--vermillion))" : "hsl(var(--paper))"}
          r="3.4"
          stroke="hsl(var(--vermillion))"
          strokeWidth="1.4"
        />
      )}
    </svg>
  );
}

function MapControlButton({
  disabled,
  label,
  onClick,
  children,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-paper/95 text-ink",
        "shadow-[0_1px_6px_hsl(var(--ink)/0.1)] transition-colors",
        "hover:border-vermillion/50 hover:text-vermillion",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        disabled && "cursor-default opacity-40 hover:border-ink/15 hover:text-ink",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * 地图舞台：容器测量、视野状态机（补间 + 滚轮 / 拖拽 / 双指）、聚焦卡、
 * 缩放控件与图例条都收在这里——视野逐帧更新时只有这一棵子树重渲染，
 * 页头、菜单与详情卡不会跟着抖。
 */
export function MapStage({
  animated,
  dynasty,
  hoveredId,
  layer,
  onHover,
  onSelect,
  onResetView,
  onToggleAnimated,
  selectedId,
}: MapStageProps) {
  const selected = useMemo(
    () => ATLAS_ITEMS.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  );
  const dynastyTerritory = dynasty ? getDynastyTerritory(dynasty) : null;

  // 聚焦时只画当前朝代 / 选中条目的标注，不再把 22 条全糊在一张放大的图上。
  const visibleItems = useMemo(() => {
    const byLayer = getVisibleItems(layer);
    if (selected) return byLayer.filter((item) => item.id === selected.id);
    if (dynasty) return byLayer.filter((item) => item.dynastyId === dynasty);
    return byLayer;
  }, [dynasty, layer, selected]);

  const focusRegion = useMemo<FocusRegion | null>(() => {
    if (selected) return regionOfPoints(selected.points.map((point) => point.point));
    if (!dynastyTerritory) return null;
    const { bounds } = getDynastyOutline(dynastyTerritory);
    return { x0: bounds.x0, x1: bounds.x1, y0: bounds.y0, y1: bounds.y1 };
  }, [dynastyTerritory, selected]);

  // 聚焦视野按容器实测比例生成：放大后铺满可视区，焦点正好落在正中央。
  // 视野状态机内部的 target 依赖它实测的比例，所以以回调形式交给 useMapView。
  const {
    frameRef,
    interactionProps,
    panning,
    resetView,
    target: focusTarget,
    view,
    zoomStep,
  } = useMapView(
    useCallback(
      (measuredRatio: number) =>
        getAtlasFocus({
          maxZoom: selected ? 2.2 : 1.8,
          padding: selected ? 12 : 9,
          ratio: measuredRatio,
          region: focusRegion,
        }),
      [focusRegion, selected],
    ),
  );
  const zoom = Math.round(view.zoom * 10) / 10;
  const territory = dynastyTerritory;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/10 bg-paper/70 p-2 sm:p-3">
      {/* 地图列：相对定位容器恒高，浮层用绝对定位，切换时没有布局位移 */}
      <div
        className={cn("relative min-h-0 flex-1", panning && "cursor-grabbing")}
        ref={frameRef}
        {...interactionProps}
      >
        <AtlasMap
          animated={animated}
          dynasty={dynasty}
          hoveredId={hoveredId}
          items={visibleItems}
          layer={layer}
          liveView={view}
          onHover={onHover}
          onSelect={onSelect}
          panning={panning}
          selectedId={selectedId}
          view={focusTarget}
        />

        {/* 固定尺寸的视图说明：只放不随 viewBox 缩放的控件信息（标题 + 倍率 + 复位）；
            都城、主要城市与史料出处统一由下方固定详情卡承载，避免重复与看不清。 */}
        {focusTarget.focused ? (
          <div className="pointer-events-none absolute top-3 right-3 z-10 flex flex-col items-end gap-1 rounded-xl border border-vermillion/25 bg-paper/95 px-3 py-2 shadow-[0_2px_12px_hsl(var(--ink)/0.08)]">
            <p className="font-kai text-sm font-bold text-vermillion">
              {selected ? selected.title : `${territory?.label ?? ""} · 疆域示意`}
            </p>
            <p className="font-mono-tech text-[0.7rem] text-muted-foreground">
              {selected ? selected.period : territory?.period} · 放大 {zoom}×
            </p>
            <p className="font-body text-[0.7rem] leading-relaxed text-muted-foreground">
              示意范围非实测边界 · 底图为现今疆域
            </p>
            <button
              className="pointer-events-auto mt-0.5 rounded-full border border-vermillion/40 bg-vermillion/10 px-2.5 py-0.5 font-body text-xs text-vermillion transition-colors hover:bg-vermillion/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={onResetView}
              type="button"
            >
              回到全览
            </button>
          </div>
        ) : null}

        {/* 缩放控件：滚轮 / 拖拽之外常驻的可发现入口 */}
        <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1.5">
          <MapControlButton
            disabled={view.zoom >= 4.9}
            label="放大地图"
            onClick={() => zoomStep(1.6)}
          >
            <svg aria-hidden="true" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M7 2.5 V11.5 M2.5 7 H11.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.4"
              />
            </svg>
          </MapControlButton>
          <MapControlButton
            disabled={view.zoom <= 1.02}
            label="缩小地图"
            onClick={() => zoomStep(1 / 1.6)}
          >
            <svg aria-hidden="true" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M2.5 7 H11.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.4"
              />
            </svg>
          </MapControlButton>
          <MapControlButton label="复位视野" onClick={resetView}>
            <svg aria-hidden="true" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M2.6 7 a4.4 4.4 0 1 1 1.3 3.1 M2.6 10.4 V7.2 H5.8"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.3"
              />
            </svg>
          </MapControlButton>
        </div>
      </div>

      <div className="flex h-8 shrink-0 flex-wrap items-center justify-between gap-x-4 overflow-hidden px-1">
        <div
          aria-hidden="true"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-muted-foreground"
        >
          <span className="text-ink/60">底图 · 现今中国疆域</span>
          <span className="hidden sm:inline">滚轮缩放 · 拖拽平移</span>
          {LEGEND.filter((entry) => legendSymbols(layer, dynasty).includes(entry.symbol)).map(
            (entry) => (
              <span className="flex items-center gap-1.5" key={entry.label}>
                <LegendSymbol symbol={entry.symbol} />
                {entry.label}
              </span>
            ),
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {view.zoom > 1.02 ? (
            <span className="font-mono-tech text-xs text-vermillion">局部放大 · {zoom}×</span>
          ) : null}
          <button
            aria-pressed={animated}
            className={cn(
              "shrink-0 rounded-full border border-ink/15 bg-paper/80 px-3 py-1 font-body text-xs transition-colors",
              "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              animated ? "text-ink" : "text-muted-foreground",
            )}
            onClick={onToggleAnimated}
            type="button"
          >
            动画 · {animated ? "开" : "关"}
          </button>
        </div>
      </div>
    </div>
  );
}
