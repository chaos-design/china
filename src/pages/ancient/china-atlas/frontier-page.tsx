import { useState } from "react";

import { cn } from "../../../lib/utils";
import { AtlasShell } from "./atlas-shell";
import { ATLAS_DYNASTIES } from "./dynasties";
import { FrontierMap } from "./frontier-map";
import { FRONTIER_POLICIES } from "./frontier-policies";
import { getAtlasTopic } from "./topics";

/**
 * 边疆治理页（图谱正式页面）。
 * 共享 AtlasShell 应用式外壳（页头钉顶、侧栏贴左含图谱导航、内容区弹性分栏）；
 * 本页菜单是按朝代分组的边疆制度，内容区是真实底图上的治所分布与制度详情。
 * 制度往往覆盖一片区域，图上的治所方印只是它的行政支点，辖区见详情说明。
 */
export function FrontierAtlasPage() {
  const topic = getAtlasTopic("frontier");
  const [selectedId, setSelectedId] = useState<string | null>(FRONTIER_POLICIES[0]?.id ?? null);
  // 动画默认全开；开关是唯一的播放控制（与民族迁徙页一致）。
  const [animated, setAnimated] = useState(true);
  const selected = FRONTIER_POLICIES.find((policy) => policy.id === selectedId) ?? null;

  return (
    <AtlasShell
      badge="首批八项制度 · 汉唐宋元"
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
            全览 · 全部治所
          </button>

          <div className="mt-4 flex flex-col gap-4">
            {ATLAS_DYNASTIES.map((dynasty) => {
              const policies = FRONTIER_POLICIES.filter(
                (policy) => policy.dynastyId === dynasty.id,
              );
              if (policies.length === 0) return null;
              return (
                <section key={dynasty.id}>
                  <h2 className="flex items-baseline justify-between border-ink/8 border-b pb-1">
                    <span className="font-kai text-base font-bold text-ink">{dynasty.label}</span>
                    <span className="font-mono-tech text-xs text-muted-foreground">
                      {dynasty.period}
                    </span>
                  </h2>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {policies.map((policy) => {
                      const isSelected = policy.id === selectedId;
                      return (
                        <li key={policy.id}>
                          <button
                            aria-pressed={isSelected}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isSelected
                                ? "bg-vermillion/10 text-ink"
                                : "text-ink/80 hover:bg-ink/4 hover:text-ink",
                            )}
                            onClick={() => setSelectedId(policy.id)}
                            type="button"
                            title={`${policy.institution}（${policy.regions.join("、")} · ${policy.period}）`}
                          >
                            <span className="truncate font-kai text-sm">{policy.institution}</span>
                            <span className="shrink-0 font-body text-xs text-muted-foreground">
                              {policy.regions[0]}
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
            制度往往覆盖一片区域，图上的方印只是它的治所或代表地点；辖区范围见详情说明。底图采用真实省界投影，与丝绸之路、解放战争两图同源。
          </p>
        </>
      }
      menuLabel="边疆制度目录"
      topic={topic}
    >
      {/* 真实底图治所分布 + 选中制度详情。与迁徙页同一弹性分栏：
          地图占剩余空间，解释内容常驻同屏。 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/10 bg-paper/70 p-2 sm:p-3">
          <div className="min-h-0 flex-1">
            <FrontierMap
              animated={animated}
              className="lg:h-full"
              policies={FRONTIER_POLICIES}
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
                  <rect fill="hsl(var(--vermillion))" height="7" width="7" x="1.5" y="1.5" />
                </svg>
                选中治所
              </span>
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                  <rect
                    fill="hsl(var(--paper))"
                    height="7"
                    stroke="hsl(var(--ink) / 0.45)"
                    strokeWidth="1.2"
                    width="7"
                    x="1.5"
                    y="1.5"
                  />
                </svg>
                其他治所
              </span>
              <span>方印为治所或代表地点，辖区见详情</span>
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
              治所脉冲 · {animated ? "开" : "关"}
            </button>
          </div>
        </div>

        {selected ? (
          <div
            className="shrink-0 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-3"
            key={selected.id}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-kai text-xl font-bold text-ink">{selected.institution}</h2>
              <span className="font-mono-tech text-xs text-muted-foreground">
                {selected.period}
              </span>
              <span className="rounded-full border border-ink/15 bg-paper/80 px-2.5 py-0.5 font-body text-xs text-muted-foreground">
                {selected.regions.join("、")}
              </span>
            </div>
            <p className="mt-2 font-body text-xs text-muted-foreground">
              治所 · {selected.seat.name}
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink/85">
              {selected.description}
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
            全览模式下全部治所同步脉冲强调。选择左侧任一条目，聚焦单项制度的辖区、治所与出处。
          </p>
        )}
      </div>
    </AtlasShell>
  );
}
