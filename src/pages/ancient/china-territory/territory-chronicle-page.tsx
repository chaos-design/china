import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import { resolvePeriodAt } from "./chronicle-control";
import { ChronicleMapPanel, type LayerVisibility } from "./chronicle-map-panel";
import { ChronicleMenu } from "./chronicle-menu";
import {
  annalsAtOrBefore,
  buildChronicleEvents,
  formatYearMonth,
  fromMonthIndex,
  getPeriodIndexForMonth,
  latestWarAtOrBeforeMonth,
  pastWarsAtOrBeforeMonth,
  periodEndMonth,
  periodStartMonth,
  warStartMonth,
} from "./chronicle-time";
import { BASE_MONTHS_PER_SECOND, ChronicleTimeline, type PlaySpeed } from "./chronicle-timeline";
import { type ChronicleHover, PeriodDetail } from "./period-detail";
import { CHRONICLE_PERIODS } from "./registry";
import "./territory-chronicle.css";

/** 播放定时器步长（毫秒）；1× 下每步推进 3 个月 = 1 年/秒。 */
const PLAY_TICK_MS = 250;

/**
 * 历代疆域编年 · 卫星战争沙盘：左上悬浮编年目录、全幅卫星地图、右侧当朝
 * 详情，底部月度时间轴。时间轴以「月」为最小单位——疆域按当前月份的控制
 * 图绘制（被吞并政权的疆域转归接管方，同一区域不会同时属于两个政权），
 * 战役按开战月份上线，右侧编年速报随播放实时更新。
 */
