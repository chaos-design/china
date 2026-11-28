import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import { ChronicleMapPanel, type LayerVisibility } from "./chronicle-map-panel";
import { ChronicleMenu } from "./chronicle-menu";
import { ChronicleTimeline } from "./chronicle-timeline";
import { PeriodDetail } from "./period-detail";
import { CHRONICLE_PERIODS } from "./registry";
import "./territory-chronicle.css";

/** 自动播放每期停留时长（毫秒，1× 速度）。 */
const PLAY_PERIOD_MS = 3800;
export const PLAY_SPEEDS = [0.5, 1, 2] as const;
export type PlaySpeed = (typeof PLAY_SPEEDS)[number];

/**
 * 历代疆域编年 · 卫星战争沙盘：左栏编年目录、中部 Leaflet 卫星地图、
 * 右栏当期详情，底部编年时间轴与播放控制。深色军事沙盘视觉与站内
 * 水墨页面刻意区隔（用户选定的呈现风格），样式全部收在本页 CSS。
 */
export function TerritoryChroniclePage() {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaySpeed>(1);
  const [layers, setLayers] = useState<LayerVisibility>({
    territory: true,
    capitals: true,
    divisions: true,
    defenses: true,
    wars: true,
    modernLabels: true,
  });
  const period = CHRONICLE_PERIODS[periodIndex];
  const selectedWar = useMemo(
    () => period.wars.find((war) => war.id === selectedWarId) ?? null,
    [period, selectedWarId],
  );

  // 页内切换朝代 / 战争时同步标签标题（读图焦点进标题）。
  useEffect(() => {
    const focus = selectedWar ? `${period.name} · ${selectedWar.name}` : period.name;
    document.title = `${focus} · 历代疆域编年 · 中国古代全览`;
  }, [period, selectedWar]);

  // 自动播放：按期推进，播到清为止（沙盘语义，hover 不暂停）。
  useEffect(() => {
    if (!playing) return;
    if (periodIndex >= CHRONICLE_PERIODS.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setPeriodIndex((current) => Math.min(current + 1, CHRONICLE_PERIODS.length - 1)),
      PLAY_PERIOD_MS / speed,
    );
    return () => window.clearTimeout(timer);
  }, [playing, periodIndex, speed]);

  // 页面隐藏时暂停播放（后台标签页不推进）。
  useEffect(() => {
    if (!playing) return;
    const onVisibilityChange = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [playing]);

  // 键盘：←/→ 切期、Space 播放暂停；焦点在控件上时让位给控件自身行为。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      // jsdom 在 window 上派发事件时 target 无 closest；真浏览器里 target 总是元素。
      if (
        element &&
        typeof element.closest === "function" &&
        element.closest("button, a, input, textarea, select, [contenteditable]")
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setPeriodIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setPeriodIndex((current) => Math.min(CHRONICLE_PERIODS.length - 1, current + 1));
      } else if (event.code === "Space") {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectPeriod = useCallback((index: number) => {
    setPlaying(false);
    setSelectedWarId(null);
    setPeriodIndex(index);
  }, []);

  const selectWar = useCallback((warId: string | null) => {
    setSelectedWarId(warId);
  }, []);

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  return (
    <article className="tch-root" data-testid="territory-chronicle-root">
      <header className="tch-header">
        <div className="tch-header-title">
          <h1>历代疆域编年 · 卫星战争沙盘</h1>
          <p>
            卫星影像之上逐朝复原疆域、都城、区划与战争｜所有边界为示意范围（据谭其骧《中国历史地图集》概化），非实测边界
          </p>
        </div>
        <fieldset className="tch-layer-chips">
          <legend className="sr-only">图层开关</legend>
          {(
            [
              ["territory", "疆域"],
              ["capitals", "都城"],
              ["divisions", "区划"],
              ["defenses", "边防"],
              ["wars", "战争"],
              ["modernLabels", "现代地名"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={cn("tch-chip", layers[key] && "is-on")}
              aria-pressed={layers[key]}
              onClick={() => toggleLayer(key)}
            >
              {label}
            </button>
          ))}
        </fieldset>
        <div className="tch-legend" aria-hidden="true">
          <span>
            <i className="tch-legend-star">★</i>都城
          </span>
          <span>
            <i className="tch-legend-dot" />
            郡·州·府
          </span>
          <span>
            <i className="tch-legend-line" />
            边防
          </span>
          <span>
            <i className="tch-legend-arrow" />
            战争
          </span>
        </div>
      </header>

      <div className="tch-body">
        <ChronicleMenu periodIndex={periodIndex} onSelect={selectPeriod} />
        <ChronicleMapPanel
          period={period}
          selectedWar={selectedWar}
          layers={layers}
          onWarElementClick={(warId) => selectWar(warId)}
        />
        <PeriodDetail
          period={period}
          selectedWarId={selectedWarId}
          onSelectWar={(warId) => selectWar(warId === selectedWarId ? null : warId)}
        />
      </div>

      <ChronicleTimeline
        periodIndex={periodIndex}
        playing={playing}
        speed={speed}
        onSeek={(index) => selectPeriod(index)}
        onTogglePlay={() => setPlaying((current) => !current)}
        onStep={(delta) => selectPeriod(periodIndex + delta)}
        onSpeedChange={setSpeed}
      />
    </article>
  );
}
