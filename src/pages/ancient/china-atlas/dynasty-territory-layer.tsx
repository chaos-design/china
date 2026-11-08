import type { AtlasFocus } from "./atlas-focus";
import type { AtlasItem } from "./atlas-items";
import {
  CITY_FONT_SIZE,
  getDynastyOutline,
  placeDynastyCityLabels,
  projectDynastyCities,
} from "./dynasty-overlay";
import { getDynastyTerritory } from "./dynasty-territories";
import type { AtlasDynastyId } from "./types";

/**
 * 叠加在现代疆域省界底图上的朝代断面：一片明确标注为「示意」的疆域范围，
 * 加上都城 / 当朝代表性城市的符号与名称。区域由锚点凸包外扩生成，
 * 不宣称是实测边界；所有文案与出处都来自 dynasty-territories.ts。
 *
 * 聚焦时 viewBox 变窄，所有 SVG 文字会跟着等比放大；这里用 unit 反向补偿
 * 符号与文字尺寸，让「放大」只放大地理范围，不放大字号。
 *
 * 标注避让按目标视野（view）计算，符号尺寸与说明文字按当前渲染视野
 * （liveView）逐帧更新——补间与手势期间布局不重排，只有大小平滑过渡。
 */
export function DynastyTerritoryLayer({
  dynasty,
  items,
  liveView,
  view,
}: {
  dynasty: AtlasDynastyId | null;
  items: readonly AtlasItem[];
  liveView: AtlasFocus;
  view: AtlasFocus;
}) {
  if (!dynasty) return null;

  const territory = getDynastyTerritory(dynasty);
  const outline = getDynastyOutline(territory);
  const cities = projectDynastyCities(territory);
  const labels = placeDynastyCityLabels(
    territory,
    items.map((item) => item.id),
    view,
  );
  const unit = 1 / Math.sqrt(Math.max(1, liveView.zoom));
  // 说明文字钉在当前视野西北角，聚焦后仍在可视区内。
  const captionX = liveView.x + 1.5 * unit;
  const captionY = liveView.y + 4 * unit;

  return (
    // key 换朝代时重挂载本层，入场淡入重放一次；SVG 本体与其余图层不受影响。
    <g
      aria-label={`${territory.label}疆域示意与都城城市`}
      className="atlas-dynasty-enter atlas-dynasty-layer"
      key={dynasty}
    >
      <defs>
        <filter id="atlas-area-bleed" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation={1.1} />
        </filter>
      </defs>
      {/* 墨晕底层：同形路径加模糊淡朱，先把「示意面」衬出来 */}
      <path
        d={outline.d}
        fill="none"
        filter="url(#atlas-area-bleed)"
        opacity={0.4}
        stroke="hsl(var(--vermillion) / 0.5)"
        strokeLinecap="round"
        strokeWidth={1.5 * unit}
      />
      <path
        className="atlas-dynasty-area"
        d={outline.d}
        fill="hsl(var(--vermillion) / 0.09)"
        stroke="hsl(var(--vermillion) / 0.66)"
        strokeDasharray={`${2.6 * unit} ${1.7 * unit}`}
        strokeLinecap="round"
        strokeWidth={0.4 * unit}
      />
      <text
        className="font-body"
        fill="hsl(var(--vermillion))"
        fontSize={2.1 * unit}
        paintOrder="stroke"
        stroke="hsl(var(--paper) / 0.92)"
        strokeWidth={0.5 * unit}
        x={captionX}
        y={captionY}
      >
        {territory.label} · 疆域示意（非实测边界）· 底图为现今疆域
      </text>

      {cities.map((entry) =>
        entry.role === "capital" ? (
          <path
            d={`M ${entry.point[0]} ${entry.point[1] - 1.15 * unit} L ${entry.point[0] + 1.15 * unit} ${entry.point[1]} L ${entry.point[0]} ${entry.point[1] + 1.15 * unit} L ${entry.point[0] - 1.15 * unit} ${entry.point[1]} Z`}
            fill="hsl(var(--vermillion))"
            key={`capital-${entry.name}`}
            stroke="hsl(var(--paper))"
            strokeWidth={0.2 * unit}
          />
        ) : (
          <circle
            cx={entry.point[0]}
            cy={entry.point[1]}
            fill="hsl(var(--paper))"
            key={`city-${entry.name}`}
            r={0.6 * unit}
            stroke="hsl(var(--vermillion))"
            strokeWidth={0.24 * unit}
          />
        ),
      )}

      {labels.map((label) => {
        const isCapital = label.role === "capital";
        const width = label.width * unit;
        const height = label.height * unit;
        return (
          <g className="atlas-city-label" key={label.id}>
            <path
              d={`M ${label.leader.x1} ${label.leader.y1} L ${label.leader.x2} ${label.leader.y2}`}
              fill="none"
              opacity={0.8}
              stroke="hsl(var(--vermillion) / 0.6)"
              strokeWidth={0.12 * unit}
            />
            <rect
              fill="hsl(var(--paper) / 0.94)"
              height={height}
              rx={0.4 * unit}
              stroke={isCapital ? "hsl(var(--vermillion))" : "hsl(var(--ink) / 0.28)"}
              strokeWidth={(isCapital ? 0.2 : 0.12) * unit}
              width={width}
              x={label.x - width / 2}
              y={label.y - height / 2}
            />
            <text
              className="font-kai"
              fill={isCapital ? "hsl(var(--vermillion))" : "hsl(var(--ink))"}
              fontSize={CITY_FONT_SIZE * unit}
              fontWeight={isCapital ? 700 : 500}
              textAnchor="middle"
              x={label.x}
              y={label.y + CITY_FONT_SIZE * unit * 0.35}
            >
              {label.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
