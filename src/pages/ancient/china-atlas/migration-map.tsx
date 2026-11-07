import { memo, useMemo } from "react";

import { cn } from "../../../lib/utils";
import { BasemapLayers } from "./basemap-layers";
import { MIGRATION_BASEMAP, projectMigration, routePathD } from "./migration-projection";
import type { MigrationRoute } from "./types";

export interface MigrationMapProps {
  /** 是否播放流动动画（画线、光点、刻痕、涟漪）。 */
  animated: boolean;
  className?: string;
  /** 当前选中的路线 id；null 表示全览——每条路线都以与单选相同的动画呈现。 */
  selectedId: string | null;
  events: readonly MigrationRoute[];
}

interface ProjectedRoute {
  d: string;
  points: readonly (readonly [number, number])[];
  route: MigrationRoute;
}

function buildProjectedRoutes(events: readonly MigrationRoute[]): readonly ProjectedRoute[] {
  return events.map((route) => {
    const points = route.waypoints.map((waypoint) => projectMigration(...waypoint.ll));
    return { d: routePathD(points), points, route };
  });
}

const DEFAULT_PROJECTION_VIEW = [0, 0, 151.5, 115.36] as const;

/** 流动光点队伍的半径序列：大小相间，读作人群而不是单点。 */
export const FLOW_DOTS = [0.5, 0.36, 0.44, 0.32, 0.4] as const;
/** 一名「迁徙者」走完全程的秒数；队伍按等间隔错峰出发。 */
const FLOW_DUR_S = 3.6;

/** 单条路线的完整动画呈现：与单选时完全一致，全览模式下按序交错启动。 */
function RouteEmphasis({
  delay,
  motion,
  projected,
}: {
  delay: number;
  motion: boolean;
  projected: ProjectedRoute;
}) {
  const { d, points, route } = projected;
  return (
    <g key={route.id}>
      <path d={d} fill="none" stroke="hsl(var(--vermillion) / 0.16)" strokeWidth={1.05} />
      <path
        d={d}
        fill="none"
        pathLength={1}
        stroke="hsl(var(--vermillion))"
        strokeDasharray={1}
        strokeDashoffset={!motion ? 0 : 1}
        strokeLinecap="round"
        strokeWidth={0.42}
      >
        {!motion ? null : (
          <animate
            attributeName="stroke-dashoffset"
            begin={`${delay}s`}
            calcMode="spline"
            dur="1.4s"
            fill="freeze"
            from={1}
            keySplines="0.4 0 0.2 1"
            to={0}
          />
        )}
      </path>
      {/* 线内流动的纸色刻痕：画线完成后淡入，持续向终点行进 */}
      {!motion ? null : (
        <path
          d={d}
          fill="none"
          opacity={0}
          pathLength={1}
          stroke="hsl(var(--paper) / 0.9)"
          strokeDasharray="0.02 0.085"
          strokeDashoffset={0.105}
          strokeWidth={0.14}
        >
          <animate
            attributeName="opacity"
            begin={`${delay + 1.3}s`}
            dur="0.6s"
            fill="freeze"
            from={0}
            to={0.9}
          />
          <animate
            attributeName="stroke-dashoffset"
            begin={`${delay}s`}
            dur="1.8s"
            from={0.105}
            repeatCount="indefinite"
            to={0}
          />
        </path>
      )}
      {points.map(([x, y], index) => {
        const isFirst = index === 0;
        const isLast = index === points.length - 1;
        return (
          <g key={`${route.id}-point-${index}`}>
            {isFirst ? (
              <circle
                cx={x}
                cy={y}
                fill="hsl(var(--paper))"
                r={0.5}
                stroke="hsl(var(--vermillion))"
                strokeWidth={0.22}
              />
            ) : (
              <circle cx={x} cy={y} fill="hsl(var(--vermillion))" r={0.34} />
            )}
            {isLast ? (
              <circle
                cx={x}
                cy={y}
                fill="none"
                r={0.6}
                stroke="hsl(var(--vermillion))"
                strokeWidth={0.18}
              >
                {!motion ? null : (
                  <animate
                    attributeName="r"
                    dur="2.4s"
                    from={0.6}
                    repeatCount="indefinite"
                    to={1.3}
                  />
                )}
                {!motion ? null : (
                  <animate
                    attributeName="stroke-opacity"
                    dur="2.4s"
                    from={0.7}
                    repeatCount="indefinite"
                    to={0}
                  />
                )}
              </circle>
            ) : null}
            {route.waypoints[index]?.name ? (
              <text
                className="font-kai"
                fill="hsl(var(--ink))"
                fontSize={2.1}
                paintOrder="stroke"
                stroke="hsl(var(--paper) / 0.9)"
                strokeWidth={0.7}
                textAnchor="middle"
                x={x}
                y={y - 1.05}
              >
                {route.waypoints[index]?.name}
              </text>
            ) : null}
            {/* 起点 / 终点角色标签：标在地名下方，一眼分清出发与抵达 */}
            {isFirst || isLast ? (
              <text
                className="font-body"
                fill="hsl(var(--vermillion))"
                fontSize={1.55}
                fontWeight={600}
                paintOrder="stroke"
                stroke="hsl(var(--paper) / 0.9)"
                strokeWidth={0.55}
                textAnchor="middle"
                x={x}
                y={y + 1.75}
              >
                {isFirst ? "（起点）" : "（终点）"}
              </text>
            ) : null}
          </g>
        );
      })}
      {/* 起点的出发涟漪：人群源源不断离开原居地 */}
      {!motion
        ? null
        : [0, -1.1].map((begin) => {
            const [originX, originY] = points[0] ?? [0, 0];
            return (
              <circle
                cx={originX}
                cy={originY}
                fill="none"
                key={`ripple-${begin}`}
                r={0.5}
                stroke="hsl(var(--vermillion))"
                strokeWidth={0.18}
              >
                <animate
                  attributeName="r"
                  begin={`${begin + delay}s`}
                  dur="2.2s"
                  from={0.5}
                  repeatCount="indefinite"
                  to={1.9}
                />
                <animate
                  attributeName="stroke-opacity"
                  begin={`${begin + delay}s`}
                  dur="2.2s"
                  from={0.6}
                  repeatCount="indefinite"
                  to={0}
                />
              </circle>
            );
          })}
      {/* 流动光点队伍：错峰出发、大小相间，读作人群的持续流动 */}
      {!motion
        ? null
        : FLOW_DOTS.map((radius, index) => (
            <circle
              begin={`${(delay - index * (FLOW_DUR_S / FLOW_DOTS.length)).toFixed(2)}s`}
              fill="hsl(var(--paper))"
              key={`flow-${index}`}
              r={radius}
              stroke="hsl(var(--vermillion))"
              strokeWidth={0.16}
            >
              <animateMotion dur={`${FLOW_DUR_S}s`} path={d} repeatCount="indefinite" />
            </circle>
          ))}
    </g>
  );
}

