import { memo, useMemo } from "react";

import { cn } from "../../../lib/utils";
import type { AtlasFocus } from "./atlas-focus";
import {
  type AtlasItem,
  type AtlasLayerId,
  type AtlasPoint,
  LABEL_FONT_SIZE,
  placeLabels,
} from "./atlas-items";
import { BasemapLayers } from "./basemap-layers";
import { getDynastyTerritory } from "./dynasty-territories";
import { DynastyTerritoryLayer } from "./dynasty-territory-layer";
import type { AtlasDynastyId, AtlasTopicId } from "./types";

export interface AtlasMapProps {
  className?: string;
  /** 是否播放画线、流动光点与脉冲。 */
  animated: boolean;
  /** 当前朝代断面；null 表示只画现代疆域底图。 */
  dynasty: AtlasDynastyId | null;
  /** 当前渲染视野：viewBox、data-zoom 与字号补偿随它逐帧更新（补间 / 手势中会变）。 */
  liveView: AtlasFocus;
  /** 拖拽平移中：光标切换为抓住状态。 */
  panning: boolean;
  /** 悬停中的条目 id（详情卡据此展开，地图只做强调）。 */
  hoveredId: string | null;
  /** 可见条目；切换「全部 / 单项」只换这个数组，SVG 与视野保持不动。 */
  items: readonly AtlasItem[];
  layer: AtlasLayerId;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  /** 选中的条目 id；null 表示全览。 */
  selectedId: string | null;
  /** 目标视野：标注避让与朝代标注布局都按它计算，不随手势逐帧变化。 */
  view: AtlasFocus;
}

/** 每名「迁徙者」的半径序列，大小相间读作人群而非单点。 */
export const FLOW_DOTS = [0.5, 0.36, 0.44, 0.32, 0.4] as const;
const FLOW_DUR_S = 3.6;

/** 迁徙回到原先的朱色系，但比底图上的疆域红更亮一档，便于与都城红点区分。 */
export const ATLAS_TOPIC_COLOR: Record<AtlasTopicId, string> = {
  territory: "hsl(var(--vermillion))",
  migration: "hsl(6 84% 60%)",
  frontier: "hsl(var(--ochre))",
};

/**
 * 防御范围示意环：统一半径的虚线圈，只表达「治所之外另有防区」这一层含义。
 * 半径是图例符号而非实测距离——各制度真实范围写在详情的「防御范围」里，
 * 不据推测补画边界。
 */
const DEFENSE_RADIUS = 3.6;

function DefenseRing({
  active,
  dim,
  point,
  unit,
}: {
  active: boolean;
  dim: boolean;
  point: readonly [number, number];
  unit: number;
}) {
  return (
    <circle
      className="atlas-defense-ring"
      cx={point[0]}
      cy={point[1]}
      fill="hsl(var(--ochre) / 0.1)"
      opacity={dim ? 0.32 : 1}
      r={DEFENSE_RADIUS}
      stroke="hsl(var(--ochre))"
      strokeDasharray={`${0.9 * unit} ${0.6 * unit}`}
      strokeWidth={(active ? 0.5 : 0.34) * unit}
    />
  );
}

const MAP_ARIA_LABEL: Record<AtlasLayerId, string> = {
  all: "历史地理图谱综合地图：真实省界底图上的三类标注",
  territory: "疆域变迁地图：真实省界底图上的历代疆域快照节点",
  migration: "民族迁徙路线图：真实省界底图上的历代迁徙路线",
  frontier: "边疆治理地图：真实省界底图上的历代边疆机构治所",
};

function PointSymbol({
  color,
  dim,
  point,
  unit,
}: {
  color: string;
  dim: boolean;
  point: AtlasPoint;
  unit: number;
}) {
  const [x, y] = point.point;
  if (point.kind === "seat") {
    return (
      <rect
        fill={dim ? "hsl(var(--paper))" : color}
        height={unit}
        stroke={dim ? "hsl(var(--ink) / 0.4)" : "hsl(var(--paper) / 0.8)"}
        strokeWidth={0.14 * unit}
        width={unit}
        x={x - unit / 2}
        y={y - unit / 2}
      />
    );
  }
  if (point.kind === "waypoint") {
    return (
      <circle
        cx={x}
        cy={y}
        fill={color}
        r={0.34 * unit}
        stroke="hsl(var(--paper))"
        strokeWidth={0.1 * unit}
      />
    );
  }
  if (point.kind === "anchor") {
    return (
      <circle
        cx={x}
        cy={y}
        fill="hsl(var(--paper))"
        r={0.42 * unit}
        stroke={color}
        strokeWidth={0.18 * unit}
      />
    );
  }
  return (
    <circle
      cx={x}
      cy={y}
      fill={color}
      r={0.6 * unit}
      stroke="hsl(var(--paper))"
      strokeWidth={0.14 * unit}
    />
  );
}

