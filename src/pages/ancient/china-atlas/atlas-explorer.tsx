import { useCallback, useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import { getAtlasFocus } from "./atlas-focus";
import {
  ATLAS_ITEMS,
  ATLAS_LAYER_OPTIONS,
  type AtlasItem,
  type AtlasLayerId,
  getVisibleItems,
} from "./atlas-items";
import { AtlasMap } from "./atlas-map";
import { AtlasShell } from "./atlas-shell";
import { ATLAS_DYNASTIES } from "./dynasties";
import { dynastyCitySummary } from "./dynasty-overlay";
import { getDynastyTerritory } from "./dynasty-territories";
import { TERRITORY_SNAPSHOTS, TERRITORY_YEAR_RANGE } from "./territory-snapshots";
import { getAtlasTopic } from "./topics";
import type { AtlasDynastyId } from "./types";

interface LayerMeta {
  badge: string;
  description: string;
  hint: string;
  menuLabel: string;
  overviewLabel: string;
  tagline: string;
  title: string;
}

const LAYER_META: Record<AtlasLayerId, LayerMeta> = {
  all: {
    badge: "三谱同图 · 汉唐宋元",
    description:
      "底图恒为现今中国疆域与省界。左侧一张菜单按专题铺平、按朝代展开，选中条目朱色高亮并局部放大；切换朝代可叠加当朝疆域示意与都城、大城市标记，悬停标注看详情与出处。",
    hint: "全览模式：六幅疆域快照、八条迁徙路线与八项边疆制度同图呈现，共用一张真实省界底图。悬停任一标注展开详情，点选可把详情固定在下方并放大所在地区。",
    menuLabel: "图谱条目目录",
    overviewLabel: "全览 · 全部图谱",
    tagline: "一图三谱",
    title: "疆域与民族图谱",
  },
  territory: {
    badge: "首批六幅快照 · 汉唐宋元",
    description: getAtlasTopic("territory").description,
    hint: "全览模式：六幅快照的都城与控制节点同时呈现，重复地点以引导线错开标注。选择时间轴或左侧任一条目，聚焦单个断面并叠加当朝疆域示意。",
    menuLabel: "疆域快照目录",
    overviewLabel: "全览 · 全部快照",
    tagline: getAtlasTopic("territory").tagline,
    title: "疆域变迁",
  },
  migration: {
    badge: "首批八条路线 · 汉唐宋元",
    description: getAtlasTopic("migration").description,
    hint: "全览模式：八条迁徙路线同时播放流动动画，按汉、唐、宋、元依次启程。选择左侧任一条目，聚焦单条路线的完整说明与出处。",
    menuLabel: "迁徙路线目录",
    overviewLabel: "全览 · 全部路线",
    tagline: getAtlasTopic("migration").tagline,
    title: "民族迁徙",
  },
  frontier: {
    badge: "首批八项制度 · 汉唐宋元",
    description: getAtlasTopic("frontier").description,
    hint: "全览模式：八项制度的治所与防御范围同步呈现。选择左侧任一条目，查看辖区、治所、防御范围与资料出处。",
    menuLabel: "边疆制度目录",
    overviewLabel: "全览 · 全部治所",
    tagline: getAtlasTopic("frontier").tagline,
    title: "边疆治理",
  },
};

function yearLabel(year: number): string {
  return year < 0 ? `前${-year}` : `${year}`;
}

function yearPercent(year: number): number {
  const { min, max } = TERRITORY_YEAR_RANGE;
  return Math.min(100, Math.max(0, ((year - min) / (max - min)) * 100));
}

/**
 * 顶条在所有图层下都是同一条时间轴，高度恒定：既去掉了图层说明文字，
 * 也保证切换专题与朝代时地图上方不会产生任何位移。
 */
function ContextStrip({
  dynasty,
  layer,
  onSelect,
  selectedId,
}: {
  dynasty: AtlasDynastyId | null;
  layer: AtlasLayerId;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const status = selectedId
    ? "已选中条目"
    : dynasty
      ? `${getDynastyTerritory(dynasty).label}朝断面`
      : "全览";
  return (
    <div className="h-[4.75rem] shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 pb-1 pt-2">
      <div className="flex items-baseline justify-between">
        <p className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
          时间轴 · 疆域断面（前111 — 1330）
        </p>
        <p className="font-body text-xs text-muted-foreground">
          {LAYER_META[layer].title} · {status}
        </p>
      </div>
      <ol className="relative mx-6 mt-1 h-12" aria-label="疆域快照时间轴">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-ink/5 via-ink/30 to-ink/5"
        />
        {TERRITORY_SNAPSHOTS.map((snapshot, index) => {
          const id = `territory:${snapshot.id}`;
          const isSelected = id === selectedId;
          const above = index % 2 === 1;
          return (
            <li
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              key={snapshot.id}
              style={{ left: `${yearPercent(snapshot.year)}%` }}
            >
              <button
                aria-pressed={isSelected}
                className={cn(
                  "group relative flex flex-col items-center rounded-md px-2 py-1 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  above && "flex-col-reverse",
                )}
                onClick={() => onSelect(id)}
                title={`${snapshot.label}（${yearLabel(snapshot.year)}）`}
                type="button"
              >
                <span className="relative flex items-center justify-center" aria-hidden="true">
                  {isSelected ? (
                    <span className="absolute block h-5 w-5 animate-ping rounded-full bg-vermillion/30" />
                  ) : null}
                  <span
                    className={cn(
                      "block rounded-full border transition-all",
                      isSelected
                        ? "h-3.5 w-3.5 border-primary bg-vermillion shadow-[0_0_0_3px_hsl(var(--vermillion)/0.15)]"
                        : "h-3 w-3 border-ink/40 bg-paper group-hover:scale-110 group-hover:border-primary/60",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "block whitespace-nowrap font-mono-tech text-xs",
                    above ? "mb-1.5" : "mt-1.5",
                    isSelected ? "font-bold text-vermillion" : "text-muted-foreground",
                  )}
                >
                  {yearLabel(snapshot.year)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
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

/**
 * 详情正文：选中态与悬停态共用，全部文案取自条目自带的 description / sources。
 * 悬停时详情在下方固定高度的卡里展开，不盖住地图上的任何标注。
 */
function SelectedDetail({ eyebrow, item }: { eyebrow?: string; item: AtlasItem }) {
  return (
    <div key={item.id}>
      {eyebrow ? (
        <p className="mb-1 font-body text-xs font-medium tracking-[0.3em] text-vermillion">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-kai text-xl font-bold text-ink">{item.title}</h2>
        <span className="font-mono-tech text-xs text-muted-foreground">{item.period}</span>
      </div>
      {item.notes.map((note) => (
        <p className="mt-1 font-body text-xs text-muted-foreground" key={note}>
          {note}
        </p>
      ))}
      <p className="mt-2 font-body text-sm leading-relaxed text-ink/85">{item.description}</p>
      <ul className="mt-2 flex flex-col gap-1 border-ink/8 border-t pt-2">
        {item.sources.map((source) => (
          <li className="font-body text-xs text-muted-foreground" key={source}>
            资料出处 · {source}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 朝代断面摘要：没有悬停 / 选中条目时，说明当朝都城、大城市与示意范围的性质。 */
function DynastyDetail({ dynasty }: { dynasty: AtlasDynastyId }) {
  const territory = getDynastyTerritory(dynasty);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-kai text-xl font-bold text-vermillion">
          {territory.label} · 都城与主要城市
        </h2>
        <span className="font-mono-tech text-xs text-muted-foreground">
          {territory.period} ｜ 底图 · 现今中国疆域与省界
        </span>
      </div>
      <p className="mt-1 font-body text-sm text-ink/85">
        都城 · {territory.capital} ｜ 主要城市 · {dynastyCitySummary(territory)}
      </p>
      <p className="mt-1 font-body text-xs leading-relaxed text-muted-foreground">
        {territory.note}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1 border-ink/8 border-t pt-1.5">
        {territory.sources.map((source) => (
          <li className="font-body text-xs text-muted-foreground" key={source}>
            资料出处 · {source}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface MenuGroup {
  id: string;
  items: readonly AtlasItem[];
  label: string;
  period: string;
}

/** 每个专题下的条目一律按朝代分组；朝代被选中时只留该朝一组。 */
function groupsForLayer(layerId: AtlasLayerId, dynasty: AtlasDynastyId | null): MenuGroup[] {
  return ATLAS_DYNASTIES.map((entry) => ({
    id: entry.id,
    items: ATLAS_ITEMS.filter(
      (item) =>
        (layerId === "all" || item.topic === layerId) &&
        item.dynastyId === entry.id &&
        (dynasty === null || item.dynastyId === dynasty),
    ),
    label: entry.label,
    period: entry.period,
  })).filter((group) => group.items.length > 0);
}

/**
 * 「疆域与民族图谱」统一功能页。
 *
 * 四条旧路由都渲染这一份组件，只在 initialLayer 上不同；页内切换专题、
 * 朝代或条目都是纯 state 变化，不换路由、不重挂载 SVG。底图恒为现代疆域，
 * 局部放大只改最外层 <g> 的 transform，viewBox 与标注坐标始终不变。
 */
export function AtlasExplorer({ initialLayer = "all" }: { initialLayer?: AtlasLayerId }) {
  const [layer, setLayer] = useState<AtlasLayerId>(initialLayer);
  const [dynasty, setDynasty] = useState<AtlasDynastyId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [animated, setAnimated] = useState(true);
  /** 折叠菜单是手风琴式：同一时间只展开一节，避免同名条目在 DOM 里出现两次。 */
  const [expanded, setExpanded] = useState<AtlasLayerId | null>(initialLayer);

  const meta = LAYER_META[layer];
  const visibleItems = useMemo(
    () => getVisibleItems(layer).filter((item) => dynasty === null || item.dynastyId === dynasty),
    [dynasty, layer],
  );
  const selected = ATLAS_ITEMS.find((item) => item.id === selectedId) ?? null;
  const hovered = ATLAS_ITEMS.find((item) => item.id === hoveredId) ?? null;
  const focus = useMemo(() => getAtlasFocus(selected), [selected]);
  const menuSections = useMemo(
    () =>
      ATLAS_LAYER_OPTIONS.map((option) => ({
        groups: groupsForLayer(option.id, dynasty),
        option,
      })),
    [dynasty],
  );

  const switchLayer = useCallback((next: AtlasLayerId) => {
    setLayer(next);
    setSelectedId(null);
    setHoveredId(null);
    setExpanded(next);
  }, []);

  const toggleSection = useCallback(
    (next: AtlasLayerId) => {
      if (next === layer) {
        setExpanded((previous) => (previous === next ? null : next));
        return;
      }
      switchLayer(next);
    },
    [layer, switchLayer],
  );

  const switchDynasty = useCallback((next: AtlasDynastyId | null) => {
    setDynasty(next);
    setSelectedId(null);
    setHoveredId(null);
  }, []);

  const selectItem = useCallback(
    (id: string) => {
      const item = ATLAS_ITEMS.find((candidate) => candidate.id === id);
      if (!item) return;
      setSelectedId(id);
      setHoveredId(null);
      setExpanded(layer);
      if (item.topic === "territory") setDynasty(item.dynastyId);
    },
    [layer],
  );

  const selectSnapshot = useCallback(
    (id: string) => {
      const snapshot = TERRITORY_SNAPSHOTS.find((entry) => `territory:${entry.id}` === id);
      if (!snapshot) return;
      const nextLayer = layer === "migration" || layer === "frontier" ? "territory" : layer;
      setLayer(nextLayer);
      setExpanded(nextLayer);
      setDynasty(snapshot.dynastyId);
      setSelectedId(id);
      setHoveredId(null);
    },
    [layer],
  );

  return (
    <AtlasShell
      badge={meta.badge}
      description={meta.description}
      menu={
        <>
          <button
            aria-pressed={selectedId === null}
            className={cn(
              "w-full rounded-xl border px-4 py-2.5 text-left font-kai text-base transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selectedId === null
                ? "border-primary/50 bg-vermillion/8 text-ink"
                : "border-ink/12 bg-paper/70 text-ink/75 hover:border-primary/30 hover:text-ink",
            )}
            onClick={() => {
              setSelectedId(null);
              setHoveredId(null);
            }}
            type="button"
          >
            {meta.overviewLabel}
          </button>

          {/* 一张铺平的菜单：四个专题各是一节，点标题展开 / 折叠其下按朝代归类的数据 */}
          <div className="mt-3 flex flex-col gap-1.5">
            {menuSections.map(({ groups, option }) => {
              const isActive = layer === option.id;
              const isOpen = expanded === option.id;
              return (
                <section
                  className={cn(
                    "overflow-hidden rounded-xl border transition-colors",
                    isActive ? "border-vermillion/35 bg-vermillion/5" : "border-ink/10 bg-paper/60",
                  )}
                  key={option.id}
                >
                  <button
                    aria-controls={`atlas-section-${option.id}`}
                    aria-expanded={isOpen}
                    aria-pressed={isActive}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-kai text-base transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isActive ? "font-bold text-vermillion" : "text-ink/80 hover:text-ink",
                    )}
                    onClick={() => toggleSection(option.id)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    <svg
                      aria-hidden="true"
                      className={cn("shrink-0 transition-transform", isOpen && "rotate-180")}
                      height="10"
                      viewBox="0 0 10 10"
                      width="10"
                    >
                      <path
                        d="M1.5 3.2 L5 6.8 L8.5 3.2"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </button>

                  {isOpen ? (
                    <div
                      className="flex flex-col gap-2.5 border-ink/8 border-t px-2 pb-2.5 pt-2"
                      id={`atlas-section-${option.id}`}
                    >
                      {groups.map((group) => (
                        <div key={group.id}>
                          <h2 className="flex items-baseline justify-between border-ink/8 border-b pb-1">
                            <span className="font-kai text-sm font-bold text-ink">
                              {group.label}
                            </span>
                            <span className="font-mono-tech text-xs text-muted-foreground">
                              {group.period}
                            </span>
                          </h2>
                          <ul className="mt-1 flex flex-col gap-0.5">
                            {group.items.map((item) => {
                              const isSelected = item.id === selectedId;
                              return (
                                <li key={item.id}>
                                  <button
                                    aria-pressed={isSelected}
                                    className={cn(
                                      "w-full truncate rounded-lg border-l-2 px-2 py-1.5 text-left font-kai text-sm transition-colors",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                      isSelected
                                        ? "border-vermillion bg-vermillion/15 font-bold text-vermillion"
                                        : "border-transparent text-ink/80 hover:bg-ink/4 hover:text-ink",
                                    )}
                                    onClick={() => selectItem(item.id)}
                                    title={`${item.label}（${item.period}）`}
                                    type="button"
                                  >
                                    {item.short}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </>
      }
      menuLabel={meta.menuLabel}
      nav={
        <fieldset aria-label="朝代切换" className="mt-2">
          <legend className="font-body text-[0.7rem] tracking-[0.2em] text-muted-foreground">
            朝代断面 · 底图为现今疆域
          </legend>
          <div className="mt-1.5 grid grid-cols-[2.2fr_repeat(4,minmax(0,1fr))] gap-1">
            <button
              aria-pressed={dynasty === null}
              className={cn(
                "truncate rounded-full border px-1 py-1 font-kai text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                dynasty === null
                  ? "border-vermillion/45 bg-vermillion/10 font-bold text-vermillion"
                  : "border-ink/15 bg-paper/70 text-ink/75 hover:text-ink",
              )}
              onClick={() => switchDynasty(null)}
              type="button"
            >
              全部朝代
            </button>
            {ATLAS_DYNASTIES.map((entry) => (
              <button
                aria-pressed={dynasty === entry.id}
                className={cn(
                  "rounded-full border px-1 py-1 font-kai text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  dynasty === entry.id
                    ? "border-vermillion/45 bg-vermillion/10 font-bold text-vermillion"
                    : "border-ink/15 bg-paper/70 text-ink/75 hover:text-ink",
                )}
                key={entry.id}
                onClick={() => switchDynasty(entry.id)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </fieldset>
      }
      tagline={meta.tagline}
      title={meta.title}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4 lg:px-6">
        <ContextStrip
          dynasty={dynasty}
          layer={layer}
          onSelect={selectSnapshot}
          selectedId={selectedId}
        />

        {/* 地图列：相对定位容器恒高，浮层用绝对定位，切换时没有布局位移 */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/10 bg-paper/70 p-2 sm:p-3">
          <div className="relative min-h-0 flex-1">
            <AtlasMap
              animated={animated}
              dynasty={dynasty}
              focus={focus}
              hoveredId={hoveredId}
              items={visibleItems}
              layer={layer}
              onHover={setHoveredId}
              onSelect={selectItem}
              selectedId={selectedId}
            />
          </div>

          <div className="flex h-8 shrink-0 flex-wrap items-center justify-between gap-x-4 overflow-hidden px-1">
            <div
              aria-hidden="true"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-muted-foreground"
            >
              <span className="text-ink/60">底图 · 现今中国疆域</span>
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
              {selected ? (
                <button
                  className="rounded-full border border-vermillion/40 bg-vermillion/10 px-3 py-1 font-body text-xs text-vermillion transition-colors hover:bg-vermillion/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => {
                    setSelectedId(null);
                    setHoveredId(null);
                  }}
                  type="button"
                >
                  局部放大 · {focus.k}× · 复位
                </button>
              ) : null}
              <button
                aria-pressed={animated}
                className={cn(
                  "shrink-0 rounded-full border border-ink/15 bg-paper/80 px-3 py-1 font-body text-xs transition-colors",
                  "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  animated ? "text-ink" : "text-muted-foreground",
                )}
                onClick={() => setAnimated((value) => !value)}
                type="button"
              >
                动画 · {animated ? "开" : "关"}
              </button>
            </div>
          </div>
        </div>

        {/* 详情卡固定高度并内部滚动：悬停展开 / 点选固定 / 朝代摘要都不挤压地图 */}
        <div className="h-40 shrink-0 overflow-y-auto rounded-2xl border border-ink/10 bg-paper/70 px-5 py-3">
          {hovered ? (
            <div aria-live="polite" role="tooltip">
              <SelectedDetail
                eyebrow={`悬停详情 · ${ATLAS_LAYER_OPTIONS.find((option) => option.id === hovered.topic)?.label ?? ""}`}
                item={hovered}
              />
            </div>
          ) : selected ? (
            <SelectedDetail item={selected} />
          ) : dynasty ? (
            <DynastyDetail dynasty={dynasty} />
          ) : (
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{meta.hint}</p>
          )}
        </div>
      </div>
    </AtlasShell>
  );
}
