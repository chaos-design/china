import { memo, useMemo } from "react";

import { cn } from "../../../lib/utils";
import { MIGRATION_BASEMAP, projectMigration, routePathD } from "./migration-projection";
import type { MigrationRoute } from "./types";

export interface MigrationMapProps {
  /** 是否播放流动动画（画线、光点、刻痕、涟漪）。系统「减少动态效果」偏好仍会硬性关闭。 */
  animated: boolean;
  className?: string;
  /** 当前选中的路线 id；null 表示展示全部路线（都不做动画强调）。 */
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

/** 系统是否要求减少动态效果。动画的最终开关由调用方决定，这里只做硬性否决。 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 民族迁徙地图：真实省界底图 + 迁徙路线动画。
 *
 * 动画用 SVG SMIL 而不是 CSS keyframes：路线长度各不相同，
 * pathLength 归一后 dashoffset 画线、animateMotion 流动都直接沿路径运动，
 * 不需要为每条路线测量几何。选中态通过 key 重挂载重启动画。
 */
export const MigrationMap = memo(function MigrationMap({
  animated,
  className,
  events,
  selectedId,
}: MigrationMapProps) {
  // 数据是静态的、投影是纯函数：useMemo 保证 StrictMode 双渲染下也稳定。
  const routes = useMemo(() => buildProjectedRoutes(events), [events]);
  const motion = animated && !prefersReducedMotion();
  const selected = routes.find((candidate) => candidate.route.id === selectedId) ?? null;
  const [baseX, baseY, baseW, baseH] = MIGRATION_BASEMAP.view ?? DEFAULT_PROJECTION_VIEW;

  // 选中路线的途经点超出底图视野时（如撒马尔罕在图幅西侧之外），
  // 把 viewBox 扩到包住整条路线，起点与地名标注不会被裁掉；
  // 未选中时保持底图原视野，不为一览模式缩小主图。
  const viewBox = useMemo(() => {
    if (!selected) {
      return `${baseX} ${baseY} ${baseW} ${baseH}`;
    }
    const pad = 5;
    const xs = selected.points.map((point) => point[0]);
    const ys = selected.points.map((point) => point[1]);
    const x0 = Math.min(baseX, Math.min(...xs) - pad);
    const y0 = Math.min(baseY, Math.min(...ys) - pad);
    const x1 = Math.max(baseX + baseW, Math.max(...xs) + pad);
    const y1 = Math.max(baseY + baseH, Math.max(...ys) + pad);
    return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }, [baseH, baseW, baseX, baseY, selected]);

  return (
    <svg
      aria-label="民族迁徙路线图：真实省界底图上的历代迁徙路线"
      className={cn("block h-auto w-full", className)}
      role="img"
      viewBox={viewBox}
    >
      {/* 底图图层：省界 → 国界 → 岛屿 → 九段线 → 经纬网 → 河流 */}
      <g fill="hsl(var(--ink) / 0.035)" stroke="hsl(var(--ink) / 0.16)" strokeWidth={0.14}>
        {MIGRATION_BASEMAP.provinces.map((province) => (
          <path d={province.d} key={province.n} />
        ))}
      </g>
      <path
        d={MIGRATION_BASEMAP.islandsPath}
        fill="hsl(var(--ink) / 0.035)"
        stroke="hsl(var(--ink) / 0.2)"
        strokeWidth={0.14}
      />
      <path
        d={MIGRATION_BASEMAP.borderPath}
        fill="none"
        stroke="hsl(var(--ink) / 0.4)"
        strokeWidth={0.28}
      />
      <path
        d={MIGRATION_BASEMAP.nineDashPath}
        fill="none"
        stroke="hsl(var(--ink) / 0.28)"
        strokeWidth={0.2}
      />
      <path
        d={MIGRATION_BASEMAP.graticule.d}
        fill="none"
        stroke="hsl(var(--ink) / 0.08)"
        strokeWidth={0.08}
      />
      {MIGRATION_BASEMAP.graticule.labels.map((label) => (
        <text
          className="font-body"
          fill="hsl(var(--ink) / 0.32)"
          fontSize={1.5}
          key={label.t}
          textAnchor={label.a as "middle"}
          x={label.x}
          y={label.y}
        >
          {label.t}
        </text>
      ))}
      <g fill="none" stroke="hsl(var(--blueprint) / 0.4)">
        {MIGRATION_BASEMAP.rivers.map((river) => (
          <path d={river.d} key={river.n} strokeWidth={river.w * 0.3} />
        ))}
      </g>
      {MIGRATION_BASEMAP.rivers.map((river) => (
        <text
          className="font-body"
          fill="hsl(var(--blueprint) / 0.62)"
          fontSize={1.7}
          key={`${river.n}-label`}
          textAnchor="middle"
          x={river.label[0]}
          y={river.label[1]}
        >
          {river.n}
        </text>
      ))}
      {MIGRATION_BASEMAP.seas.map((sea) => (
        <text
          className="font-body"
          fill="hsl(var(--blueprint) / 0.5)"
          fontSize={2.1}
          key={sea.t}
          textAnchor="middle"
          x={sea.x}
          y={sea.y}
        >
          {sea.t}
        </text>
      ))}

      {/* 未选中的路线：淡墨细线 + 缓慢流动的纸色刻痕，保留全局「去向」的密度感 */}
      {routes.map(({ d, points, route }) =>
        route.id === selectedId ? null : (
          <g key={route.id}>
            <path d={d} fill="none" stroke="hsl(var(--ink) / 0.25)" strokeWidth={0.22} />
            {!motion ? null : (
              <path
                d={d}
                fill="none"
                pathLength={1}
                stroke="hsl(var(--paper) / 0.85)"
                strokeDasharray="0.02 0.1"
                strokeDashoffset={0.12}
                strokeWidth={0.14}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  dur="4.5s"
                  from={0.12}
                  repeatCount="indefinite"
                  to={0}
                />
              </path>
            )}
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
      )}

      {/* 选中的路线：朱色弧线 + 画线动画 + 流动圆点模拟去向 */}
      {selected ? (
        <g key={selected.route.id}>
          <path
            d={selected.d}
            fill="none"
            stroke="hsl(var(--vermillion) / 0.16)"
            strokeWidth={1.05}
          />
          <path
            d={selected.d}
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
              d={selected.d}
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
                begin="1.3s"
                dur="0.6s"
                fill="freeze"
                from={0}
                to={0.9}
              />
              <animate
                attributeName="stroke-dashoffset"
                dur="1.8s"
                from={0.105}
                repeatCount="indefinite"
                to={0}
              />
            </path>
          )}
          {selected.points.map(([x, y], index) => {
            const isFirst = index === 0;
            const isLast = index === selected.points.length - 1;
            return (
              <g key={`${selected.route.id}-point-${index}`}>
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
                {selected.route.waypoints[index]?.name ? (
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
                    {selected.route.waypoints[index]?.name}
                  </text>
                ) : null}
              </g>
            );
          })}
          {/* 起点的出发涟漪：人群源源不断离开原居地 */}
          {!motion
            ? null
            : [0, -1.1].map((begin) => {
                const [originX, originY] = selected.points[0] ?? [0, 0];
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
                      begin={`${begin}s`}
                      dur="2.2s"
                      from={0.5}
                      repeatCount="indefinite"
                      to={1.9}
                    />
                    <animate
                      attributeName="stroke-opacity"
                      begin={`${begin}s`}
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
                  begin={`${(-index * (FLOW_DUR_S / FLOW_DOTS.length)).toFixed(2)}s`}
                  fill="hsl(var(--paper))"
                  key={`flow-${index}`}
                  r={radius}
                  stroke="hsl(var(--vermillion))"
                  strokeWidth={0.16}
                >
                  <animateMotion
                    dur={`${FLOW_DUR_S}s`}
                    path={selected.d}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
        </g>
      ) : null}
    </svg>
  );
});
