import { useEffect, useRef, useState } from "react";
import { createTerritoryScene, type TerritoryLayerKey, type TerritoryScene } from "./leaflet-scene";
import type { ChroniclePeriod, WarEvent } from "./types";

/**
 * 地图宿主：命令式 Leaflet 场景的唯一 React 触点。
 * 场景实例入 state（与 use-rank-tree-scene 同构），让每个同步 effect
 * 在首次创建与后续更新时都会执行；容器尺寸由 Leaflet 自行接管。
 * 年度推进：疆域层随 period 重建，战争层随 activeWar/pastWars 重建，
 * 显式选中的战争触发 flyTo 聚焦；带推进图记的战争弹小窗。
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
  activeWar: WarEvent | null;
  pastWars: readonly WarEvent[];
  /** 用户显式点选的战争（非年度自动上线）——只对它做 flyTo 聚焦。 */
  selectedWar: WarEvent | null;
  layers: LayerVisibility;
  onWarElementClick: (warId: string) => void;
}

export function ChronicleMapPanel({
  period,
  activeWar,
  pastWars,
  selectedWar,
  layers,
  onWarElementClick,
}: ChronicleMapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 场景实例入 state：同步 effect 依赖 scene，创建完成即触发首次 setPeriod。
  const [scene, setScene] = useState<TerritoryScene | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const clickRef = useRef(onWarElementClick);
  clickRef.current = onWarElementClick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const instance = createTerritoryScene(container, {
      onWarElementClick: (warId) => clickRef.current(warId),
    });
    setScene(instance);
    return () => {
      instance.destroy();
      setScene(null);
    };
  }, []);

  // 切期重建疆域覆盖层：首帧不动画（直接落位），此后切换带飞行。
  const firstPeriodRef = useRef(true);
  useEffect(() => {
    if (!scene) return;
    const animate = !firstPeriodRef.current && !prefersReducedMotion();
    firstPeriodRef.current = false;
    scene.setPeriod(period, animate);
  }, [scene, period]);

  // 年度推进的战争层：部署箭头随年份上线，历史战场累积保留。
  useEffect(() => {
    if (!scene) return;
    scene.setWarState(activeWar, pastWars);
  }, [scene, activeWar, pastWars]);

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

  // 换战争时重置小窗展开状态
  useEffect(() => {
    setBriefingOpen(true);
  }, []);

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
      {activeWar?.phases?.length && briefingOpen ? (
        <WarBriefing war={activeWar} onClose={() => setBriefingOpen(false)} />
      ) : null}
    </section>
  );
}

/** 战役推进小窗：有 phases 的战争在地图左下角浮出，按时间列推进节点。 */
function WarBriefing({ war, onClose }: { war: WarEvent; onClose: () => void }) {
  return (
    <aside className="tch-briefing" aria-label={`${war.name}战役推进`}>
      <header className="tch-briefing-head">
        <h3>
          ⚔ {war.name}
          <span className="tch-briefing-year">{formatYearRange(war.year)}</span>
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
      <ol className="tch-briefing-phases">
        {war.phases?.map((phase) => (
          <li key={phase.year + phase.text}>
            <span className="tch-phase-year">{phase.year}</span>
            <span className="tch-phase-text">{phase.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function formatYearRange(year: string): string {
  return `（${year}）`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