export function TerritoryChroniclePage() {
  const minMonth = useMemo(() => periodStartMonth(CHRONICLE_PERIODS[0]), []);
  const maxMonth = useMemo(
    () => periodEndMonth(CHRONICLE_PERIODS[CHRONICLE_PERIODS.length - 1]),
    [],
  );
  const events = useMemo(() => buildChronicleEvents(CHRONICLE_PERIODS), []);
  const [month, setMonth] = useState(minMonth);
  const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaySpeed>(1);
  const [hover, setHover] = useState<ChronicleHover | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>({
    territory: true,
    capitals: true,
    divisions: true,
    defenses: true,
    wars: true,
    modernLabels: true,
  });

  const periodIndex = getPeriodIndexForMonth(CHRONICLE_PERIODS, month);
  const period = CHRONICLE_PERIODS[periodIndex];
  const resolved = useMemo(() => resolvePeriodAt(period, month), [period, month]);
  const autoWar = useMemo(() => latestWarAtOrBeforeMonth(period, month), [period, month]);
  const selectedWar = selectedWarId
    ? (period.wars.find((war) => war.id === selectedWarId) ?? null)
    : null;
  const activeWar = selectedWar ?? autoWar;
  const pastWars = useMemo(
    () => pastWarsAtOrBeforeMonth(period, month, activeWar?.id ?? null),
    [period, month, activeWar],
  );
  const annals = useMemo(() => annalsAtOrBefore(period, month), [period, month]);
  const date = fromMonthIndex(month);

  const clampMonth = useCallback(
    (value: number) => Math.max(minMonth, Math.min(maxMonth, value)),
    [minMonth, maxMonth],
  );

  // 标签标题跟随当前年月读数。
  useEffect(() => {
    const focus = activeWar ? activeWar.name : period.name;
    document.title = `${formatYearMonth(date)} ${focus} · 历代疆域编年 · 中国古代全览`;
  }, [period, activeWar, date]);

  // 自动播放：按月推进（1× = 1 年/秒），播到最后一月自动停。
  useEffect(() => {
    if (!playing) return;
    const monthsPerTick = Math.max(
      1,
      Math.round((BASE_MONTHS_PER_SECOND * speed * PLAY_TICK_MS) / 1000),
    );
    const timer = window.setInterval(() => {
      setMonth((current) => Math.min(maxMonth, current + monthsPerTick));
    }, PLAY_TICK_MS);
    return () => window.clearInterval(timer);
  }, [playing, speed, maxMonth]);

  useEffect(() => {
    if (month >= maxMonth) setPlaying(false);
  }, [month, maxMonth]);

  // 页面隐藏时暂停播放（后台标签页不推进）。
  useEffect(() => {
    if (!playing) return;
    const onVisibilityChange = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [playing]);

  // 键盘：←/→ 逐月推进、Space 播放暂停；焦点在控件上时让位给控件自身行为。
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
        setSelectedWarId(null);
        setMonth((current) => Math.max(minMonth, current - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setSelectedWarId(null);
        setMonth((current) => Math.min(maxMonth, current + 1));
      } else if (event.code === "Space") {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [minMonth, maxMonth]);

  const seekMonth = useCallback(
    (value: number) => {
      setPlaying(false);
      setSelectedWarId(null);
      setMonth(clampMonth(value));
    },
    [clampMonth],
  );

  const stepMonth = useCallback(
    (delta: number) => {
      setPlaying(false);
      setSelectedWarId(null);
      setMonth((current) => clampMonth(current + delta));
    },
    [clampMonth],
  );

  const selectPeriod = useCallback(
    (index: number) => {
      const target = CHRONICLE_PERIODS[index];
      if (!target) return;
      setPlaying(false);
      setSelectedWarId(null);
      setMonth(clampMonth(periodStartMonth(target)));
    },
    [clampMonth],
  );

  const selectWar = useCallback(
    (warId: string | null) => {
      if (!warId) {
        setSelectedWarId(null);
        return;
      }
      const war = period.wars.find((entry) => entry.id === warId);
      if (!war) return;
      setPlaying(false);
      setSelectedWarId(warId);
      // 战争开始月份可能落在边界年份的另一侧（如夏末「约前1600」的鸣条之战
      // 与商期同起点），夹在本期的有效区间内才不会让选中战役因换期而丢失。
      const next = CHRONICLE_PERIODS[periodIndex + 1];
      const upper = next ? periodStartMonth(next) - 1 : periodEndMonth(period);
      setMonth(clampMonth(Math.min(upper, Math.max(periodStartMonth(period), warStartMonth(war)))));
    },
    [clampMonth, period, periodIndex],
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
            卫星影像之上按月推演疆域、都城、区划与战争｜所有边界为示意范围（据谭其骧《中国历史地图集》概化），非实测边界
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
          <span title="红色 = 甲方（sideA）">
            <i className="tch-legend-arrow is-side1" />
            甲方
          </span>
          <span title="蓝色 = 乙方（sideB）">
            <i className="tch-legend-arrow is-side2" />
            乙方
          </span>
          <span>
            <i className="tch-legend-cross">⚔</i>战场
          </span>
          <span>
            <i className="tch-legend-line" />
            边防
          </span>
          <span>
            <i className="tch-legend-old" />
            旧疆
          </span>
        </div>
      </header>

      <div className="tch-body">
        <ChronicleMenu periodIndex={periodIndex} onSelect={selectPeriod} />
        <ChronicleMapPanel
          period={period}
          month={month}
          resolved={resolved}
          activeWar={activeWar}
          pastWars={pastWars}
          selectedWar={selectedWar}
          layers={layers}
          onWarElementClick={(warId) => selectWar(warId)}
          onPolityHover={(info) => setHover(info ? { kind: "polity", info } : null)}
          onWarOpHover={(info) => setHover(info ? { kind: "war", info } : null)}
        />
        <PeriodDetail
          period={period}
          month={month}
          resolved={resolved}
          annals={annals}
          hover={hover}
          selectedWarId={selectedWarId}
          onSelectWar={(warId) => selectWar(warId === selectedWarId ? null : warId)}
        />
      </div>

      <ChronicleTimeline
        periods={CHRONICLE_PERIODS}
        events={events}
        minMonth={minMonth}
        maxMonth={maxMonth}
        month={month}
        playing={playing}
        speed={speed}
        onSeek={seekMonth}
        onStep={stepMonth}
        onTogglePlay={() => setPlaying((current) => !current)}
        onSpeedChange={setSpeed}
      />
    </article>
  );
}
