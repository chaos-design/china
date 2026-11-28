import { useEffect, useRef, useState } from "react";
import { createTerritoryScene, type TerritoryLayerKey, type TerritoryScene } from "./leaflet-scene";
import type { ChroniclePeriod, WarEvent } from "./types";

/**
 * 地图宿主：命令式 Leaflet 场景的唯一 React 触点。
 * 场景实例入 state（与 use-rank-tree-scene 同构），让每个同步 effect
 * 在首次创建与后续更新时都会执行；容器尺寸由 Leaflet 自行接管。
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
  selectedWar: WarEvent | null;
  layers: LayerVisibility;
  onWarElementClick: (warId: string) => void;
}

export function ChronicleMapPanel({
  period,
  selectedWar,
  layers,
  onWarElementClick,
}: ChronicleMapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 场景实例入 state：同步 effect 依赖 scene，创建完成即触发首次 setPeriod。
  const [scene, setScene] = useState<TerritoryScene | null>(null);
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

  // 切期重建覆盖层：首帧不动画（直接落位），此后切换带飞行。
  const firstPeriodRef = useRef(true);
  useEffect(() => {
    if (!scene) return;
    const animate = !firstPeriodRef.current && !prefersReducedMotion();
    firstPeriodRef.current = false;
    scene.setPeriod(period, animate);
  }, [scene, period]);

  // 选中战争：重建战争层并飞行聚焦。
  useEffect(() => {
    if (!scene) return;
    scene.setSelectedWar(selectedWar);
    if (selectedWar && !prefersReducedMotion()) {
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
    </section>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