/**
 * 民族迁徙地图：真实省界底图 + 迁徙路线动画。
 *
 * 动画用 SVG SMIL 而不是 CSS keyframes：路线长度各不相同，
 * pathLength 归一后 dashoffset 画线、animateMotion 流动都直接沿路径运动，
 * 不需要为每条路线测量几何。选中态通过 key 重挂载重启动画。
 * 动画默认开启，是否播放完全由 animated（页面的「流动动画」开关）决定。
 * 全览模式（selectedId 为 null）下每条路线都以与单选相同的动画呈现，
 * 按「汉 → 唐 → 宋 → 元」交错启动，形成先后启程的层次感。
 */
export const MigrationMap = memo(function MigrationMap({
  animated,
  className,
  events,
  selectedId,
}: MigrationMapProps) {
  // 数据是静态的、投影是纯函数：useMemo 保证 StrictMode 双渲染下也稳定。
  const routes = useMemo(() => buildProjectedRoutes(events), [events]);
  const motion = animated;
  const selected = routes.find((candidate) => candidate.route.id === selectedId) ?? null;
  const overview = selectedId === null;
  const [baseX, baseY, baseW, baseH] = MIGRATION_BASEMAP.view ?? DEFAULT_PROJECTION_VIEW;

  // 途经点超出底图视野时（如撒马尔罕在图幅西侧之外），把 viewBox 扩到
  // 包住需要强调的路线：全览时覆盖全部路线，单选时只看选中的那条。
  const viewBox = useMemo(() => {
    const fitRoutes = overview ? routes : selected ? [selected] : [];
    if (fitRoutes.length === 0) {
      return `${baseX} ${baseY} ${baseW} ${baseH}`;
    }
    const pad = 5;
    let x0 = baseX;
    let y0 = baseY;
    let x1 = baseX + baseW;
    let y1 = baseY + baseH;
    for (const { points } of fitRoutes) {
      for (const [x, y] of points) {
        x0 = Math.min(x0, x - pad);
        y0 = Math.min(y0, y - pad);
        x1 = Math.max(x1, x + pad);
        y1 = Math.max(y1, y + pad);
      }
    }
    return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }, [baseH, baseW, baseX, baseY, overview, routes, selected]);

  return (
    <svg
      aria-label="民族迁徙路线图：真实省界底图上的历代迁徙路线"
      className={cn("block h-auto w-full", className)}
      role="img"
      viewBox={viewBox}
    >
      {/* 底图公共图层：省界 → 国界 → 岛屿 → 九段线 → 经纬网 → 河流 → 海名 */}
      <BasemapLayers />

      {/* 单选时未被选中的路线：淡墨细线，保留全局「去向」的密度感 */}
      {!overview
        ? routes.map(({ d, points, route }) =>
            route.id === selectedId ? null : (
              <g key={`dim-${route.id}`}>
                <path d={d} fill="none" stroke="hsl(var(--ink) / 0.25)" strokeWidth={0.22} />
                {points.map(([x, y], index) => (
                  <circle
                    cx={x}
                    cy={y}
                    fill="hsl(var(--paper))"
                    key={`${route.id}-${index}`}
                    r={0.28}
                    stroke="hsl(var(--ink) / 0.35)"
                    strokeWidth={0.12}
                  />
                ))}
              </g>
            ),
          )
        : null}

      {/* 强调的路线：全览时全部路线按序交错播放，单选时只有选中的一条 */}
      {routes.map((projected, index) =>
        overview || projected.route.id === selectedId ? (
          <RouteEmphasis
            delay={overview ? index * 0.25 : 0}
            key={projected.route.id}
            motion={motion}
            projected={projected}
          />
        ) : null,
      )}
    </svg>
  );
});