/** 迁徙路线：画线 + 纸色刻痕 + 流动光点，全览与单选共用同一套动画。 */
function RouteLayer({
  animated,
  dim,
  item,
  unit,
}: {
  animated: boolean;
  dim: boolean;
  item: AtlasItem;
  unit: number;
}) {
  const route = item.route;
  if (!route) return null;
  const color = ATLAS_TOPIC_COLOR.migration;
  const stroke = dim ? "hsl(var(--ink) / 0.32)" : color;
  return (
    <g key={`route-${item.id}`} opacity={dim ? 0.5 : 1}>
      <path d={route.d} fill="none" opacity={0.16} stroke={stroke} strokeWidth={unit} />
      <path
        d={route.d}
        fill="none"
        pathLength={1}
        stroke={stroke}
        strokeDasharray={1}
        strokeDashoffset={animated && !dim ? 1 : 0}
        strokeLinecap="round"
        strokeWidth={(dim ? 0.22 : 0.42) * unit}
      >
        {animated && !dim ? (
          <animate
            attributeName="stroke-dashoffset"
            calcMode="spline"
            dur="1.4s"
            fill="freeze"
            from={1}
            keySplines="0.4 0 0.2 1"
            to={0}
          />
        ) : null}
      </path>
      {animated && !dim ? (
        <>
          <path
            d={route.d}
            fill="none"
            opacity={0}
            pathLength={1}
            stroke="hsl(var(--paper) / 0.9)"
            strokeDasharray="0.02 0.085"
            strokeDashoffset={0.105}
            strokeWidth={0.14 * unit}
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
          {FLOW_DOTS.map((radius, index) => (
            <circle
              begin={`${(-index * (FLOW_DUR_S / FLOW_DOTS.length)).toFixed(2)}s`}
              fill="hsl(var(--paper))"
              key={`flow-${item.id}-${index}`}
              r={radius * unit}
              stroke={color}
              strokeWidth={0.16 * unit}
            >
              <animateMotion dur={`${FLOW_DUR_S}s`} path={route.d} repeatCount="indefinite" />
            </circle>
          ))}
        </>
      ) : null}
    </g>
  );
}

/**
 * 一张常驻 SVG：现代疆域底图、朝代断面、三类标图点、路线与引导线标注全画在同一视野里。
 *
 * 稳定性约定：
 * - SVG 本身没有 key，页面切换只改变 children，DOM 节点不重挂载；
 * - viewBox 由 AtlasFocus 统一给出，全览时恒为 ATLAS_VIEW 对应的视野；
 * - 标注按**当前视野**做确定性避让：全览复用固定布局，聚焦时围绕少量可见点
 *   重新排布，标签不会散到视野外，也不会和朝代城市名挤成一团。
 */
