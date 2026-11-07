import { memo, useMemo } from "react";

import { cn } from "../../../lib/utils";
import { BasemapLayers } from "./basemap-layers";
import { MIGRATION_BASEMAP, projectMigration } from "./migration-projection";
import type { TerritorySnapshot } from "./types";

export interface TerritoryMapProps {
  className?: string;
  snapshots: readonly TerritorySnapshot[];
  /** 当前选中的快照 id；null 表示展示全部快照的节点（淡墨）。 */
  selectedId: string | null;
}

interface ProjectedSnapshot {
  anchors: readonly (readonly [number, number])[];
  capital: readonly [number, number];
  snapshot: TerritorySnapshot;
}

/**
 * 疆域变迁地图：真实省界底图上的疆域快照。
 *
 * 都城以朱色圆点 + 「都城」标签标出，代表性控制节点为空心锚点；
 * 节点之间的连线不存在——疆域是连续区域，锚点不是边界。
 * 选中快照的节点用朱色强调并标注地名，其余快照保持淡墨小点。
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
  const selected = projected.find((candidate) => candidate.snapshot.id === selectedId) ?? null;
  const [viewX, viewY, viewW, viewH] = MIGRATION_BASEMAP.view;

  return (
    <svg
      aria-label="疆域变迁地图：真实省界底图上的历代疆域快照节点"
      className={cn("block h-auto w-full", className)}
      role="img"
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
    >
      <BasemapLayers />

      {/* 未选中的快照：淡墨小点（都城实心、锚点空心），保留时间纵深 */}
      {projected.map(({ anchors, capital, snapshot }) =>
        snapshot.id === selectedId ? null : (
          <g key={snapshot.id}>
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
      )}

      {/* 选中的快照：都城 + 锚点强调，全部标注地名 */}
      {selected ? (
        <g key={selected.snapshot.id}>
          {selected.anchors.map(([x, y], index) => (
            <g key={`${selected.snapshot.id}-anchor-${index}`}>
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
                {selected.snapshot.anchors[index]?.name}
              </text>
            </g>
          ))}
          <circle
            cx={selected.capital[0]}
            cy={selected.capital[1]}
            fill="hsl(var(--vermillion))"
            r={0.55}
            stroke="hsl(var(--paper) / 0.8)"
            strokeWidth={0.14}
          />
          <text
            className="font-kai"
            fill="hsl(var(--vermillion))"
            fontSize={1.55}
            fontWeight={600}
            paintOrder="stroke"
            stroke="hsl(var(--paper) / 0.9)"
            strokeWidth={0.55}
            textAnchor="middle"
            x={selected.capital[0]}
            y={selected.capital[1] + 1.85}
          >
            （都城 · {selected.snapshot.capital.name}）
          </text>
        </g>
      ) : null}
    </svg>
  );
});
