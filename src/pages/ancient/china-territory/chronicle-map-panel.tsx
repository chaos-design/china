import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import { controlSignature, type ResolvedPeriod } from "./chronicle-control";
import { formatYearMonth, fromMonthIndex } from "./chronicle-time";
import {
  type BattleInsetScene,
  createBattleInset,
  createTerritoryScene,
  type PolityHoverInfo,
  type TerritoryLayerKey,
  type TerritoryScene,
  type WarOpHoverInfo,
} from "./leaflet-scene";
import { RareName } from "./rare-pinyin";
import type { ChroniclePeriod, WarEvent } from "./types";

/**
 * 地图宿主：命令式 Leaflet 场景的唯一 React 触点。
 * 场景实例入 state（与 use-rank-tree-scene 同构），让每个同步 effect
 * 在首次创建与后续更新时都会执行；容器尺寸由 Leaflet 自行接管。
 * 控制图只在「控制签名」变化时重建（月份推进但归属没变时不重绘），
 * 战争层随 activeWar/pastWars 重建；显式选中的战争触发 flyTo 聚焦。
 */

export interface LayerVisibility {
  territory: boolean;
  capitals: boolean;
  divisions: boolean;
  defenses: boolean;
  wars: boolean;
  modernLabels: boolean;
}

const LAYER_KEYS: readonly TerritoryLayerKey[] = [
  "territory",
  "capitals",
  "divisions",
  "defenses",
  "wars",
];

interface ChronicleMapPanelProps {
  period: ChroniclePeriod;
  /** 当前月份序号。 */
  month: number;
  /** 当前月份的控制解析结果。 */
  resolved: ResolvedPeriod;
  activeWar: WarEvent | null;
  pastWars: readonly WarEvent[];
  /** 用户显式点选的战争（非年度自动上线）——只对它做 flyTo 聚焦。 */
  selectedWar: WarEvent | null;
  layers: LayerVisibility;
  onWarElementClick: (warId: string) => void;
  onPolityHover: (info: PolityHoverInfo | null) => void;
  onWarOpHover: (info: WarOpHoverInfo | null) => void;
}

export function ChronicleMapPanel({
  period,
  month,
  resolved,
  activeWar,
  pastWars,
  selectedWar,
  layers,
  onWarElementClick,
  onPolityHover,
  onWarOpHover,
}: ChronicleMapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const insetRef = useRef<HTMLDivElement>(null);
  // 场景实例入 state：同步 effect 依赖 scene，创建完成即触发首次 setPeriod。
  const [scene, setScene] = useState<TerritoryScene | null>(null);
  const [inset, setInset] = useState<BattleInsetScene | null>(null);
  // 记录「用户收起小窗」对应的战役；换战役后自动重新展开，无需额外 effect。
  const [closedBriefingFor, setClosedBriefingFor] = useState<string | null>(null);
  const clickRef = useRef(onWarElementClick);
  clickRef.current = onWarElementClick;
  const polityHoverRef = useRef(onPolityHover);
  polityHoverRef.current = onPolityHover;
  const warOpHoverRef = useRef(onWarOpHover);
  warOpHoverRef.current = onWarOpHover;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const instance = createTerritoryScene(container, {
      onWarElementClick: (warId) => clickRef.current(warId),
      onPolityHover: (info) => polityHoverRef.current(info),
      onWarOpHover: (info) => warOpHoverRef.current(info),
    });
    setScene(instance);
    return () => {
      instance.destroy();
      setScene(null);
    };
  }, []);

  // 战役局部放大（第二张小地图）：与主图独立取景，播放中自动跟随当前战役。
  useEffect(() => {
    const container = insetRef.current;
    if (!container) return;
    const instance = createBattleInset(container);
    setInset(instance);
    return () => {
      instance.destroy();
      setInset(null);
    };
  }, []);

  useEffect(() => {
    inset?.setWar(activeWar);
  }, [inset, activeWar]);

  // 控制图签名：月份推进但归属没变时不重建覆盖层（避免播放时每帧重绘）。
  const signature = useMemo(() => controlSignature(resolved), [resolved]);
  const firstPeriodRef = useRef(true);
  const lastSignatureRef = useRef<string | null>(null);
  const lastPeriodRef = useRef<ChroniclePeriod | null>(null);
  useEffect(() => {
    if (!scene) return;
    const periodChanged = lastPeriodRef.current?.id !== period.id;
    const signatureChanged = lastSignatureRef.current !== signature;
    if (!periodChanged && !signatureChanged) return;
    const animate = !firstPeriodRef.current && !prefersReducedMotion();
    firstPeriodRef.current = false;
    lastPeriodRef.current = period;
    lastSignatureRef.current = signature;
    scene.setPeriod(period, month, animate);
  }, [scene, period, month, signature]);

  // 年度推进的战争层：部署箭头随月份上线，历史战场累积保留。
  // 只有 activeWar / 历史战场集合变化时才重建（月份推进本身不重绘图层）。
  const warSignature = `${activeWar?.id ?? ""}|${pastWars.map((war) => war.id).join(",")}`;
  const lastWarSignatureRef = useRef<string | null>(null);
  useEffect(() => {
    if (!scene) return;
    if (lastWarSignatureRef.current === warSignature) return;
    lastWarSignatureRef.current = warSignature;
    scene.setWarState(activeWar, pastWars, month);
  }, [scene, activeWar, pastWars, month, warSignature]);

  // 显式选中的战争才飞行聚焦（年度自动上线不打断浏览视角）。
  const lastFlownRef = useRef<string | null>(null);
  useEffect(() => {
    if (!scene || !selectedWar) return;
    if (lastFlownRef.current === selectedWar.id) return;
    lastFlownRef.current = selectedWar.id;
    if (!prefersReducedMotion()) {
      scene.flyToWar(selectedWar);
    }
  }, [scene, selectedWar]);

  // 图层开关逐键同步。
  useEffect(() => {
    if (!scene) return;
    for (const key of LAYER_KEYS) {
      scene.setLayerVisible(key, layers[key]);
    }
    scene.setModernLabels(layers.modernLabels);
  }, [scene, layers]);

  const date = fromMonthIndex(month);
  const briefingOpen = closedBriefingFor !== (activeWar?.id ?? null);
  return (
    <section className="tch-map-panel" aria-label="疆域沙盘地图">
      <div ref={containerRef} className="tch-map-container" />
      <button
        type="button"
        className="tch-reset-view"
        onClick={() => scene?.resetView()}
        title="回到本期全览视角"
      >
        复位视角
      </button>
      <div className="tch-control-strip" aria-hidden="true">
        <span className="tch-control-date">{formatYearMonth(date)}</span>
        {resolved.activePolities.map((entry) => (
          <span key={entry.polity.id} className="tch-control-chip">
            <i style={{ background: entry.polity.color }} />
            {entry.polity.name}
            {entry.absorbedNames.length > 0 ? <em>+{entry.absorbedNames.length}</em> : null}
          </span>
        ))}
      </div>
      <section
        className={cn("tch-battle-inset", !activeWar && "is-empty")}
        aria-label={activeWar ? `${activeWar.name}战场放大图` : "战场放大图"}
        aria-hidden={activeWar ? undefined : true}
      >
        <header>
          <strong>{activeWar ? `⚔ ${activeWar.name}` : "战场放大"}</strong>
          <span>{activeWar?.year ?? "暂无战役"}</span>
        </header>
        <div ref={insetRef} className="tch-battle-inset-map" />
        <footer>
          {activeWar ? (
            <>
              <i className="is-side1" />
              甲方 {activeWar.sideA}
              <i className="is-side2" />
              乙方 {activeWar.sideB}
            </>
          ) : (
            "推进时间轴至战役年份即自动放大"
          )}
        </footer>
      </section>
      {activeWar?.phases?.length && briefingOpen ? (
        <WarBriefing
          war={activeWar}
          month={month}
          onClose={() => setClosedBriefingFor(activeWar?.id ?? null)}
          onFocus={() => onWarElementClick(activeWar.id)}
        />
      ) : null}
    </section>
  );
}

