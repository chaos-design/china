import { Pause, Play, RotateCcw, SkipBack, SkipForward, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState, type WheelEvent } from "react";

import { SITE_TITLE, setDocumentTitle } from "../../../lib/page-title";
import { cn } from "../../../lib/utils";
import { BATTLES } from "./battles";
import { ExplainPanel } from "./explain-panel";
import { CASE_BY_NUMBER } from "./historical-cases";
import { PRINCIPLE_BY_ID } from "./principles";
import { SandTable } from "./sand-table";
import { STRATAGEM_BY_NUMBER, STRATAGEM_SETS, STRATAGEM_SOURCES, STRATAGEMS } from "./stratagems";
import { PATTERN_LABEL, patternOf, stratagemScene } from "./tactical-scenes";
import "./sunzi.css";

const STEP_INTERVAL_MS = 2600;
const SPEED_OPTIONS = [0.5, 1, 2] as const;
const VIEW_LABEL = { sand: "沙盘", top: "俯视" } as const;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.2;

/** 三十六计沙盘：四周是目录、详解与操作，中间始终是同一张可缩放的 3D 沙盘。 */
export function SunziPage() {
  const [kind, setKind] = useState<"stratagem" | "battle">("stratagem");
  const [selectedNumber, setSelectedNumber] = useState(2);
  const [battleIndex, setBattleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1);
  const [view, setView] = useState<"sand" | "top">("sand");
  const [zoom, setZoom] = useState(1);

  const selected = STRATAGEM_BY_NUMBER[selectedNumber];
  const scene =
    kind === "battle" ? BATTLES[battleIndex] : stratagemScene(selectedNumber, selected.name);
  const step = scene.steps[stepIndex];
  const lastStep = scene.steps.length - 1;

  // 页内切换计谋 / 战役 / 幕时，标签标题跟上当前读图焦点。
  useEffect(() => {
    const focus = kind === "battle" ? scene.name : `第${selected.number}计 ${selected.name}`;
    setDocumentTitle(`${focus} · ${step.title} · 孙子兵法沙盘 · ${SITE_TITLE}`);
  }, [kind, scene.name, selected.number, selected.name, step.title]);

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= lastStep) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStepIndex(stepIndex + 1), STEP_INTERVAL_MS / speed);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, lastStep, speed]);

  // 复盘快捷键只在焦点不落在控件上时接管，否则按钮自身的 Space / 方向键会被抢走。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.closest("button, a, input, textarea, select, [contenteditable]")) return;
      if (event.code === "Space") {
        event.preventDefault();
        setPlaying((current) => !current);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setStepIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setStepIndex((current) => Math.min(lastStep, current + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lastStep]);

  function selectStratagem(number: number) {
    setSelectedNumber(number);
    setKind("stratagem");
    setStepIndex(0);
    setPlaying(false);
  }

  function selectBattle(index: number) {
    setBattleIndex(index);
    setKind("battle");
    setStepIndex(0);
    setPlaying(false);
  }

  function goToStep(index: number) {
    setStepIndex(index);
    setPlaying(false);
  }

  function changeZoom(delta: number) {
    setZoom((current) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 100) / 100)),
    );
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    changeZoom(event.deltaY < 0 ? 0.1 : -0.1);
  }

  function resetView() {
    setView("sand");
    setZoom(1);
  }

  const pause = () => setPlaying(false);
  const pattern = PATTERN_LABEL[patternOf(selectedNumber)];

  return (
    <article className="sunzi-page" data-testid="sunzi-page">
      <fieldset
        aria-label="沙盘舞台"
        className="sunzi-group sunzi-center"
        data-testid="sunzi-center"
        onMouseEnter={pause}
        onWheel={handleWheel}
      >
        <SandTable battle={scene} playing={playing} step={step} view={view} zoom={zoom} />
      </fieldset>

      <nav aria-label="三十六计目录" className="sunzi-left" data-testid="sunzi-left">
        <div className="sunzi-left__head">
          <h1 className="font-brush text-2xl text-ink">孙子兵法沙盘</h1>
          <p className="font-body text-muted-foreground text-xs">六套三十六计，逐计一盘</p>
        </div>
        <div className="sunzi-left__scroll">
          {STRATAGEM_SETS.map((group) => (
            <fieldset aria-label={group.label} className="sunzi-group sunzi-set" key={group.id}>
              <legend className="sunzi-set__head font-kai text-sm text-ink">
                {group.label}
                <span className="ml-2 font-body text-xs text-muted-foreground">{group.scope}</span>
              </legend>
              <ol className="grid grid-cols-2 gap-1">
                {STRATAGEMS.filter((item) => item.set === group.id).map((item) => (
                  <li key={item.id}>
                    <button
                      aria-current={
                        kind === "stratagem" && item.number === selectedNumber ? "true" : undefined
                      }
                      className={cn(
                        "sunzi-step w-full text-left",
                        kind === "stratagem" && item.number === selectedNumber && "is-active",
                      )}
                      onClick={() => selectStratagem(item.number)}
                      type="button"
                    >
                      <span className="block truncate font-kai text-xs text-ink">
                        {item.number}. {item.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </fieldset>
          ))}

          <fieldset aria-label="史籍三役" className="sunzi-group sunzi-set">
            <legend className="sunzi-set__head font-kai text-sm text-ink">史籍三役</legend>
            <nav aria-label="战役选择" className="flex flex-col gap-1">
              {BATTLES.map((item, index) => (
                <button
                  aria-pressed={kind === "battle" && index === battleIndex}
                  className={cn(
                    "sunzi-step w-full text-left",
                    kind === "battle" && index === battleIndex && "is-active",
                  )}
                  key={item.id}
                  onClick={() => selectBattle(index)}
                  type="button"
                >
                  <span className="block truncate font-kai text-xs text-ink">{item.name}</span>
                </button>
              ))}
            </nav>
          </fieldset>
        </div>
      </nav>

      <aside aria-label="计谋详解" className="sunzi-right" data-testid="sunzi-right">
        {kind === "stratagem" ? (
          <div className="sunzi-detail" data-testid="sunzi-stratagem-detail">
            <p className="font-body text-muted-foreground text-xs">
              第 {selected.number} 计 · {selected.set} · {pattern}
            </p>
            <h2 className="mt-1 font-brush text-3xl text-ink">{selected.name}</h2>
            <blockquote className="sunzi-quote mt-4 font-kai text-lg leading-relaxed text-ink">
              {selected.verse}
            </blockquote>
            <p className="mt-4 font-body text-ink/85 text-sm leading-relaxed">{selected.plain}</p>

            <section className="sunzi-note mt-5">
              <h3 className="sunzi-note__head">沙盘机理</h3>
              <p className="sunzi-note__body">{step.situation}</p>
              <p className="sunzi-note__body mt-2">{step.decision}</p>
            </section>
            <section className="sunzi-note mt-4">
              <h3 className="sunzi-note__head">当前结果</h3>
              <p className="sunzi-note__body">{step.outcome}</p>
            </section>

            {selected.link ? (
              <button
                className="sunzi-chip sunzi-chip--play mt-5 font-body text-xs"
                onClick={() => {
                  const battle = Math.max(
                    0,
                    BATTLES.findIndex((item) => item.id === selected.link?.battleId),
                  );
                  const target = Math.max(
                    0,
                    BATTLES[battle].steps.findIndex((item) => item.id === selected.link?.stepId),
                  );
                  setBattleIndex(battle);
                  setStepIndex(target);
                  setPlaying(false);
                  setKind("battle");
                }}
                type="button"
              >
                看对应战役的史籍沙盘
              </button>
            ) : null}

            {CASE_BY_NUMBER[selectedNumber] ? (
              <section className="sunzi-note mt-5" data-testid="sunzi-historical-case">
                <h3 className="sunzi-note__head">史实案例</h3>
                <p className="mt-1 font-kai text-base text-ink">
                  {CASE_BY_NUMBER[selectedNumber].title}
                  <span className="ml-2 font-body text-xs text-muted-foreground">
                    {CASE_BY_NUMBER[selectedNumber].period}
                  </span>
                </p>
                <p className="sunzi-note__body mt-2">{CASE_BY_NUMBER[selectedNumber].summary}</p>
                {CASE_BY_NUMBER[selectedNumber].quote ? (
                  <blockquote className="sunzi-quote mt-3 font-kai text-sm leading-relaxed text-ink">
                    {CASE_BY_NUMBER[selectedNumber].quote}
                  </blockquote>
                ) : null}
                <p className="mt-2 font-body text-xs">
                  <a
                    className="text-vermillion underline underline-offset-2"
                    href={CASE_BY_NUMBER[selectedNumber].url}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {CASE_BY_NUMBER[selectedNumber].source}
                  </a>
                </p>
                {CASE_BY_NUMBER[selectedNumber].note ? (
                  <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground">
                    {CASE_BY_NUMBER[selectedNumber].note}
                  </p>
                ) : null}
              </section>
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
              <p className="mt-3 font-body text-xs leading-relaxed">
                本沙盘演示计谋机理，不对应某一场可考战斗；地名、队形与推进均为示意，不给兵力实数。
              </p>
            </footer>
          </div>
        ) : (
          <>
            <p className="sunzi-scope-note" data-testid="sunzi-scope-note">
              桂陵之战即第二计「围魏救赵」的出处；柏举之战早于《三十六计》成书，马陵之战是「减灶诱敌」的战例，二者都不是三十六计条目。
            </p>
            <ExplainPanel
              battleName={scene.name}
              sources={BATTLES[battleIndex].sources}
              step={step}
              stepIndex={stepIndex}
              totalSteps={scene.steps.length}
            />
          </>
        )}
      </aside>

      <div className="sunzi-bottom" data-testid="sunzi-bottom">
        <div className="sunzi-bottom__meta">
          <p className="font-kai text-sm text-ink">{scene.name}</p>
          <p className="font-body text-xs text-muted-foreground">
            {step.title} · 第 {stepIndex + 1} 幕 · {PRINCIPLE_BY_ID[step.principleId].name}
          </p>
        </div>

        <fieldset
          aria-label="战役四幕"
          className="sunzi-group sunzi-timeline"
          data-testid="sunzi-timeline"
        >
          <div
            aria-valuemax={scene.steps.length}
            aria-valuemin={1}
            aria-valuenow={stepIndex + 1}
            className="sunzi-progress"
            role="progressbar"
          >
            <span style={{ transform: `scaleX(${(stepIndex + 1) / scene.steps.length})` }} />
          </div>
          <ol className="grid grid-cols-4 gap-1">
            {scene.steps.map((item, index) => (
              <li key={item.id}>
                <button
                  aria-current={index === stepIndex ? "step" : undefined}
                  className={cn("sunzi-step w-full text-left", index === stepIndex && "is-active")}
                  onClick={() => goToStep(index)}
                  type="button"
                >
                  <span className="block truncate font-kai text-xs text-ink">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </fieldset>

        <fieldset aria-label="复盘控制" className="sunzi-group flex gap-1">
          <button
            aria-label="上一步"
            className="sunzi-chip inline-flex items-center justify-center"
            disabled={stepIndex === 0}
            onClick={() => goToStep(stepIndex - 1)}
            title="上一步"
            type="button"
          >
            <SkipBack aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label={playing ? "暂停" : "播放"}
            aria-pressed={playing}
            className={cn(
              "sunzi-chip sunzi-chip--play inline-flex items-center justify-center",
              playing && "is-active",
            )}
            data-sunzi-play-toggle=""
            onClick={() => setPlaying((current) => !current)}
            title={playing ? "暂停" : "播放"}
            type="button"
          >
            {playing ? (
              <Pause aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Play aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            aria-label="下一步"
            className="sunzi-chip inline-flex items-center justify-center"
            disabled={stepIndex === lastStep}
            onClick={() => goToStep(stepIndex + 1)}
            title="下一步"
            type="button"
          >
            <SkipForward aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </fieldset>

        <fieldset aria-label="播放速度" className="sunzi-group flex gap-1">
          {SPEED_OPTIONS.map((option) => (
            <button
              aria-label={`播放速度 ${option} 倍`}
              aria-pressed={speed === option}
              className={cn("sunzi-chip font-body text-xs", speed === option && "is-active")}
              key={option}
              onClick={() => setSpeed(option)}
              type="button"
            >
              {option}×
            </button>
          ))}
        </fieldset>

        <fieldset aria-label="视角" className="sunzi-group flex gap-1">
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

        <fieldset aria-label="缩放" className="sunzi-group flex items-center gap-1">
          <button
            aria-label="缩小沙盘"
            className="sunzi-chip inline-flex items-center justify-center"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => changeZoom(-0.1)}
            title="缩小沙盘"
            type="button"
          >
            <ZoomOut aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono-tech text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            aria-label="放大沙盘"
            className="sunzi-chip inline-flex items-center justify-center"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => changeZoom(0.1)}
            title="放大沙盘"
            type="button"
          >
            <ZoomIn aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="复位"
            className="sunzi-chip inline-flex items-center justify-center"
            onClick={resetView}
            title="复位"
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </fieldset>
      </div>
    </article>
  );
}
