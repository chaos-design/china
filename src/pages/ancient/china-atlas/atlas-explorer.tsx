import { useCallback, useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
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
import { TERRITORY_SNAPSHOTS, TERRITORY_YEAR_RANGE } from "./territory-snapshots";
import { getAtlasTopic } from "./topics";

interface LayerMeta {
  badge: string;
  description: string;
  hint: string;
  menuLabel: string;
  note: string;
  overviewLabel: string;
  tagline: string;
  title: string;
}

const LAYER_META: Record<AtlasLayerId, LayerMeta> = {
  all: {
    badge: "三谱同图 · 汉唐宋元",
    description:
      "疆域变迁、民族迁徙、边疆治理三类材料锚在同一份真实省界底图上。切换「全部」或单项，地图视野与标注位置保持不变；悬停标注看详情与出处，点选可固定。",
    hint: "全览模式：六幅疆域快照、八条迁徙路线与八项边疆制度同图呈现，共用一张真实省界底图。悬停任一标注展开详情，点选可把详情固定在下方。",
    menuLabel: "图谱条目目录",
    note: "三类图谱共用同一底图与投影；节点、路线与治所都是示意锚点，不代表边界或唯一通道。详情文案与出处逐条取自史料数据。",
    overviewLabel: "全览 · 全部图谱",
    tagline: "一图三谱",
    title: "疆域与民族图谱",
  },
  territory: {
    badge: "首批六幅快照 · 汉唐宋元",
    description: getAtlasTopic("territory").description,
    hint: "全览模式：六幅快照的都城与控制节点同时呈现，重复地点以引导线错开标注。选择时间轴或左侧任一条目，聚焦单个断面。",
    menuLabel: "疆域快照目录",
    note: "疆域是一片连续区域，图上节点只是锚点而非边界；面积诸家估算分歧极大，一律写区间或省略。底图采用真实省界投影。",
    overviewLabel: "全览 · 全部快照",
    tagline: getAtlasTopic("territory").tagline,
    title: "疆域变迁",
  },
  migration: {
    badge: "首批八条路线 · 汉唐宋元",
    description: getAtlasTopic("migration").description,
    hint: "全览模式：八条迁徙路线同时播放流动动画，按汉、唐、宋、元依次启程。选择左侧任一条目，聚焦单条路线的完整说明与出处。",
    menuLabel: "迁徙路线目录",
    note: "路线为主流向的示意走廊：同一次迁徙往往分几波、走几条道。底图采用真实省界投影，与丝绸之路、解放战争两图同源。",
    overviewLabel: "全览 · 全部路线",
    tagline: getAtlasTopic("migration").tagline,
    title: "民族迁徙",
  },
  frontier: {
    badge: "首批八项制度 · 汉唐宋元",
    description: getAtlasTopic("frontier").description,
    hint: "全览模式：八项制度的治所同步呈现。选择左侧任一条目，查看辖区、治所与资料出处。",
    menuLabel: "边疆制度目录",
    note: "制度往往覆盖一片区域，图上的方印只是它的治所或代表地点；辖区范围见详情说明。底图采用真实省界投影。",
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

/** 时间轴与图层说明条高度完全一致：切换图层时地图上方不产生任何位移。 */
function ContextStrip({
  layer,
  onSelect,
  selectedId,
}: {
  layer: AtlasLayerId;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (layer !== "territory" && layer !== "all") {
    return (
      <div className="flex h-[4.75rem] shrink-0 items-center gap-4 rounded-2xl border border-ink/10 bg-paper/70 px-5">
        <span className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
          图层说明
        </span>
        <p className="font-body text-sm leading-relaxed text-ink/85">{LAYER_META[layer].note}</p>
      </div>
    );
  }

  return (
    <div className="h-[4.75rem] shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 pb-1 pt-2">
      <div className="flex items-baseline justify-between">
        <p className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
          时间轴 · 前111 — 1330
        </p>
        <p className="font-body text-xs text-muted-foreground">
          {selectedId ? "已选中单个断面" : "全览六幅快照"}
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

const LEGEND: readonly { label: string; symbol: "solid" | "hollow" | "square" | "line" }[] = [
  { label: "都城 / 迁徙终点", symbol: "solid" },
  { label: "控制节点 / 途经地", symbol: "hollow" },
  { label: "治所方印", symbol: "square" },
  { label: "引导线标注", symbol: "line" },
];

function LegendSymbol({ symbol }: { symbol: "solid" | "hollow" | "square" | "line" }) {
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

/**
 * 「疆域与民族图谱」统一功能页。
 *
 * 三条旧路由与 /china/atlas 都渲染这一份组件，只在 initialLayer 上不同；
 * 页内切换「全部 / 单项」是纯 state 变化，不换路由、不重挂载 SVG，
 * 因此底图视野、标图点、标注位置与详情卡高度都保持恒定。
 */
export function AtlasExplorer({ initialLayer = "all" }: { initialLayer?: AtlasLayerId }) {
  const [layer, setLayer] = useState<AtlasLayerId>(initialLayer);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [animated, setAnimated] = useState(true);

  const meta = LAYER_META[layer];
  const visibleItems = useMemo(() => getVisibleItems(layer), [layer]);
  const selected = ATLAS_ITEMS.find((item) => item.id === selectedId) ?? null;
  const hovered = ATLAS_ITEMS.find((item) => item.id === hoveredId) ?? null;

  const switchLayer = useCallback((next: AtlasLayerId) => {
    setLayer(next);
    setSelectedId(null);
    setHoveredId(null);
  }, []);

  const menuGroups = useMemo(() => {
    if (layer === "all") {
      return ATLAS_LAYER_OPTIONS.filter((option) => option.id !== "all").map((option) => ({
        id: option.id,
        items: ATLAS_ITEMS.filter((item) => item.topic === option.id),
        label: option.label,
        period: "",
      }));
    }
    return ATLAS_DYNASTIES.map((dynasty) => ({
      id: dynasty.id,
      items: ATLAS_ITEMS.filter((item) => item.topic === layer && item.dynastyId === dynasty.id),
      label: dynasty.label,
      period: dynasty.period,
    })).filter((group) => group.items.length > 0);
  }, [layer]);

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
            onClick={() => setSelectedId(null)}
            type="button"
          >
            {meta.overviewLabel}
          </button>

          <div className="mt-4 flex flex-col gap-3">
            {menuGroups.map((group) => (
              <section key={group.id}>
                <h2 className="flex items-baseline justify-between border-ink/8 border-b pb-1">
                  <span className="font-kai text-base font-bold text-ink">{group.label}</span>
                  <span className="font-mono-tech text-xs text-muted-foreground">
                    {group.period || `${group.items.length} 条`}
                  </span>
                </h2>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isSelected = item.id === selectedId;
                    return (
                      <li key={item.id}>
                        <button
                          aria-pressed={isSelected}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isSelected
                              ? "bg-vermillion/10 text-ink"
                              : "text-ink/80 hover:bg-ink/4 hover:text-ink",
                          )}
                          onClick={() => setSelectedId(item.id)}
                          title={`${item.label}（${item.period}）`}
                          type="button"
                        >
                          <span className="truncate font-kai text-sm">{item.short}</span>
                          <span className="shrink-0 font-body text-xs text-muted-foreground">
                            {item.topic === "migration" ? "迁徙" : ""}
                            {item.topic === "frontier" ? "治所" : ""}
                            {item.topic === "territory" ? "快照" : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-4 font-body text-xs leading-relaxed text-muted-foreground">
            {meta.note}
          </p>
        </>
      }
      menuLabel={meta.menuLabel}
      nav={ATLAS_LAYER_OPTIONS.map((option) => (
        <button
          aria-pressed={layer === option.id}
          className={cn(
            "-mx-2 rounded-lg px-2 py-1.5 text-left font-kai text-base transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            layer === option.id
              ? "bg-vermillion/10 font-bold text-ink"
              : "text-ink/80 hover:bg-ink/4 hover:text-primary",
          )}
          key={option.id}
          onClick={() => switchLayer(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
      tagline={meta.tagline}
      title={meta.title}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4 lg:px-6">
        <ContextStrip layer={layer} onSelect={setSelectedId} selectedId={selectedId} />

        {/* 地图列：相对定位容器恒高，浮层用绝对定位，切换时没有布局位移 */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/10 bg-paper/70 p-2 sm:p-3">
          <div className="relative min-h-0 flex-1">
            <AtlasMap
              animated={animated}
              hoveredId={hoveredId}
              items={visibleItems}
              layer={layer}
              onHover={setHoveredId}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>

          <div className="flex h-8 shrink-0 flex-wrap items-center justify-between gap-x-4 overflow-hidden px-1">
            <div
              aria-hidden="true"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-muted-foreground"
            >
              {LEGEND.map((entry) => (
                <span className="flex items-center gap-1.5" key={entry.label}>
                  <LegendSymbol symbol={entry.symbol} />
                  {entry.label}
                </span>
              ))}
            </div>
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

        {/* 详情卡固定高度并内部滚动：悬停展开 / 点选固定 / 全览提示都不挤压地图 */}
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
          ) : (
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{meta.hint}</p>
          )}
        </div>
      </div>
    </AtlasShell>
  );
}
