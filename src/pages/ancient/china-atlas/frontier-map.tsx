import { memo, useMemo } from "react";

import { cn } from "../../../lib/utils";
import { BasemapLayers } from "./basemap-layers";
import { MIGRATION_BASEMAP, projectMigration } from "./migration-projection";
import type { FrontierPolicyEntry } from "./types";

export interface FrontierMapProps {
  className?: string;
  /** 是否播放选中治所的脉冲强调。 */
  animated: boolean;
  /** 当前选中的制度 id；null 表示全览——每个治所都以与单选相同的强调呈现。 */
  selectedId: string | null;
  policies: readonly FrontierPolicyEntry[];
}

interface ProjectedPolicy {
  point: readonly [number, number];
  policy: FrontierPolicyEntry;
}

/** 单个治所的完整强调呈现：与单选时完全一致（朱色方印 + 脉冲 + 标签）。 */
function SeatEmphasis({
  animated,
  point,
  policy,
}: {
  animated: boolean;
  point: readonly [number, number];
  policy: FrontierPolicyEntry;
}) {
  return (
    <g key={policy.id}>
      <rect
        fill="hsl(var(--vermillion))"
        height={0.95}
        stroke="hsl(var(--paper) / 0.8)"
        strokeWidth={0.12}
        width={0.95}
        x={point[0] - 0.475}
        y={point[1] - 0.475}
      />
      {animated ? (
        <rect
          fill="none"
          height={1.1}
          stroke="hsl(var(--vermillion))"
          strokeWidth={0.18}
          width={1.1}
          x={point[0] - 0.55}
          y={point[1] - 0.55}
        >
          <animate attributeName="opacity" dur="2.2s" from={0.7} repeatCount="indefinite" to={0} />
          <animate attributeName="height" dur="2.2s" from={1.1} repeatCount="indefinite" to={2.4} />
          <animate attributeName="width" dur="2.2s" from={1.1} repeatCount="indefinite" to={2.4} />
          <animate
            attributeName="x"
            dur="2.2s"
            from={point[0] - 0.55}
            repeatCount="indefinite"
            to={point[0] - 1.2}
          />
          <animate
            attributeName="y"
            dur="2.2s"
            from={point[1] - 0.55}
            repeatCount="indefinite"
            to={point[1] - 1.2}
          />
        </rect>
      ) : null}
      <text
        className="font-kai"
        fill="hsl(var(--ink))"
        fontSize={2.2}
        fontWeight={700}
        paintOrder="stroke"
        stroke="hsl(var(--paper) / 0.9)"
        strokeWidth={0.75}
        textAnchor="middle"
        x={point[0]}
        y={point[1] - 1.15}
      >
        {policy.institution}
      </text>
      <text
        className="font-body"
        fill="hsl(var(--vermillion))"
        fontSize={1.55}
        fontWeight={600}
        paintOrder="stroke"
        stroke="hsl(var(--paper) / 0.9)"
        strokeWidth={0.55}
        textAnchor="middle"
        x={point[0]}
        y={point[1] + 1.85}
      >
        （治所 · {policy.seat.name}）
      </text>
    </g>
  );
}

/**
 * 边疆治理地图：真实省界底图上的治所分布。
 *
 * 与迁徙图共用同一份底图图层与投影；制度以「城郭」方印符号锚定在治所。
 * 全览模式（selectedId 为 null）下每个治所都以与单选相同的朱色方印 +
 * 脉冲强调呈现；单选时其余治所保持淡墨。
 */
export const FrontierMap = memo(function FrontierMap({
  animated,
  className,
  policies,
  selectedId,
}: FrontierMapProps) {
  const projected = useMemo<ProjectedPolicy[]>(
    () =>
      policies.map((policy) => ({
        policy,
        point: projectMigration(...policy.seat.ll),
      })),
    [policies],
  );
  const overview = selectedId === null;
  const [viewX, viewY, viewW, viewH] = MIGRATION_BASEMAP.view;

  return (
    <svg
      aria-label="边疆治理地图：真实省界底图上的历代边疆机构治所"
      className={cn("block h-auto w-full", className)}
      role="img"
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
    >
      <BasemapLayers />

      {/* 单选时未被选中的治所：淡墨方印（城郭符号）+ 地名 */}
      {!overview
        ? projected.map(({ point, policy }) =>
            policy.id === selectedId ? null : (
              <g key={`dim-${policy.id}`}>
                <rect
                  fill="hsl(var(--paper))"
                  height={0.8}
                  stroke="hsl(var(--ink) / 0.45)"
                  strokeWidth={0.14}
                  width={0.8}
                  x={point[0] - 0.4}
                  y={point[1] - 0.4}
                />
                <text
                  className="font-kai"
                  fill="hsl(var(--ink) / 0.55)"
                  fontSize={1.8}
                  paintOrder="stroke"
                  stroke="hsl(var(--paper) / 0.9)"
                  strokeWidth={0.6}
                  textAnchor="middle"
                  x={point[0]}
                  y={point[1] - 0.95}
                >
                  {policy.institution}
                </text>
              </g>
            ),
          )
        : null}

      {/* 强调的治所：全览时全部治所与单选同等强调 */}
      {projected.map(({ point, policy }) =>
        overview || policy.id === selectedId ? (
          <SeatEmphasis animated={animated} key={policy.id} point={point} policy={policy} />
        ) : null,
      )}
    </svg>
  );
});
