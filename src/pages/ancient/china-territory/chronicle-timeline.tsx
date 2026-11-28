import { cn } from "../../../lib/utils";
import { CHRONICLE_PERIODS } from "./registry";
import { ERA_LABELS } from "./types";

/**
 * 底部编年时间轴：20 期刻度的滑杆 + 上一步/自动播放/下一步 + 倍速。
 * 刻度按时代着色，当前期读出名称与年代（tabular numerals，避免抖动）。
 */

interface ChronicleTimelineProps {
  periodIndex: number;
  playing: boolean;
  speed: 0.5 | 1 | 2;
  onSeek: (index: number) => void;
  onTogglePlay: () => void;
  onStep: (delta: number) => void;
  onSpeedChange: (speed: 0.5 | 1 | 2) => void;
}

export function ChronicleTimeline({
  periodIndex,
  playing,
  speed,
  onSeek,
  onTogglePlay,
  onStep,
  onSpeedChange,
}: ChronicleTimelineProps) {
  const period = CHRONICLE_PERIODS[periodIndex];
  const last = CHRONICLE_PERIODS.length - 1;
  return (
    <footer className="tch-timeline">
      <div className="tch-timeline-controls">
        <button
          type="button"
          className="tch-tool-btn"
          onClick={() => onStep(-1)}
          disabled={periodIndex === 0}
        >
          ◀ 上一步
        </button>
        <button
          type="button"
          className={cn("tch-tool-btn", "tch-play-btn", playing && "is-playing")}
          onClick={onTogglePlay}
        >
          {playing ? "❚❚ 暂停" : "▶ 自动播放"}
        </button>
        <button
          type="button"
          className="tch-tool-btn"
          onClick={() => onStep(1)}
          disabled={periodIndex === last}
        >
          下一步 ▶
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
          value={periodIndex}
          aria-label="选择编年时期"
          aria-valuetext={`${period.display ?? period.name} ${period.yearLabel}`}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div className="tch-ticks" aria-hidden="true">
          {CHRONICLE_PERIODS.map((entry, index) => {
            // 20 个标签挤在一条轴上会互相压字：只在时代起始期与当前期显示文字
            const isFirstOfEra = CHRONICLE_PERIODS.findIndex((p) => p.era === entry.era) === index;
            const showLabel = isFirstOfEra || index === periodIndex;
            return (
              <span
                key={entry.id}
                className={cn("tch-tick", index === periodIndex && "is-current")}
                style={{ left: `${(index / last) * 100}%` }}
                data-era={entry.era}
              >
                {showLabel ? <i className="tch-tick-label">{entry.display ?? entry.name}</i> : null}
              </span>
            );
          })}
        </div>
        <div className="tch-era-strip" aria-hidden="true">
          {(["pre-qin", "qin-han", "wei-jin", "sui-tang", "song-yuan", "ming-qing"] as const).map(
            (era) => (
              <span key={era} data-era={era}>
                {ERA_LABELS[era]}
              </span>
            ),
          )}
        </div>
      </div>
      <div className="tch-timeline-readout">
        <strong>{period.display ?? period.name}</strong>
        <span>{period.yearLabel}</span>
      </div>
    </footer>
  );
}
