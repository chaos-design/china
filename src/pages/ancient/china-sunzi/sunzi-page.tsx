import { useEffect, useState } from "react";

import { cn } from "../../../lib/utils";
import { BATTLES } from "./battles";
import { ExplainPanel } from "./explain-panel";
import { PRINCIPLE_BY_ID } from "./principles";
import { SandTable } from "./sand-table";
import { STRATAGEM_BY_NUMBER, STRATAGEM_SETS, STRATAGEM_SOURCES, STRATAGEMS } from "./stratagems";
import "./sunzi.css";

const STEP_INTERVAL_MS = 2600;
const VIEW_LABEL = { sand: "沙盘", top: "俯视" } as const;

type Mode = "battle" | "stratagems";

/** 孙子兵法沙盘：一张常驻的 3D 底图，按战役与四幕切换，右侧同步读解。 */
export function SunziPage() {
  const [battleIndex, setBattleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<"sand" | "top">("sand");
  const [zoom, setZoom] = useState(1);
  const [explainOpen, setExplainOpen] = useState(true);
  const [mode, setMode] = useState<Mode>(() => {
    const requested =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("view");
    return requested === "stratagems" ? "stratagems" : "battle";
  });
  const [selectedNumber, setSelectedNumber] = useState(2);

  const battle = BATTLES[battleIndex];
  const step = battle.steps[stepIndex];
  const lastStep = battle.steps.length - 1;
  const selected = STRATAGEM_BY_NUMBER[selectedNumber];

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= lastStep) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStepIndex(stepIndex + 1), STEP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, lastStep]);

  function selectBattle(index: number) {
    setBattleIndex(index);
    setStepIndex(0);
    setPlaying(false);
  }

  function goToStep(index: number) {
    setStepIndex(index);
    setPlaying(false);
  }

  function changeZoom(delta: number) {
    setZoom((current) => Math.min(1.6, Math.max(0.85, Math.round((current + delta) * 100) / 100)));
  }

  function resetView() {
    setView("sand");
    setZoom(1);
  }

  function replayStratagem() {
    if (!selected.link) return;
    const nextBattle = Math.max(
      0,
      BATTLES.findIndex((item) => item.id === selected.link?.battleId),
    );
    const nextStep = Math.max(
      0,
      BATTLES[nextBattle].steps.findIndex((item) => item.id === selected.link?.stepId),
    );
    setBattleIndex(nextBattle);
    setStepIndex(nextStep);
    setPlaying(false);
    setMode("battle");
    setExplainOpen(true);
  }

  const pause = () => setPlaying(false);

  return (
    <article
      className="sunzi-page flex min-h-0 flex-col"
      data-explain={explainOpen}
      data-testid="sunzi-page"
    >
      {mode === "battle" ? (
        <fieldset
          aria-label="沙盘舞台"
          className="sunzi-group sunzi-stage"
          data-testid="sunzi-stage"
          onMouseEnter={pause}
        >
          <SandTable battle={battle} playing={playing} step={step} view={view} zoom={zoom} />
        </fieldset>
      ) : null}

      <div className="sunzi-overlay-top">
        <header className="sunzi-head px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="font-brush text-3xl text-ink sm:text-4xl">孙子兵法沙盘演练</h1>
              <p className="mt-1 font-body text-muted-foreground text-xs sm:text-sm">
                {mode === "battle"
                  ? "三场战役各拆四幕，看兵力怎么走、决策怎么改、胜负怎么变。"
                  : "六套三十六计全录，逐条给出原文与白话，并可跳回沙盘对应的一幕。"}
              </p>
              <p className="mt-1 font-body text-xs">
                {mode === "battle" ? (
                  <>
                    <span className="text-vermillion">{battle.period}</span>
                    <span className="ml-3 text-ink/80">{battle.commander}</span>
                  </>
                ) : (
                  <span className="text-ink/80">
                    语源见《南齐书·王敬则传》，成书约明清，作者佚名
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <nav aria-label="内容模式" className="flex gap-1">
                <button
                  aria-pressed={mode === "battle"}
                  className={cn("sunzi-chip font-kai text-sm", mode === "battle" && "is-active")}
                  onClick={() => setMode("battle")}
                  type="button"
                >
                  沙盘三役
                </button>
                <button
                  aria-pressed={mode === "stratagems"}
                  className={cn(
                    "sunzi-chip font-kai text-sm",
                    mode === "stratagems" && "is-active",
                  )}
                  onClick={() => setMode("stratagems")}
                  type="button"
                >
                  三十六计
                </button>
              </nav>
              {mode === "battle" ? (
                <>
                  <nav aria-label="战役选择" className="flex flex-wrap gap-2">
                    {BATTLES.map((item, index) => (
                      <button
                        aria-pressed={index === battleIndex}
                        className={cn(
                          "sunzi-chip font-kai text-sm",
                          index === battleIndex && "is-active",
                        )}
                        key={item.id}
                        onClick={() => selectBattle(index)}
                        type="button"
                      >
                        {item.name}
                      </button>
                    ))}
                  </nav>
                  <button
                    aria-expanded={explainOpen}
                    className={cn("sunzi-chip font-body text-xs", explainOpen && "is-active")}
                    onClick={() => setExplainOpen((current) => !current)}
                    type="button"
                  >
                    讲解
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {mode === "battle" ? (
          <div className="sunzi-controls flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
            <p className="min-w-0 font-body text-ink/80 text-xs">{battle.summary}</p>
            <fieldset aria-label="视角" className="sunzi-group ml-auto flex gap-1">
              {(Object.keys(VIEW_LABEL) as Array<keyof typeof VIEW_LABEL>).map((key) => (
                <button
                  aria-pressed={view === key}
                  className={cn("sunzi-chip font-body text-xs", view === key && "is-active")}
                  key={key}
                  onClick={() => setView(key)}
                  type="button"
                >
                  {VIEW_LABEL[key]}
                </button>
              ))}
            </fieldset>
            <fieldset aria-label="缩放" className="sunzi-group flex gap-1">
              <button
                aria-label="缩小沙盘"
                className="sunzi-chip font-body text-xs"
                disabled={zoom <= 0.85}
                onClick={() => changeZoom(-0.15)}
                type="button"
              >
                缩小
              </button>
              <button
                aria-label="放大沙盘"
                className="sunzi-chip font-body text-xs"
                disabled={zoom >= 1.6}
                onClick={() => changeZoom(0.15)}
                type="button"
              >
                放大
              </button>
              <button className="sunzi-chip font-body text-xs" onClick={resetView} type="button">
                复位
              </button>
            </fieldset>
            <fieldset aria-label="复盘控制" className="sunzi-group flex gap-1">
              <button
                className="sunzi-chip font-body text-xs"
                disabled={stepIndex === 0}
                onClick={() => goToStep(stepIndex - 1)}
                type="button"
              >
                上一步
              </button>
              <button
                aria-pressed={playing}
                className={cn(
                  "sunzi-chip sunzi-chip--play font-body text-xs",
                  playing && "is-active",
                )}
                data-sunzi-play-toggle=""
                onClick={() => setPlaying((current) => !current)}
                type="button"
              >
                {playing ? "暂停" : "播放"}
              </button>
              <button
                className="sunzi-chip font-body text-xs"
                disabled={stepIndex === lastStep}
                onClick={() => goToStep(stepIndex + 1)}
                type="button"
              >
                下一步
              </button>
            </fieldset>
          </div>
        ) : null}
      </div>

      {mode === "battle" ? (
        <fieldset
          aria-label="战役四幕"
          className="sunzi-group sunzi-timeline px-4 py-3 sm:px-6"
          data-testid="sunzi-timeline"
          onFocus={pause}
          onMouseEnter={pause}
        >
          <ol aria-label="战役四幕" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {battle.steps.map((item, index) => {
              const current = index === stepIndex;

              return (
                <li className="min-w-0" key={item.id}>
                  <button
                    aria-current={current ? "step" : undefined}
                    className={cn("sunzi-step w-full text-left", current && "is-active")}
                    onClick={() => goToStep(index)}
                    type="button"
                  >
                    <span className="block truncate font-kai text-base text-ink">{item.title}</span>
                    <span className="block truncate font-body text-muted-foreground text-xs">
                      {PRINCIPLE_BY_ID[item.principleId].name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </fieldset>
      ) : null}

      {mode === "stratagems" ? (
        <section
          aria-label="三十六计全文"
          className="sunzi-stratagems px-4 py-5 sm:px-8"
          data-testid="sunzi-stratagems"
        >
          <div className="sunzi-stratagem-grid">
            <fieldset aria-label="六套计名" className="sunzi-group">
              {STRATAGEM_SETS.map((group) => (
                <div className="sunzi-set" key={group.id}>
                  <h2 className="sunzi-set__head font-kai text-lg text-ink">
                    {group.label}
                    <span className="ml-2 font-body text-xs text-muted-foreground">
                      {group.scope}
                    </span>
                  </h2>
                  <ol className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {STRATAGEMS.filter((item) => item.set === group.id).map((item) => (
                      <li key={item.id}>
                        <button
                          aria-current={item.number === selectedNumber ? "true" : undefined}
                          className={cn(
                            "sunzi-step w-full text-left",
                            item.number === selectedNumber && "is-active",
                          )}
                          onClick={() => setSelectedNumber(item.number)}
                          type="button"
                        >
                          <span className="block truncate font-kai text-sm text-ink">
                            {item.number}. {item.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </fieldset>

            <div className="sunzi-stratagem-detail">
              <p className="font-body text-muted-foreground text-xs">
                第 {selected.number} 计 · {selected.set}
              </p>
              <h2 className="mt-1 font-brush text-3xl text-ink">{selected.name}</h2>
              <blockquote className="sunzi-quote mt-4 font-kai text-lg leading-relaxed text-ink">
                {selected.verse}
              </blockquote>
              <p className="mt-4 font-body text-ink/85 text-sm leading-relaxed">{selected.plain}</p>
              <p className="mt-3 font-body text-muted-foreground text-xs">
                原文出自《三十六计》佚名本（约明清）；「假痴不癫」在维基文库作「假痴不颠」，「走为上计」作「走为上策」，此处从通行本。
              </p>
              {selected.link ? (
                <button
                  className="sunzi-chip sunzi-chip--play mt-5 font-body text-xs"
                  onClick={replayStratagem}
                  type="button"
                >
                  在沙盘中看这一幕
                </button>
              ) : null}
              <footer className="sunzi-source mt-6 border-ink/10 border-t pt-4">
                <h3 className="sunzi-note__head">文献出处</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {STRATAGEM_SOURCES.map((source) => (
                    <li className="font-body text-xs leading-relaxed" key={source.label}>
                      <a
                        className="text-vermillion underline underline-offset-2"
                        href={source.url}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        {source.label}
                      </a>
                      <span className="block text-muted-foreground">{source.detail}</span>
                    </li>
                  ))}
                </ul>
              </footer>
            </div>
          </div>
        </section>
      ) : null}

      {mode === "battle" ? (
        <aside
          aria-label="读图讲解"
          className="sunzi-explain-rail px-4 py-5 sm:px-5"
          data-testid="sunzi-explain-rail"
        >
          <ExplainPanel
            battleName={battle.name}
            sources={battle.sources}
            step={step}
            stepIndex={stepIndex}
            totalSteps={battle.steps.length}
          />
        </aside>
      ) : null}
    </article>
  );
}
