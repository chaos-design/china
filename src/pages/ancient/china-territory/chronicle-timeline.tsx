import { useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import {
  buildEraBands,
  buildPeriodBands,
  type ChronicleEvent,
  formatYear,
  formatYearMonth,
  fromMonthIndex,
  getPeriodIndexForMonth,
  monthRatio,
} from "./chronicle-time";
import { type ChroniclePeriod, ERA_COLORS, ERA_LABELS } from "./types";

/**
 * 底部月度时间轴：
 * - 滑杆以「月」为最小单位，横跨全部 20 期；
 * - 朝代进度用色带表达起止（每期一条，左右端有起止刻度），不在轨道上
 *   直接写 20 个名字（会重叠），hover 才浮出期名与年代；
 * - 六段时代标签单独一行，居中显示；
 * - 期起点 / 战争 / 控制变更各有刻度，hover 显示对应时间信息。
 */

export const PLAY_SPEEDS = [1, 4, 12] as const;
export type PlaySpeed = (typeof PLAY_SPEEDS)[number];
/** 1× 速度下每秒推进的月数（= 1 年/秒）。 */
export const BASE_MONTHS_PER_SECOND = 12;

interface HoverInfo {
  label: string;
  detail: string;
  ratio: number;
}

interface ChronicleTimelineProps {
  periods: readonly ChroniclePeriod[];
  events: readonly ChronicleEvent[];
  minMonth: number;
  maxMonth: number;
  month: number;
  playing: boolean;
  speed: PlaySpeed;
  onSeek: (month: number) => void;
  onStep: (months: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: PlaySpeed) => void;
}

function clampPercent(value: number): number {
  return Math.min(92, Math.max(8, value));
}

export function ChronicleTimeline({
  periods,
  events,
  minMonth,
  maxMonth,
  month,
  playing,
  speed,
  onSeek,
  onStep,
  onTogglePlay,
  onSpeedChange,
}: ChronicleTimelineProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const eraBands = useMemo(() => buildEraBands(periods), [periods]);
  const periodBands = useMemo(() => buildPeriodBands(periods), [periods]);
  const periodIndex = getPeriodIndexForMonth(periods, month);
  const period = periods[periodIndex];
  const date = fromMonthIndex(month);
  const ratio = monthRatio(month, minMonth, maxMonth);
  const currentEvent = useMemo(() => {
    // 最近一个 ≤ 当前月的事件（用于读出「当前节点」）
    let found: ChronicleEvent | null = null;
    for (const event of events) {
      if (event.month <= month) found = event;
      else break;
    }
    return found;
  }, [events, month]);

  const showHover = (info: Omit<HoverInfo, "ratio">, ratioValue: number) => {
    setHover({ ...info, ratio: ratioValue });
  };

  return (
    <footer className="tch-timeline">
      <div className="tch-timeline-controls">
        <button
          type="button"
          className="tch-tool-btn tch-step-btn"
          onClick={() => onStep(-1)}
          disabled={month <= minMonth}
          aria-label="上一个月"
          title="上一个月（←）"
        >
          −1 月
        </button>
        <button
          type="button"
          className={cn("tch-tool-btn", "tch-play-btn", playing && "is-playing")}
          onClick={onTogglePlay}
          aria-label={playing ? "暂停" : "播放"}
          title={playing ? "暂停（空格）" : "播放（空格）"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          <span>{playing ? "暂停" : "播放"}</span>
        </button>
        <button
          type="button"
          className="tch-tool-btn tch-step-btn"
          onClick={() => onStep(1)}
          disabled={month >= maxMonth}
          aria-label="下一个月"
          title="下一个月（→）"
        >
          +1 月
        </button>
        <label className="tch-speed">
          <span className="sr-only">播放速度</span>
          <select
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value) as PlaySpeed)}
            aria-label="播放速度"
          >
            {PLAY_SPEEDS.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tch-timeline-track">
        <div className="tch-era-labels">
          {eraBands.map((band) => {
            const left = monthRatio(band.startMonth, minMonth, maxMonth) * 100;
            const width = monthRatio(band.endMonth, minMonth, maxMonth) * 100 - left;
            return (
              <button
                key={band.era}
                type="button"
                tabIndex={-1}
                aria-label={`${ERA_LABELS[band.era]} · ${formatYear(
                  fromMonthIndex(band.startMonth).year,
                )} — ${formatYear(fromMonthIndex(band.endMonth).year)}`}
                className="tch-era-label"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0)}%`,
                  color: ERA_COLORS[band.era],
                }}
                onMouseEnter={() =>
                  showHover(
                    {
                      label: ERA_LABELS[band.era],
                      detail: `${formatYear(fromMonthIndex(band.startMonth).year)} — ${formatYear(
                        fromMonthIndex(band.endMonth).year,
                      )}`,
                    },
                    left / 100,
                  )
                }
                onMouseLeave={() => setHover(null)}
              >
                {ERA_LABELS[band.era]}
              </button>
            );
          })}
        </div>

        <div className="tch-period-bands">
          {periodBands.map((band) => {
            const left = monthRatio(band.startMonth, minMonth, maxMonth) * 100;
            const width = monthRatio(band.endMonth, minMonth, maxMonth) * 100 - left;
            const isCurrent = band.periodIndex === periodIndex;
            return (
              <button
                key={band.period.id}
                type="button"
                tabIndex={-1}
                aria-label={`${band.period.display ?? band.period.name} ${band.period.yearLabel}`}
                className={cn("tch-period-band", isCurrent && "is-current")}
                data-era={band.era}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0.2)}%`,
                  ["--era-color" as string]: ERA_COLORS[band.era],
                }}
                onMouseEnter={() =>
                  showHover(
                    {
                      label: band.period.display ?? band.period.name,
                      detail: `${band.period.yearLabel} · ${band.period.polities.length} 政权 · ${band.period.wars.length} 战`,
                    },
                    left / 100,
                  )
                }
                onMouseLeave={() => setHover(null)}
              ></button>
            );
          })}
        </div>

        <input
          type="range"
          className="tch-range"
          min={minMonth}
          max={maxMonth}
          step={1}
          value={month}
          aria-label="推进时间轴（按月）"
          aria-valuetext={`${formatYearMonth(date)} ${period.display ?? period.name}`}
          onChange={(event) => onSeek(Number(event.target.value))}
        />

        <div className="tch-ticks">
          {events.map((event, index) => {
            const at = monthRatio(event.month, minMonth, maxMonth);
            return (
              <button
                key={`${event.kind}-${event.month}-${index}`}
                type="button"
                tabIndex={-1}
                aria-label={`${event.label} · ${event.detail}`}
                className={cn(
                  "tch-tick",
                  `is-${event.kind}`,
                  event.month === month && "is-current",
                )}
                style={{ left: `${at * 100}%` }}
                onMouseEnter={() =>
                  showHover(
                    {
                      label: event.label,
                      detail: event.detail,
                    },
                    at,
                  )
                }
                onMouseLeave={() => setHover(null)}
              ></button>
            );
          })}
        </div>

        <div className="tch-cursor" aria-hidden="true" style={{ left: `${ratio * 100}%` }} />
        {hover ? (
          <div
            className="tch-timeline-tip"
            style={{ left: `${clampPercent(hover.ratio * 100)}%` }}
            role="status"
          >
            <strong>{hover.label}</strong>
            <span>{hover.detail}</span>
          </div>
        ) : null}
      </div>

      <div className="tch-timeline-readout">
        <strong className="tch-year">{formatYearMonth(date)}</strong>
        <span className="tch-stop-label">
          {playing ? <i className="tch-live-dot" aria-hidden="true" /> : null}
          {period.display ?? period.name}
          {currentEvent ? ` · ${currentEvent.label}` : ""}
        </span>
      </div>
    </footer>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="7" y="5" width="3.6" height="14" rx="1" fill="currentColor" />
      <rect x="13.4" y="5" width="3.6" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}
