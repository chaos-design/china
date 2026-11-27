import { useEffect, useState } from "react";

import { cn } from "../../../lib/utils";
import { BATTLES } from "./battles";
import { ExplainPanel } from "./explain-panel";
import { PRINCIPLE_BY_ID } from "./principles";
import { SandTable } from "./sand-table";
import "./sunzi.css";

const STEP_INTERVAL_MS = 2600;
const VIEW_LABEL = { sand: "沙盘", top: "俯视" } as const;

/** 孙子兵法沙盘：一张常驻的 3D 底图，按战役与四幕切换，右侧同步读解。 */
export function SunziPage() {
  const [battleIndex, setBattleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<"sand" | "top">("sand");
  const [zoom, setZoom] = useState(1);

  const battle = BATTLES[battleIndex];
  const step = battle.steps[stepIndex];
  const lastStep = battle.steps.length - 1;

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

  const pause = () => setPlaying(false);

  return (
    <article className="sunzi-page flex min-h-0 flex-col lg:h-full" data-testid="sunzi-page">
      <header className="sunzi-head shrink-0 border-ink/10 border-b px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="font-brush text-3xl text-ink sm:text-4xl">孙子兵法沙盘演练</h1>
            <p className="mt-1 font-body text-muted-foreground text-xs sm:text-sm">
              三场战役各拆四幕，看兵力怎么走、决策怎么改、胜负怎么变。
            </p>
            <p className="mt-1 font-body text-xs">
              <span className="text-vermillion">{battle.period}</span>
              <span className="ml-3 text-ink/80">{battle.commander}</span>
            </p>
          </div>
          <nav aria-label="战役选择" className="flex flex-wrap gap-2">
            {BATTLES.map((item, index) => (
              <button
                aria-pressed={index === battleIndex}
                className={cn("sunzi-chip font-kai text-sm", index === battleIndex && "is-active")}
                key={item.id}
                onClick={() => selectBattle(index)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="order-1 flex min-h-0 flex-1 flex-col">
          <div className="sunzi-controls flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-ink/10 border-b px-4 py-2 sm:px-6">
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

          <fieldset
            aria-label="沙盘舞台"
            className="sunzi-group sunzi-stage"
            data-testid="sunzi-stage"
            onMouseEnter={pause}
          >
            <SandTable battle={battle} playing={playing} step={step} view={view} zoom={zoom} />
          </fieldset>

          <fieldset
            aria-label="战役四幕"
            className="sunzi-group sunzi-timeline shrink-0 px-4 py-3 sm:px-6"
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
                      <span className="block truncate font-kai text-base text-ink">
                        {item.title}
                      </span>
                      <span className="block truncate font-body text-muted-foreground text-xs">
                        {PRINCIPLE_BY_ID[item.principleId].name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </fieldset>
        </section>

        <aside
          aria-label="读图讲解"
          className="order-2 w-full shrink-0 border-ink/10 border-t lg:w-[24rem] lg:overflow-y-auto lg:border-t-0 lg:border-l"
        >
          <ExplainPanel
            battleName={battle.name}
            step={step}
            stepIndex={stepIndex}
            totalSteps={battle.steps.length}
          />
        </aside>
      </div>
    </article>
  );
}
