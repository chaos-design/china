import { memo, useMemo } from "react";

import { cn } from "../../../lib/utils";
import { BasemapLayers } from "./basemap-layers";
import { MIGRATION_BASEMAP, projectMigration } from "./migration-projection";
import type { TerritoryPlace, TerritorySnapshot } from "./types";

export interface TerritoryMapProps {
  className?: string;
  snapshots: readonly TerritorySnapshot[];
  /** 当前选中的快照 id；null 表示全览——每幅快照都以与单选相同的标注呈现。 */
  selectedId: string | null;
}

interface ProjectedSnapshot {
  anchors: readonly (readonly [number, number])[];
  capital: readonly [number, number];
  snapshot: TerritorySnapshot;
}

/** 全览去重后的一幅快照：anchors 可能被截短，都城标签可能让位给更早的快照。 */
interface DedupedSnapshot {
  anchors: readonly (readonly [number, number])[];
  capital: readonly [number, number];
  showCapitalLabel: boolean;
  snapshot: TerritorySnapshot;
}

/** 单幅快照的完整标注呈现：与单选时完全一致（都城 + 锚点 + 地名）。 */
function SnapshotEmphasis({ projected }: { projected: DedupedSnapshot }) {
  const { anchors, capital, showCapitalLabel, snapshot } = projected;
  return (
    <g key={snapshot.id}>
      {anchors.map(([x, y], index) => (
        <g key={`${snapshot.id}-anchor-${index}`}>
          <circle
            cx={x}
            cy={y}
            fill="hsl(var(--paper))"
            r={0.42}
            stroke="hsl(var(--vermillion))"
            strokeWidth={0.18}
          />
          <text
            className="font-kai"
            fill="hsl(var(--ink))"
            fontSize={2}
            paintOrder="stroke"
            stroke="hsl(var(--paper) / 0.9)"
            strokeWidth={0.65}
            textAnchor="middle"
            x={x}
            y={y - 0.95}
          >
            {snapshot.anchors[index]?.name}
          </text>
        </g>
      ))}
      <circle
        cx={capital[0]}
        cy={capital[1]}
        fill="hsl(var(--vermillion))"
        r={0.55}
        stroke="hsl(var(--paper) / 0.8)"
        strokeWidth={0.14}
      />
      {showCapitalLabel ? (
        <text
          className="font-kai"
          fill="hsl(var(--vermillion))"
          fontSize={1.55}
          fontWeight={600}
          paintOrder="stroke"
          stroke="hsl(var(--paper) / 0.9)"
          strokeWidth={0.55}
          textAnchor="middle"
          x={capital[0]}
          y={capital[1] + 1.85}
        >
          （都城 · {snapshot.capital.name}）
        </text>
      ) : null}
    </g>
  );
}

/**
 * 疆域变迁地图：真实省界底图上的疆域快照。
 *
 * 都城以朱色圆点 + 「都城」标签标出，代表性控制节点为空心锚点；
 * 节点之间的连线不存在——疆域是连续区域，锚点不是边界。
 * 全览模式（selectedId 为 null）下每幅快照都以与单选相同的标注呈现；
 * 同一地点（同名且同位）在更早的快照中标注过后不再重复，避免互相压字。
 */
export const TerritoryMap = memo(function TerritoryMap({
  className,
  selectedId,
  snapshots,
}: TerritoryMapProps) {
  const projected = useMemo<readonly ProjectedSnapshot[]>(
    () =>
      snapshots.map((snapshot) => ({
        anchors: snapshot.anchors.map((place) => projectMigration(...place.ll)),
        capital: projectMigration(...snapshot.capital.ll),
        snapshot,
      })),
    [snapshots],
  );
  const overview = selectedId === null;
  const selected = projected.find((candidate) => candidate.snapshot.id === selectedId) ?? null;
  const [viewX, viewY, viewW, viewH] = MIGRATION_BASEMAP.view;

  // 全览去重：同名且投到同一点的地点，只在更早的快照中标注一次；
  // 单选时始终完整呈现，不受去重影响。
  const emphasized = useMemo((): readonly DedupedSnapshot[] => {
    if (!overview) {
      return selected
        ? [
            {
              anchors: selected.anchors,
              capital: selected.capital,
              showCapitalLabel: true,
              snapshot: selected.snapshot,
            },
          ]
        : [];
    }
    const placed = new Set<string>();
    const keyOf = (name: string, ll: readonly [number, number]) =>
      `${name}@${ll[0].toFixed(1)},${ll[1].toFixed(1)}`;
    return projected.map(({ anchors, capital, snapshot }) => {
      const keptAnchors: TerritoryPlace[] = [];
      for (const anchor of snapshot.anchors) {
        const key = keyOf(anchor.name, anchor.ll);
        if (!placed.has(key)) {
          placed.add(key);
          keptAnchors.push(anchor);
        }
      }
      const capitalKey = keyOf(snapshot.capital.name, snapshot.capital.ll);
      const showCapitalLabel = !placed.has(capitalKey);
      placed.add(capitalKey);
      return {
        anchors: anchors.filter((_, index) =>
          keptAnchors.some((anchor) => anchor.name === snapshot.anchors[index]?.name),
        ),
        capital,
        showCapitalLabel,
        snapshot,
      };
    });
  }, [overview, projected, selected]);

  return (
    <svg
      aria-label="疆域变迁地图：真实省界底图上的历代疆域快照节点"
      className={cn("block h-auto w-full", className)}
      role="img"
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
    >
      <BasemapLayers />

      {/* 单选时未被选中的快照：淡墨小点（都城实心、锚点空心），保留时间纵深 */}
      {!overview
        ? projected.map(({ anchors, capital, snapshot }) =>
            snapshot.id === selectedId ? null : (
              <g key={`dim-${snapshot.id}`}>
                {anchors.map(([x, y], index) => (
                  <circle
                    cx={x}
                    cy={y}
                    fill="hsl(var(--paper))"
                    key={`${snapshot.id}-anchor-${index}`}
                    r={0.22}
                    stroke="hsl(var(--ink) / 0.35)"
                    strokeWidth={0.1}
                  />
                ))}
                <circle cx={capital[0]} cy={capital[1]} fill="hsl(var(--ink) / 0.4)" r={0.26} />
              </g>
            ),
          )
        : null}

      {/* 强调的快照：全览时全部快照与单选同等标注（重复地点已去重） */}
      {emphasized.map((candidate) => (
        <SnapshotEmphasis key={candidate.snapshot.id} projected={candidate} />
      ))}
    </svg>
  );
});
