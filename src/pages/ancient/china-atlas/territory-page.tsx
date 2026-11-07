import { useState } from "react";

import { cn } from "../../../lib/utils";
import { AtlasShell } from "./atlas-shell";
import { ATLAS_DYNASTIES } from "./dynasties";
import { TerritoryMap } from "./territory-map";
import {
  getTerritorySnapshotsByDynasty,
  TERRITORY_SNAPSHOTS,
  TERRITORY_YEAR_RANGE,
} from "./territory-snapshots";
import { getAtlasTopic } from "./topics";

/** 快照年份的短标签：负数表示公元前。 */
function yearLabel(year: number): string {
  return year < 0 ? `前${-year}` : `${year}`;
}

/** 年份在时间轴上的横向位置（百分比）。 */
function yearPercent(year: number): number {
  const { min, max } = TERRITORY_YEAR_RANGE;
  const span = max - min;
  return Math.min(100, Math.max(0, ((year - min) / span) * 100));
}

/**
 * 疆域变迁页（图谱正式页面）。
 * 共享 AtlasShell 应用式外壳；本页菜单是按朝代分组的疆域快照，
 * 内容区自上而下为：可点击的时间轴、真实底图上的快照节点、解释卡。
 * 疆域是连续区域，图上节点只是锚点而非边界；面积诸家估算不一，一律写区间。
 */
export function TerritoryAtlasPage() {
  const topic = getAtlasTopic("territory");
  const [selectedId, setSelectedId] = useState<string | null>(TERRITORY_SNAPSHOTS[0]?.id ?? null);
  const selected = TERRITORY_SNAPSHOTS.find((snapshot) => snapshot.id === selectedId) ?? null;

  return (
    <AtlasShell
      badge="首批六幅快照 · 汉唐宋元"
      menu={
        <>
          <button
            aria-pressed={selectedId === null}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-left font-kai text-base transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selectedId === null
                ? "border-primary/50 bg-vermillion/8 text-ink"
                : "border-ink/12 bg-paper/70 text-ink/75 hover:border-primary/30 hover:text-ink",
            )}
            onClick={() => setSelectedId(null)}
            type="button"
          >
            全览 · 全部快照
          </button>

          <div className="mt-4 flex flex-col gap-3">
            {ATLAS_DYNASTIES.map((dynasty) => {
              const snapshots = getTerritorySnapshotsByDynasty(dynasty.id);
              if (snapshots.length === 0) return null;
              return (
                <section key={dynasty.id}>
                  <h2 className="flex items-baseline justify-between border-ink/8 border-b pb-1">
                    <span className="font-kai text-base font-bold text-ink">{dynasty.label}</span>
                    <span className="font-mono-tech text-xs text-muted-foreground">
                      {dynasty.period}
                    </span>
                  </h2>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {snapshots.map((snapshot) => {
                      const isSelected = snapshot.id === selectedId;
                      return (
                        <li key={snapshot.id}>
                          <button
                            aria-pressed={isSelected}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isSelected
                                ? "bg-vermillion/10 text-ink"
                                : "text-ink/80 hover:bg-ink/4 hover:text-ink",
                            )}
                            onClick={() => setSelectedId(snapshot.id)}
                            type="button"
                            title={`${snapshot.label}（${yearLabel(snapshot.year)}）`}
                          >
                            <span className="truncate font-kai text-sm">{snapshot.label}</span>
                            <span className="shrink-0 font-mono-tech text-xs text-muted-foreground">
                              {yearLabel(snapshot.year)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          <p className="mt-3 font-body text-xs leading-relaxed text-muted-foreground">
            疆域是一片连续区域，图上节点只是锚点而非边界；面积诸家估算分歧极大，一律写区间或省略。底图采用真实省界投影，与丝绸之路、解放战争两图同源。
          </p>
        </>
      }
      menuLabel="疆域快照目录"
      topic={topic}
    >
      {/* 时间轴 + 真实底图快照 + 解释卡。弹性分栏：地图占剩余空间，
          时间轴与解释内容 shrink-0 常驻同屏，不受滚动影响。 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 pb-2 pt-3">
          <div className="flex items-baseline justify-between">
            <p className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
              时间轴 · 前111 — 1330
            </p>
            {selected ? (
              <p className="font-kai text-sm text-ink">
                {selected.label}
                <span className="ml-2 font-mono-tech text-xs text-muted-foreground">
                  {yearLabel(selected.year)}
                </span>
              </p>
            ) : (
              <p className="font-body text-xs text-muted-foreground">全览六幅快照</p>
            )}
          </div>
          <ol className="relative mx-6 mt-1 h-20" aria-label="疆域快照时间轴">
            {/* 轴线：中段略深、两端淡出，与纸面质感一致 */}
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-ink/5 via-ink/30 to-ink/5"
              aria-hidden="true"
            />
            {TERRITORY_SNAPSHOTS.map((snapshot, index) => {
              const isSelected = snapshot.id === selectedId;
              // 年份标签上下交错：避免相邻快照（前111/前60、1141/1330）互相压字
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
                    onClick={() => setSelectedId(snapshot.id)}
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

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/10 bg-paper/70 p-2 sm:p-3">
          <div className="min-h-0 flex-1">
            <TerritoryMap
              className="lg:h-full"
              selectedId={selectedId}
              snapshots={TERRITORY_SNAPSHOTS}
            />
          </div>
          <div
            aria-hidden="true"
            className="mt-1.5 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-1 font-body text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                <circle cx="5" cy="5" fill="hsl(var(--vermillion))" r="4" />
              </svg>
              都城（政治中心）
            </span>
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                <circle
                  cx="5"
                  cy="5"
                  fill="hsl(var(--paper))"
                  r="3.4"
                  stroke="hsl(var(--vermillion))"
                  strokeWidth="1.4"
                />
              </svg>
              代表性控制节点
            </span>
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                <circle
                  cx="5"
                  cy="5"
                  fill="hsl(var(--paper))"
                  r="2.6"
                  stroke="hsl(var(--ink) / 0.45)"
                  strokeWidth="1.2"
                />
              </svg>
              其他快照（淡墨）
            </span>
          </div>
        </div>

        {selected ? (
          <div
            className="shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-3"
            key={selected.id}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-kai text-xl font-bold text-ink">{selected.label}</h2>
              <span className="font-mono-tech text-xs text-muted-foreground">
                {yearLabel(selected.year)} 年
              </span>
              {selected.areaWanKm2 ? (
                <span className="rounded-full border border-ink/15 bg-paper/80 px-2.5 py-0.5 font-body text-xs text-muted-foreground">
                  约 {selected.areaWanKm2} 万 km²
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink/85">
              {selected.description}
            </p>
            <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground">
              都城 · {selected.capital.name} ｜ 节点 ·{" "}
              {selected.anchors.map((place) => place.name).join("、")}
            </p>
            <ul className="mt-2 flex flex-col gap-1 border-ink/8 border-t pt-2">
              {selected.sources.map((source) => (
                <li className="font-body text-xs text-muted-foreground" key={source}>
                  资料出处 · {source}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-4 font-body text-sm text-muted-foreground">
            全览模式下六幅快照同时标注都城与节点（重复地点只标一次）。选择时间轴或左侧任一条目，聚焦单个断面。
          </p>
        )}
      </div>
    </AtlasShell>
  );
}
