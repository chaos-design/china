import { ATLAS_VIEW, type AtlasItem } from "./atlas-items";
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
 * 加上都城 / 当朝代表性城市的符号与名称。区域由锚点凸包生成，
 * 不宣称是实测边界；所有文案与出处都来自 dynasty-territories.ts。
 */
export function DynastyTerritoryLayer({
  dynasty,
  items,
}: {
  dynasty: AtlasDynastyId | null;
  items: readonly AtlasItem[];
}) {
  if (!dynasty) return null;

  const territory = getDynastyTerritory(dynasty);
  const outline = getDynastyOutline(territory);
  const cities = projectDynastyCities(territory);
  const labels = placeDynastyCityLabels(
    territory,
    items.map((item) => item.id),
  );
  // 说明文字钉在图幅西北角的空白处，不跟着示意范围挤进标注密集区。
  const captionX = ATLAS_VIEW.x + 1.5;
  const captionY = ATLAS_VIEW.y + 4;

  return (
    <g aria-label={`${territory.label}疆域示意与都城城市`} className="atlas-dynasty-layer">
      <path
        className="atlas-dynasty-area"
        d={outline.d}
        fill="hsl(var(--vermillion) / 0.1)"
        stroke="hsl(var(--vermillion) / 0.62)"
        strokeDasharray="1.3 0.9"
        strokeWidth={0.34}
      />
      <text
        className="font-body"
        fill="hsl(var(--vermillion))"
        fontSize={2.1}
        paintOrder="stroke"
        stroke="hsl(var(--paper) / 0.92)"
        strokeWidth={0.5}
        x={captionX}
        y={captionY}
      >
        {territory.label} · 疆域示意（非实测边界）· 底图为现今疆域
      </text>

      {cities.map((entry) =>
        entry.role === "capital" ? (
          <path
            d={`M ${entry.point[0]} ${entry.point[1] - 1.15} L ${entry.point[0] + 1.15} ${entry.point[1]} L ${entry.point[0]} ${entry.point[1] + 1.15} L ${entry.point[0] - 1.15} ${entry.point[1]} Z`}
            fill="hsl(var(--vermillion))"
            key={`capital-${entry.name}`}
            stroke="hsl(var(--paper))"
            strokeWidth={0.2}
          />
        ) : (
          <circle
            cx={entry.point[0]}
            cy={entry.point[1]}
            fill="hsl(var(--paper))"
            key={`city-${entry.name}`}
            r={0.6}
            stroke="hsl(var(--vermillion))"
            strokeWidth={0.24}
          />
        ),
      )}

      {labels.map((label) => {
        const isCapital = label.role === "capital";
        return (
          <g className="atlas-city-label" key={label.id}>
            <path
              d={`M ${label.leader.x1} ${label.leader.y1} L ${label.leader.x2} ${label.leader.y2}`}
              fill="none"
              stroke="hsl(var(--vermillion) / 0.6)"
              strokeWidth={0.12}
            />
            <rect
              fill="hsl(var(--paper) / 0.94)"
              height={label.height}
              rx={0.4}
              stroke={isCapital ? "hsl(var(--vermillion))" : "hsl(var(--ink) / 0.28)"}
              strokeWidth={isCapital ? 0.2 : 0.12}
              width={label.width}
              x={label.x - label.width / 2}
              y={label.y - label.height / 2}
            />
            <text
              className="font-kai"
              fill={isCapital ? "hsl(var(--vermillion))" : "hsl(var(--ink))"}
              fontSize={CITY_FONT_SIZE}
              fontWeight={isCapital ? 700 : 500}
              textAnchor="middle"
              x={label.x}
              y={label.y + CITY_FONT_SIZE * 0.35}
            >
              {label.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
