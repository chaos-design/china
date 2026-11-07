import { useState } from "react";

import { cn } from "../../../lib/utils";
import { AtlasShell } from "./atlas-shell";
import { ATLAS_DYNASTIES } from "./dynasties";
import { MIGRATION_EVENTS } from "./migration-events";
import { MigrationMap } from "./migration-map";
import { getAtlasTopic } from "./topics";

/**
 * 民族迁徙页（图谱首个正式页面）。
 * 共享 AtlasShell 应用式外壳（页头钉顶、侧栏贴左含图谱导航、内容区弹性分栏）；
 * 本页菜单是按朝代分组的迁徙事件，内容区是真实底图上的路线动画与解释卡。
 * 选中任一条路线，地图即以画线 + 流动圆点模拟该次迁徙的去向；
 * 「全部路线」保留全局的迁徙密度感。所有动画默认开启，
 * 「流动动画」开关是唯一的播放控制。
 */
export function MigrationAtlasPage() {
  const topic = getAtlasTopic("migration");
  const [selectedId, setSelectedId] = useState<string | null>(MIGRATION_EVENTS[0]?.id ?? null);
  // 动画默认全开；开关是唯一的播放控制。
  const [animated, setAnimated] = useState(true);
  const selected = MIGRATION_EVENTS.find((event) => event.id === selectedId) ?? null;

  return (
    <AtlasShell
      badge="首批八条路线 · 汉唐宋元"
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
            全览 · 全部路线
          </button>

          <div className="mt-4 flex flex-col gap-4">
            {ATLAS_DYNASTIES.map((dynasty) => {
              const events = MIGRATION_EVENTS.filter((event) => event.dynastyId === dynasty.id);
              if (events.length === 0) return null;
              return (
                <section key={dynasty.id}>
                  <h2 className="flex items-baseline justify-between border-ink/8 border-b pb-1.5">
                    <span className="font-kai text-lg font-bold text-ink">{dynasty.label}</span>
                    <span className="font-mono-tech text-xs text-muted-foreground">
                      {dynasty.period}
                    </span>
                  </h2>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {events.map((event) => {
                      const isSelected = event.id === selectedId;
                      return (
                        <li key={event.id}>
                          <button
                            aria-pressed={isSelected}
                            className={cn(
                              "-mx-1 w-[calc(100%+0.5rem)] rounded-lg px-2.5 py-2 text-left transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isSelected
                                ? "bg-vermillion/10 text-ink"
                                : "text-ink/80 hover:bg-ink/4 hover:text-ink",
                            )}
                            onClick={() => setSelectedId(event.id)}
                            type="button"
                          >
                            <span className="block font-kai text-base">
                              {event.group}
                              <span className="font-body text-xs text-muted-foreground">
                                {" "}
                                · {event.from}→{event.to}
                              </span>
                            </span>
                            <span className="mt-0.5 block font-body text-xs text-muted-foreground">
                              {event.period}
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

          <p className="mt-4 font-body text-xs leading-relaxed text-muted-foreground">
            路线为主流向的示意走廊：同一次迁徙往往分几波、走几条道。底图采用真实省界投影，与丝绸之路、解放战争两图同源。
          </p>
        </>
      }
      menuLabel="迁徙路线目录"
      topic={topic}
    >
      {/* 真实底图 + 选中路线详情。弹性分栏：地图占剩余空间并随之缩放，
          解释内容（详情卡）shrink-0 常驻同屏，不受滚动影响。 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/10 bg-paper/70 p-2 sm:p-3">
          <div className="min-h-0 flex-1">
            <MigrationMap
              animated={animated}
              className="lg:h-full"
              events={MIGRATION_EVENTS}
              selectedId={selectedId}
            />
          </div>
          <div className="mt-1.5 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
            <div
              aria-hidden="true"
              className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                  <circle
                    cx="5"
                    cy="5"
                    fill="none"
                    r="3.4"
                    stroke="hsl(var(--vermillion))"
                    strokeWidth="1.4"
                  />
                </svg>
                起点
              </span>
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                  <circle cx="5" cy="5" fill="hsl(var(--vermillion))" r="3.4" />
                </svg>
                终点
              </span>
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" height="6" viewBox="0 0 24 6" width="24">
                  <path
                    d="M0,3 C8,1 16,5 24,3"
                    fill="none"
                    stroke="hsl(var(--vermillion))"
                    strokeWidth="1.6"
                  />
                </svg>
                迁徙去向（流动方向）
              </span>
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" height="6" viewBox="0 0 24 6" width="24">
                  <path
                    d="M0,3 C8,1 16,5 24,3"
                    fill="none"
                    stroke="hsl(var(--ink) / 0.35)"
                    strokeWidth="1.4"
                  />
                </svg>
                其他路线（淡墨）
              </span>
            </div>
            <button
              aria-pressed={animated}
              className={cn(
                "rounded-full border border-ink/15 bg-paper/80 px-3 py-1 font-body text-xs transition-colors",
                "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                animated ? "text-ink" : "text-muted-foreground",
              )}
              onClick={() => setAnimated((value) => !value)}
              type="button"
            >
              流动动画 · {animated ? "开" : "关"}
            </button>
          </div>
        </div>

        {selected ? (
          <div
            className="shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-3"
            key={selected.id}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-kai text-xl font-bold text-ink">
                {selected.group} · {selected.from} → {selected.to}
              </h2>
              <span className="font-mono-tech text-xs text-muted-foreground">
                {selected.period}
              </span>
            </div>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink/85">
              {selected.description}
            </p>
            <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground">
              途经 ·{" "}
              {selected.waypoints
                .map((waypoint) => waypoint.name)
                .filter(Boolean)
                .join(" → ")}
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
            淡墨为全部八条路线的主流向。选择左侧任一条目，查看具体路线、时段与资料出处。
          </p>
        )}
      </div>
    </AtlasShell>
  );
}