export const AtlasMap = memo(function AtlasMap({
  animated,
  className,
  dynasty,
  hoveredId,
  items,
  layer,
  liveView,
  onHover,
  onSelect,
  panning,
  selectedId,
  view,
}: AtlasMapProps) {
  // 标注避让按目标视野算：补间与手势期间布局不逐帧重排，标签跟着地图一起移动。
  const labels = useMemo(
    () => new Map(placeLabels(items, view).map((placement) => [placement.id, placement])),
    [items, view],
  );
  // viewBox 收窄会让所有 SVG 文字等比变大；字号与标签框按当前 zoom 连续反向补偿，
  // 缩放全程符号与文字的屏幕大小平滑过渡，放大后也不会糊成一团。
  const unit = 1 / Math.sqrt(Math.max(1, liveView.zoom));
  const subdued = liveView.zoom > 1.08;
  return (
    <svg
      aria-label={`${MAP_ARIA_LABEL[layer]}${dynasty ? ` · 叠加${getDynastyTerritory(dynasty).label}朝疆域示意` : ""}`}
      className={cn(
        "block h-full w-full touch-none select-none",
        panning ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      data-zoom={Math.round(liveView.zoom * 100) / 100}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={liveView.box}
    >
      <g className="atlas-map-layer">
        {/* 底图公共图层：现代中国省界 → 国界 → 岛屿 → 九段线 → 经纬网 → 河流 → 海名 */}
        <BasemapLayers subdued={subdued} />

        {/* 朝代断面叠在现代底图之上：示意范围 + 都城 / 大城市符号与名称 */}
        <DynastyTerritoryLayer dynasty={dynasty} items={items} liveView={liveView} view={view} />

        {/* 防御范围示意环画在最底层，方印与标签随后覆盖，标注信息不被遮挡 */}
        {items
          .filter((item) => item.topic === "frontier")
          .map((item) => (
            <DefenseRing
              active={item.id === selectedId || item.id === hoveredId}
              dim={selectedId !== null && selectedId !== item.id}
              key={`defense-${item.id}`}
              point={item.primary}
              unit={unit}
            />
          ))}

        {/* 路线底层：先画线再画点，点不会被线压住 */}
        {items.map((item) =>
          item.route ? (
            <RouteLayer
              animated={animated}
              dim={selectedId !== null && selectedId !== item.id}
              item={item}
              key={`route-layer-${item.id}`}
              unit={unit}
            />
          ) : null,
        )}

        {/* 标图点：都城、控制节点、途经地、治所 */}
        {items.map((item) => {
          const dim = selectedId !== null && selectedId !== item.id;
          const color = dim ? "hsl(var(--ink) / 0.42)" : ATLAS_TOPIC_COLOR[item.topic];
          return (
            <g key={`points-${item.id}`} opacity={dim ? 0.55 : 1}>
              {item.points.map((point, index) => (
                <PointSymbol
                  color={color}
                  dim={dim}
                  key={`${item.id}-${point.kind}-${index}`}
                  point={point}
                  unit={unit}
                />
              ))}
            </g>
          );
        })}

        {/* 选中 / 悬停的锚点脉冲：只加环形描边，不改变任何点的位置 */}
        {items
          .filter((item) => item.id === selectedId || item.id === hoveredId)
          .map((item) => (
            <circle
              cx={item.primary[0]}
              cy={item.primary[1]}
              fill="none"
              key={`halo-${item.id}`}
              r={1.1 * unit}
              stroke={ATLAS_TOPIC_COLOR[item.topic]}
              strokeWidth={0.2 * unit}
            >
              {animated ? (
                <>
                  <animate
                    attributeName="r"
                    dur="2.2s"
                    from={1.1 * unit}
                    repeatCount="indefinite"
                    to={2.4 * unit}
                  />
                  <animate
                    attributeName="stroke-opacity"
                    dur="2.2s"
                    from={0.7}
                    repeatCount="indefinite"
                    to={0}
                  />
                </>
              ) : null}
            </circle>
          ))}

        {/* 引导线与标签画在最上层：选中项以朱色高亮，其余降为墨灰 */}
        {items.map((item) => {
          const placement = labels.get(item.id);
          if (!placement) return null;
          const dim = selectedId !== null && selectedId !== item.id;
          const isSelected = item.id === selectedId;
          const active = isSelected || item.id === hoveredId;
          const color = dim ? "hsl(var(--ink) / 0.38)" : ATLAS_TOPIC_COLOR[item.topic];
          const highlight = isSelected ? "hsl(var(--vermillion))" : color;
          const { height, leader, width, x, y } = placement;
          const boxWidth = width * unit;
          const boxHeight = height * unit;
          const ex = Math.min(
            Math.max(leader.x1, x - boxWidth / 2 + 0.4 * unit),
            x + boxWidth / 2 - 0.4 * unit,
          );
          const ey = Math.min(
            Math.max(leader.y1, y - boxHeight / 2 + 0.4 * unit),
            y + boxHeight / 2 - 0.4 * unit,
          );
          return (
            // biome-ignore lint/a11y/useSemanticElements: SVG 的 <g> 不能换成 HTML <button>，热点只能靠 role + tabIndex 提供键盘可达性
            <g
              aria-label={`地图标注 · ${item.label}`}
              className="cursor-pointer outline-none"
              key={`label-${item.id}`}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(item.id)}
              onFocus={() => onHover(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(item.id);
                }
              }}
              onMouseEnter={() => onHover(item.id)}
              onMouseLeave={() => onHover(null)}
              role="button"
              tabIndex={0}
            >
              <path
                className="atlas-leader"
                d={`M ${leader.x1} ${leader.y1} L ${ex} ${ey}`}
                fill="none"
                opacity={dim ? 0.45 : 0.85}
                stroke={highlight}
                strokeWidth={(isSelected ? 0.28 : active ? 0.2 : 0.12) * unit}
              />
              <circle cx={leader.x1} cy={leader.y1} fill={highlight} r={0.26 * unit} />
              <rect
                className="atlas-label-box"
                fill={isSelected ? "hsl(var(--vermillion) / 0.14)" : "hsl(var(--paper) / 0.94)"}
                height={boxHeight}
                rx={0.5 * unit}
                stroke={highlight}
                strokeWidth={(isSelected ? 0.36 : active ? 0.28 : 0.14) * unit}
                width={boxWidth}
                x={x - boxWidth / 2}
                y={y - boxHeight / 2}
              />
              <text
                className="font-kai"
                fill={
                  isSelected
                    ? "hsl(var(--vermillion))"
                    : dim
                      ? "hsl(var(--ink) / 0.55)"
                      : "hsl(var(--ink))"
                }
                fontSize={LABEL_FONT_SIZE * unit}
                fontWeight={active ? 700 : 500}
                textAnchor="middle"
                x={x}
                y={y + LABEL_FONT_SIZE * unit * 0.35}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
});
