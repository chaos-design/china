import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { DYNASTY_ATLASES, getDynastyAtlas, resolveDynastyAtlas } from "./data";
import { QingOfficeTree } from "./qing-office-tree";
import { QingRankLadder } from "./qing-rank-ladder";
import { QingRegalia } from "./qing-regalia";

type OfficialsView = "chart" | "ranks";

const VIEWS: readonly { id: OfficialsView; label: string; note: string }[] = [
  { id: "chart", label: "官职制度", note: "图一 · 官署层级与从属关系" },
  { id: "ranks", label: "品级礼制", note: "图二 · 品级决定服色、章服与礼序" },
];

/**
 * 官制图谱：按朝代拆分的数据层驱动的独立信息图页。
 *
 * 朝代由 URL 查询参数 ?dynasty=<id> 决定，可直接分享与刷新；未知 id 降级到默认朝（清）。
 * 页面为单屏沉浸结构（仿品级纵横）：紧凑顶条一行收纳页题、朝代与视图切换，
 * 图谱本体撑满剩余可视高度——官职制度是全高立体树舞台，品级礼制在自身列内滚动。
 * 两视图切换只换正文，各自内部状态（展开节点 / 选中品级）在挂载期间保留；
 * 视图选择本身不随朝代变化重置——读者停在哪张图，换朝代后仍停在那张图。
 */
export function QingOfficialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get("dynasty");
  const atlas = resolveDynastyAtlas(requestedId);
  const unknownDynasty = Boolean(requestedId && !getDynastyAtlas(requestedId));
  const [view, setView] = useState<OfficialsView>("chart");
  const active = VIEWS.find((entry) => entry.id === view) ?? VIEWS[0]!;

  // 视图是读者自己的阅读位置：切朝代不重置，上一次选的图保持到下一次主动切换。
  const chooseDynasty = (id: string) => {
    setSearchParams({ dynasty: id });
  };

  return (
    <article className="bg-paper paper-backdrop flex h-full min-h-0 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 border-ink/10 border-b pb-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-x-3">
            <h1 className="font-brush text-2xl text-ink sm:text-3xl">官制图谱</h1>
            <span className="hidden rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-xs tracking-widest text-muted-foreground md:inline">
              职官 · 品级 · 央地结构
            </span>
          </div>
          <fieldset aria-label="朝代选择" className="flex flex-wrap items-center gap-1.5">
            {DYNASTY_ATLASES.map((entry) => {
              const activeDynasty = entry.id === atlas.id;
              return (
                <button
                  aria-pressed={activeDynasty}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-brush text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    activeDynasty
                      ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                      : "border-ink/15 bg-card/70 text-ink hover:border-vermillion/30 hover:bg-vermillion/5",
                  )}
                  key={entry.id}
                  onClick={() => chooseDynasty(entry.id)}
                  type="button"
                >
                  {entry.name}
                </button>
              );
            })}
          </fieldset>
          <div aria-label="图谱视图" className="flex items-center gap-1.5" role="tablist">
            {VIEWS.map((entry) => (
              <button
                aria-selected={entry.id === view}
                className={cn(
                  "rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  entry.id === view
                    ? "border-vermillion/45 bg-vermillion/15 text-vermillion"
                    : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30",
                )}
                key={entry.id}
                onClick={() => setView(entry.id)}
                role="tab"
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {unknownDynasty ? (
        <p
          aria-live="polite"
          className="mt-2 rounded-lg border border-ochre/30 bg-paper/70 px-4 py-2 text-xs leading-relaxed text-muted-foreground"
        >
          未收录该朝代，已显示默认朝代「{atlas.name}」的图谱。
        </p>
      ) : null}

      <div
        aria-label={active.label}
        className="relative flex min-h-0 flex-1 flex-col pt-3"
        role="tabpanel"
      >
        {view === "chart" ? (
          <>
            <QingOfficeTree atlas={atlas} />
            {/* 原头部第二行收为舞台底部一行小字（内容不变，仅重排）：
                朝代 · 年代 · 制度 · 出处 ｜ 总纲 ｜ 图注；朝代名只在行首出现一次。 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
              <p className="w-full truncate bg-paper/95 px-3 py-1 text-center font-mono-tech text-[0.7rem] tracking-[0.14em] text-muted-foreground">
                {atlas.name}
                {" · "}
                {atlas.period}
                {" · "}
                {atlas.system}
                {" · "}
                {atlas.source}
                {" ｜ "}
                <span className="font-body tracking-normal text-ink/70">{atlas.intro}</span>
                {" ｜ "}
                {active.note}
              </p>
            </div>
          </>
        ) : null}
        {view === "ranks" ? (
          <div className="h-full min-h-0 overflow-y-auto pr-1 lg:pr-2">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-4 pt-1">
              <QingRankLadder atlas={atlas} />
              <QingRegalia atlas={atlas} />
              <p className="border-ink/10 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                {atlas.footnote}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
