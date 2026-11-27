import type { CSSProperties } from "react";

import { centroid, polygonPath, routePath, smoothPath } from "./board-geometry";
import { type BattleStep, BRANCH_LABEL, type MapScene } from "./types";
import { UnitGlyph } from "./unit-figure";

export interface SandTableProps {
  battle: MapScene;
  playing: boolean;
  step: BattleStep;
  view: "sand" | "top";
  zoom: number;
}

const GRATICULE = [160, 320, 480, 640, 800];
const RIDGES = [
  "M300 150 L340 132 L380 148 L420 128 L460 146",
  "M120 520 L160 500 L205 518 L245 496 L288 514",
  "M600 470 L640 448 L682 468 L720 446 L760 466",
];

/** The signature: one tilted board that shows control, routes and decisions for a single step. */
export function SandTable({ battle, playing, step, view, zoom }: SandTableProps) {
  const sceneStyle = { "--sunzi-zoom": zoom } as CSSProperties;
  const deployment = step.units
    .map((unit) => `${unit.label}（${BRANCH_LABEL[unit.branch]}）`)
    .join("，");

  return (
    <div
      aria-label={`${battle.name}，${step.title}沙盘示意。${step.situation}当前部署：${deployment}。`}
      className="sunzi-board h-full w-full"
      data-playing={playing}
      data-testid="sunzi-board"
      data-view={view}
      role="img"
    >
      <div className="sunzi-board__scene" style={sceneStyle}>
        <svg
          aria-hidden="true"
          className="sunzi-board__ground"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 1000 640"
        >
          {GRATICULE.map((offset) => (
            <g className="sunzi-graticule" key={offset}>
              <path d={`M${offset} 0 L${offset} 640`} />
              <path d={`M0 ${offset} L1000 ${offset}`} />
            </g>
          ))}
          {battle.regions.map((region) => {
            const [labelX, labelY] = centroid(region.points);

            return (
              <g key={region.id}>
                <path
                  className="sunzi-region"
                  d={polygonPath(region.points)}
                  data-held={step.held.includes(region.id) ? "a" : "b"}
                  data-region={region.id}
                />
                <ellipse className="sunzi-contour" cx={labelX} cy={labelY} rx="96" ry="58" />
                <text className="sunzi-region-label" x={labelX} y={labelY}>
                  {region.label}
                </text>
              </g>
            );
          })}
          {RIDGES.map((ridge) => (
            <path className="sunzi-ridge" d={ridge} key={ridge} />
          ))}
          {battle.rivers.map((river) => (
            <path className="sunzi-river" d={smoothPath(river.points)} key={river.id} />
          ))}
          {battle.places.map((place) => (
            <g data-place={place.id} key={place.id}>
              <circle
                className={`sunzi-place sunzi-place--${place.kind}`}
                cx={place.x}
                cy={place.y}
                r={place.kind === "capital" ? 8 : 6}
              />
              <text className="sunzi-place-label" x={place.x + 12} y={place.y - 9}>
                {place.name}
              </text>
            </g>
          ))}
        </svg>

        <svg
          aria-hidden="true"
          className="sunzi-board__moves"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 1000 640"
        >
          <defs>
            <marker
              id="sunzi-head-a"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              markerWidth="9"
              orient="auto"
              refX="7"
              refY="4.5"
            >
              <path className="sunzi-arrowhead" data-side="a" d="M0 0 L9 4.5 L0 9 Z" />
            </marker>
            <marker
              id="sunzi-head-b"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              markerWidth="9"
              orient="auto"
              refX="7"
              refY="4.5"
            >
              <path className="sunzi-arrowhead" data-side="b" d="M0 0 L9 4.5 L0 9 Z" />
            </marker>
          </defs>
          {step.moves.map((move) => (
            <path
              className="sunzi-arrow"
              d={routePath(move.from, move.to)}
              data-kind={move.kind}
              data-side={move.side}
              key={move.id}
              markerEnd={`url(#sunzi-head-${move.side})`}
            />
          ))}
        </svg>

        {/* Figures float one layer above the move lines so the 3D depth is real, not painted. */}
        <svg
          aria-hidden="true"
          className="sunzi-board__figures"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 1000 640"
        >
          {step.units.map((unit) => (
            <g
              className="sunzi-unit"
              data-branch={unit.branch}
              data-side={unit.side}
              data-unit={unit.id}
              key={unit.id}
              transform={`translate(${unit.x - 16} ${unit.y - 46})`}
            >
              <ellipse className="sunzi-unit__shadow" cx="16" cy="46" rx="13" ry="5" />
              <g className="sunzi-unit__figure">
                <UnitGlyph branch={unit.branch} />
              </g>
              <text className="sunzi-unit__label" x="16" y="62">
                {unit.label}
              </text>
              <text className="sunzi-branch-label" x="16" y="76">
                {BRANCH_LABEL[unit.branch]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div aria-hidden="true" className="sunzi-board__north">
        <svg viewBox="0 0 24 30">
          <title>北</title>
          <path d="M12 2 L18 22 L12 17 L6 22 Z" fill="currentColor" />
          <text x="12" y="29" textAnchor="middle">
            北
          </text>
        </svg>
      </div>
      <p aria-hidden="true" className="sunzi-board__scale">
        示意，非按比例
      </p>
    </div>
  );
}
