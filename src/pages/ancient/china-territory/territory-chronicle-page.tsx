import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import { ChronicleMapPanel, type LayerVisibility } from "./chronicle-map-panel";
import { ChronicleMenu } from "./chronicle-menu";
import { ChronicleTimeline } from "./chronicle-timeline";
import { PeriodDetail } from "./period-detail";
import { CHRONICLE_PERIODS } from "./registry";
import {
  buildTimeStops,
  getPeriodIndexForYear,
  latestWarAtOrBefore,
  pastWarsAtOrBefore,
} from "./territory-overlays";
import "./territory-chronicle.css";

/** 自动播放每个时间停止点的停留时长（毫秒，1× 速度）。 */
const PLAY_STOP_MS = 2400;
export const PLAY_SPEEDS = [0.5, 1, 2] as const;
export type PlaySpeed = (typeof PLAY_SPEEDS)[number];

/**
 * 历代疆域编年 · 卫星战争沙盘：左上悬浮编年目录、全幅卫星地图、右侧当朝
 * 详情，底部年度时间轴。时间轴以「停止点」推进——每个停止点是一期疆域切换
 * 或一场战役开战的年份：疆域随朝代切换，战役随年份上线（最新一场画完整
 * 部署，已往战役留战场标记），有推进图记的战争弹小窗。
 */
export function TerritoryChroniclePage() {
  const stops = useMemo(() => buildTimeStops(CHRONICLE_PERIODS), []);
  const [stopIndex, setStopIndex] = useState(0);
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

  const stop = stops[stopIndex];
  const year = stop.year;
  const period = CHRONICLE_PERIODS[stop.periodIndex];
  const autoWar = useMemo(() => latestWarAtOrBefore(period, year), [period, year]);
  const selectedWar = selectedWarId
    ? (period.wars.find((war) => war.id === selectedWarId) ?? null)
    : null;
  const activeWar = selectedWar ?? autoWar;
  const pastWars = useMemo(
    () => pastWarsAtOrBefore(period, year, activeWar?.id ?? null),
    [period, year, activeWar],
  );
  const periodIndex = getPeriodIndexForYear(CHRONICLE_PERIODS, year);

  // 标签标题跟随当前年份读数。
  useEffect(() => {
    const focus = activeWar ? activeWar.name : period.name;
    const yearText = year < 0 ? `前${-year}` : `${year}`;
    document.title = `${yearText} ${focus} · 历代疆域编年 · 中国古代全览`;
  }, [period, activeWar, year]);

  // 自动播放：逐停止点推进，播到最后一站自动停（沙盘语义，hover 不暂停）。
  useEffect(() => {
    if (!playing) return;
    if (stopIndex >= stops.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStopIndex((current) => Math.min(current + 1, stops.length - 1)),
      PLAY_STOP_MS / speed,
    );
    return () => window.clearTimeout(timer);
  }, [playing, stopIndex, speed, stops.length]);

  // 页面隐藏时暂停播放（后台标签页不推进）。
  useEffect(() => {
    if (!playing) return;
    const onVisibilityChange = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [playing]);

  // 键盘：←/→ 逐停止点推进、Space 播放暂停；焦点在控件上时让位给控件自身行为。
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
        setStopIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setStopIndex((current) => Math.min(stops.length - 1, current + 1));
      } else if (event.code === "Space") {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stops.length]);

  const seekStop = useCallback(
    (index: number) => {
      setStopIndex(Math.max(0, Math.min(stops.length - 1, index)));
    },
    [stops.length],
  );

  const selectPeriod = useCallback(
    (index: number) => {
      setPlaying(false);
      setSelectedWarId(null);
      // 定位到该期的疆域切换停止点
      const target = stops.findIndex(
        (entry) => entry.kind === "period" && entry.periodIndex === index,
      );
      if (target >= 0) setStopIndex(target);
    },
    [stops],
  );

  const selectWar = useCallback(
    (warId: string | null) => {
      setSelectedWarId(warId);
      if (!warId) return;
      const target = stops.findIndex((entry) => entry.kind === "war" && entry.warId === warId);
      if (target >= 0) setStopIndex(target);
    },
    [stops],
  );

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  return (
    <article className="tch-root" data-testid="territory-chronicle-root">
      <header className="tch-header">
        <div className="tch-header-title">
          <h1>历代疆域编年 · 卫星战争沙盘</h1>
          <p>
            卫星影像之上按年份逐期推演疆域、都城、区划与战争｜所有边界为示意范围（据谭其骧《中国历史地图集》概化），非实测边界
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
            <i className="tch-legend-arrow" />
            推进
          </span>
          <span>
            <i className="tch-legend-cross">⚔</i>战场
          </span>
          <span>
            <i className="tch-legend-line" />
            边防
          </span>
        </div>
      </header>

      <div className="tch-body">
        <ChronicleMenu periodIndex={periodIndex} onSelect={selectPeriod} />
        <ChronicleMapPanel
          period={period}
          activeWar={activeWar}
          pastWars={pastWars}
          selectedWar={selectedWar}
          layers={layers}
          onWarElementClick={(warId) => selectWar(warId)}
        />
        <PeriodDetail
          period={period}
          selectedWarId={selectedWarId}
          currentYear={year}
          onSelectWar={(warId) => selectWar(warId === selectedWarId ? null : warId)}
        />
      </div>

      <ChronicleTimeline
        stops={stops}
        stopIndex={stopIndex}
        playing={playing}
        speed={speed}
        onSeek={seekStop}
        onTogglePlay={() => setPlaying((current) => !current)}
        onStep={(delta) => {
          setPlaying(false);
          setSelectedWarId(null);
          seekStop(stopIndex + delta);
        }}
        onSpeedChange={setSpeed}
      />
    </article>
  );
}
