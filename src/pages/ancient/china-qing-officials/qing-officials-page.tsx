import { useState } from "react";

import { cn } from "../../../lib/utils";
import { QingOfficeTree } from "./qing-office-tree";
import { QingRankLadder } from "./qing-rank-ladder";
import { QingRegalia } from "./qing-regalia";

type QingView = "chart" | "ranks";

const VIEWS: readonly { id: QingView; label: string; note: string }[] = [
  { id: "chart", label: "官职制度", note: "图一 · 清朝官职制度层级图" },
  { id: "ranks", label: "九品十八级", note: "图二 · 品级决定服色、补子、顶戴与礼序" },
];

/**
 * 清代官制图谱：按两张参考图重新演绎的两个视图。
 * - 官职制度：皇权为根，中枢 / 佐理 / 帝室 / 行省 / 藩部 / 府州县分层铺开，可点开属官；
 * - 九品十八级：阶梯点选品级，联动顶戴 / 朝服 / 俸禄 / 职官，并列出文武补子与礼序。
 *
 * 采用默认布局（内容随页面滚动），不使用 h-full 沉浸舞台；两视图切换只换正文，
 * 各自内部状态（展开节点 / 选中品级）在挂载期间保留。
 */
export function QingOfficialsPage() {
  const [view, setView] = useState<QingView>("chart");
  const active = VIEWS.find((entry) => entry.id === view) ?? VIEWS[0]!;

  return (
    <article className="bg-paper paper-backdrop min-h-full px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-ink/10 border-b pb-5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="font-brush text-4xl text-ink sm:text-5xl">清代官制图谱</h1>
            <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-xs tracking-widest text-muted-foreground">
              职官 · 品级 · 央地结构
            </span>
            <span className="font-body text-xs font-medium tracking-[0.3em] text-vermillion">
              大清帝国 · 行政体系示意
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-ink/85">
            品级决定服色、补子、顶戴，也决定礼仪中的位置。以下两张图谱分别呈现清代官署的层级从属，
            以及九品十八级如何落到具体的顶戴、朝服、俸禄与朝会位次上。
          </p>
        </header>

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
          {active.note}
        </p>

        <div aria-label={active.label} role="tabpanel">
          {view === "chart" ? <QingOfficeTree /> : null}
          {view === "ranks" ? (
            <div className="flex flex-col gap-8">
              <QingRankLadder />
              <QingRegalia />
            </div>
          ) : null}
        </div>

        <p className="border-ink/10 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          内容据《清朝官职制度》与《九品十八级，不只是一顶官帽》两图整理；顶戴色卡与朝服色块为示意，
          俸禄为年俸参考值，具体员额与品级以会典、职官志为准。
        </p>
      </div>
    </article>
  );
}
