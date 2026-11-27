import type { CSSProperties } from "react";

import { centroid, polygonPath, routePath, smoothPath } from "./board-geometry";
import type { BattleScenario, BattleStep } from "./types";

export interface SandTableProps {
  battle: BattleScenario;
  playing: boolean;
  step: BattleStep;
  view: "sand" | "top";
  zoom: number;
}

/** The signature: one tilted board that shows control, routes and decisions for a single step. */
export function SandTable({ battle, playing, step, view, zoom }: SandTableProps) {
  const sceneStyle = { "--sunzi-zoom": zoom } as CSSProperties;

  return (
    <div
      aria-label={`${battle.name}，${step.title}沙盘示意。${step.situation}`}
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
                <text className="sunzi-region-label" x={labelX} y={labelY}>
                  {region.label}
                </text>
              </g>
            );
          })}
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
          {step.units.map((unit) => (
            <g className="sunzi-unit" data-side={unit.side} data-unit={unit.id} key={unit.id}>
              <circle className="sunzi-unit__disc" cx={unit.x} cy={unit.y} r="15" />
              <text className="sunzi-unit__label" x={unit.x} y={unit.y + 6}>
                {unit.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
