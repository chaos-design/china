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
 * 两视图切换只换正文，各自内部状态（展开节点 / 选中品级）在挂载期间保留；
 * 切换朝代会同时重置到图一，避免残留上一朝的选中态。
 */
export function QingOfficialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get("dynasty");
  const atlas = resolveDynastyAtlas(requestedId);
  const unknownDynasty = Boolean(requestedId && !getDynastyAtlas(requestedId));
  const [view, setView] = useState<OfficialsView>("chart");
  const active = VIEWS.find((entry) => entry.id === view) ?? VIEWS[0]!;

  const chooseDynasty = (id: string) => {
    setSearchParams({ dynasty: id });
    setView("chart");
  };

  return (
    <article className="bg-paper paper-backdrop min-h-full px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-ink/10 border-b pb-5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="font-brush text-4xl text-ink sm:text-5xl">官制图谱</h1>
            <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-xs tracking-widest text-muted-foreground">
              职官 · 品级 · 央地结构
            </span>
            <span className="font-body text-xs font-medium tracking-[0.3em] text-vermillion">
              {atlas.name}帝国 · 行政体系示意
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-ink/85">{atlas.intro}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-tech text-[0.7rem] tracking-[0.14em] text-muted-foreground">
            <span>{atlas.period}</span>
            <span>{atlas.system}</span>
            <span>{atlas.source}</span>
          </div>
        </header>

        <fieldset aria-label="朝代选择" className="flex flex-wrap gap-2">
          {DYNASTY_ATLASES.map((entry) => {
            const activeDynasty = entry.id === atlas.id;
            return (
              <button
                aria-pressed={activeDynasty}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 font-brush text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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

        {unknownDynasty ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-ochre/30 bg-paper/70 px-4 py-2 text-xs leading-relaxed text-muted-foreground"
          >
            未收录该朝代，已显示默认朝代「{atlas.name}」的图谱。
          </p>
        ) : null}

        <div aria-label="图谱视图" className="flex flex-wrap gap-2" role="tablist">
          {VIEWS.map((entry) => (
            <button
              aria-selected={entry.id === view}
              className={cn(
                "rounded-full border px-4 py-1.5 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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

        <p className="font-mono-tech text-[0.7rem] tracking-[0.14em] text-muted-foreground">
          {atlas.name} · {active.note}
        </p>

        <div aria-label={active.label} role="tabpanel">
          {view === "chart" ? <QingOfficeTree atlas={atlas} /> : null}
          {view === "ranks" ? (
            <div className="flex flex-col gap-8">
              <QingRankLadder atlas={atlas} />
              <QingRegalia atlas={atlas} />
            </div>
          ) : null}
        </div>

        <p className="border-ink/10 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          {atlas.footnote}
        </p>
      </div>
    </article>
  );
}
