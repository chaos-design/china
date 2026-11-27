import { PRINCIPLE_BY_ID, THREAD } from "./principles";
import type { BattleStep } from "./types";

export interface ExplainPanelProps {
  battleName: string;
  step: BattleStep;
  stepIndex: number;
  totalSteps: number;
}

/** The reading rail: situation, decision, the source line, and the result of one move. */
export function ExplainPanel({ battleName, step, stepIndex, totalSteps }: ExplainPanelProps) {
  const principle = PRINCIPLE_BY_ID[step.principleId];

  return (
    <div className="flex h-full flex-col gap-5 px-4 py-5 sm:px-5" data-testid="sunzi-explain">
      <div>
        <h2 className="font-brush text-2xl text-ink">读这一幕</h2>
        <p className="mt-1 font-body text-muted-foreground text-xs">
          {battleName} 第 {stepIndex + 1} 幕，共 {totalSteps} 幕
        </p>
      </div>

      <section className="sunzi-note">
        <h3 className="sunzi-note__head">战场态势</h3>
        <p className="sunzi-note__body">{step.situation}</p>
      </section>

      <section className="sunzi-note">
        <h3 className="sunzi-note__head">关键决策</h3>
        <p className="sunzi-note__body">{step.decision}</p>
      </section>

      <section className="sunzi-quote">
        <p className="font-kai text-xl leading-relaxed text-ink">「{principle.quote}」</p>
        <p className="mt-1 font-body text-muted-foreground text-xs">{principle.source}</p>
        <p className="mt-3 font-body text-ink/85 text-sm leading-relaxed">{principle.plain}</p>
      </section>

      <section className="sunzi-note">
        <h3 className="sunzi-note__head">结果变化</h3>
        <p className="sunzi-note__body">{step.outcome}</p>
      </section>

      <section>
        <h3 className="sunzi-note__head">六条要义如何贯穿三役</h3>
        <ol className="mt-2 flex flex-col gap-1">
          {THREAD.map((entry) => {
            const current = entry.principleId === step.principleId;

            return (
              <li
                aria-current={current ? "true" : undefined}
                className="sunzi-thread-row"
                data-current={current}
                key={`${entry.battle}-${entry.moment}`}
              >
                <span className="font-kai text-sm text-ink">{entry.moment}</span>
                <span className="font-body text-muted-foreground text-xs">
                  {PRINCIPLE_BY_ID[entry.principleId].name}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="sunzi-source mt-auto border-ink/10 border-t pt-3 font-body text-muted-foreground text-xs leading-relaxed">
        据《左传》《史记》《资治通鉴》相关记载的大意重绘。地名关系、推进线与控区均为示意，不是测绘，也不给兵力实数。
      </footer>
    </div>
  );
}