/** 战役推进小窗：有 phases 的战争在地图右侧浮出（不压左侧目录与底部时间轴）。 */
function WarBriefing({
  war,
  month,
  onClose,
  onFocus,
}: {
  war: WarEvent;
  month: number;
  onClose: () => void;
  onFocus: () => void;
}) {
  const currentYear = fromMonthIndex(month).year;
  const phases = war.phases ?? [];
  // 当前月份已推进到的阶段（按阶段年份粗略匹配；阶段年份是文本，能解析则高亮）
  const currentPhaseIndex = phases.reduce((last, phase, index) => {
    const match = /(-?\d+)/.exec(phase.year.replace("前", "-"));
    if (match && Number(match[1]) <= currentYear) return index;
    return last;
  }, -1);
  return (
    <aside className="tch-briefing" aria-label={`${war.name}战役推进`}>
      <header className="tch-briefing-head">
        <h3>
          ⚔ <RareName name={war.name} />
          <span className="tch-briefing-year">（{war.year}）</span>
        </h3>
        <button
          type="button"
          className="tch-briefing-close"
          onClick={onClose}
          aria-label="收起战役推进"
        >
          ×
        </button>
      </header>
      <p className="tch-briefing-sides">
        {war.sideA} <i>vs</i> {war.sideB}
      </p>
      <p className="tch-briefing-brief">{war.brief}</p>
      <div className="tch-briefing-stats">
        <span>
          规模 <strong>{war.scale ?? "史无确数"}</strong>
        </span>
        <span>
          损失 <strong>{war.losses ?? "史无确数"}</strong>
        </span>
      </div>
      <ol className="tch-briefing-phases">
        {phases.map((phase, index) => (
          <li
            key={phase.year + phase.text}
            className={index === currentPhaseIndex ? "is-current" : undefined}
          >
            <span className="tch-phase-year">{phase.year}</span>
            <span className="tch-phase-text">{phase.text}</span>
          </li>
        ))}
      </ol>
      <div className="tch-briefing-detail">
        <p>{war.detail}</p>
        <p className="tch-briefing-outcome">结局：{war.outcome}</p>
        <p className="tch-briefing-sources">出处：{war.sources.join("；")}</p>
      </div>
      <button type="button" className="tch-briefing-focus" onClick={onFocus}>
        在地图上聚焦战场
      </button>
    </aside>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
