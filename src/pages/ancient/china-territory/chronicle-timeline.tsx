import { cn } from "../../../lib/utils";
import { CHRONICLE_PERIODS, periodsOfEra } from "./registry";
import type { TimeStop } from "./territory-overlays";
import { type ChronicleEra, ERA_LABELS } from "./types";

/**
 * 底部年度时间轴（紧凑单行）：滑杆逐「停止点」推进——每一站是一期疆域切换
 * 或一场战役开战。刻度按类型分（期=竖杠，战=圆点），时代起点标朝代名。
 * 年份读出用 tabular numerals，避免推进时抖动。
 */

export function formatYear(year: number): string {
  return year < 0 ? `前${-year}` : `${year}`;
}

interface ChronicleTimelineProps {
  stops: readonly TimeStop[];
  stopIndex: number;
  playing: boolean;
  speed: 0.5 | 1 | 2;
  onSeek: (index: number) => void;
  onTogglePlay: () => void;
  onStep: (delta: number) => void;
  onSpeedChange: (speed: 0.5 | 1 | 2) => void;
}

const ERA_ORDER: readonly ChronicleEra[] = [
  "pre-qin",
  "qin-han",
  "wei-jin",
  "sui-tang",
  "song-yuan",
  "ming-qing",
];

/** 时代起点期的 id（时间轴上只给这些期标文字，避免 20 个标签互相压字）。 */
const ERA_FIRST_IDS = new Set(
  ERA_ORDER.flatMap((era) =>
    periodsOfEra(era)
      .slice(0, 1)
      .map((period) => period.id),
  ),
);

export function ChronicleTimeline({
  stops,
  stopIndex,
  playing,
  speed,
  onSeek,
  onTogglePlay,
  onStep,
  onSpeedChange,
}: ChronicleTimelineProps) {
  const last = stops.length - 1;
  const stop = stops[stopIndex];
  const eraStripStarts = ERA_ORDER.map((era) => {
    const firstIndex = stops.findIndex(
      (entry) =>
        entry.kind === "period" &&
        entry.periodIndex === CHRONICLE_PERIODS.findIndex((p) => p.era === era),
    );
    return { era, firstIndex: Math.max(0, firstIndex) };
  });
  return (
    <footer className="tch-timeline">
      <div className="tch-timeline-controls">
        <button
          type="button"
          className="tch-tool-btn"
          onClick={() => onStep(-1)}
          disabled={stopIndex === 0}
          aria-label="上一个时间点"
        >
          ◀
        </button>
        <button
          type="button"
          className={cn("tch-tool-btn", "tch-play-btn", playing && "is-playing")}
          onClick={onTogglePlay}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          className="tch-tool-btn"
          onClick={() => onStep(1)}
          disabled={stopIndex === last}
          aria-label="下一个时间点"
        >
          ▶
        </button>
        <label className="tch-speed">
          <span className="sr-only">播放速度</span>
          <select
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value) as 0.5 | 1 | 2)}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>
      <div className="tch-timeline-track">
        <input
          type="range"
          className="tch-range"
          min={0}
          max={last}
          step={1}
          value={stopIndex}
          aria-label="推进时间轴（按年份停止点）"
          aria-valuetext={`${formatYear(stop.year)} ${stop.label}`}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div className="tch-ticks" aria-hidden="true">
          {stops.map((entry, index) => {
            const periodAtStop = CHRONICLE_PERIODS[entry.periodIndex];
            const showLabel = entry.kind === "period" && ERA_FIRST_IDS.has(periodAtStop.id);
            return (
              <span
                key={`${entry.kind}-${entry.warId ?? periodAtStop.id}-${index}`}
                className={cn(
                  "tch-tick",
                  entry.kind === "war" && "is-war",
                  index === stopIndex && "is-current",
                )}
                style={{ left: `${(index / last) * 100}%` }}
                data-era={periodAtStop.era}
              >
                {showLabel ? (
                  <i className="tch-tick-label">{periodAtStop.display ?? periodAtStop.name}</i>
                ) : null}
              </span>
            );
          })}
        </div>
        <div className="tch-era-strip" aria-hidden="true">
          {eraStripStarts.map(({ era, firstIndex }) => (
            <span
              key={era}
              data-era={era}
              style={{ position: "absolute", left: `${(firstIndex / last) * 100}%` }}
            >
              {ERA_LABELS[era]}
            </span>
          ))}
        </div>
      </div>
      <div className="tch-timeline-readout">
        <strong className="tch-year">{formatYear(stop.year)}</strong>
        <span className="tch-stop-label">
          {stop.kind === "war" ? "⚔ " : ""}
          {stop.label}
        </span>
      </div>
    </footer>
  );
}
