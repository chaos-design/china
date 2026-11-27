import type { UnitBranch } from "./types";

/**
 * 军种小人：同一套拟人骨架，按兵种换持械、坐具与旗号。
 * 仍是地图符号而非插画：固定 32×32、随沙盘缩放补偿，currentColor 继承阵营色，
 * 面部与甲片用纸色/墨色分层，保证缩小后仍能读出「人」而不是一根柱子。
 */

const SKIN = "hsl(var(--paper))";

function Human({ x = 16, y = 9, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* 盔缨 */}
      <path d="M0 -5 L0 -9 M-2 -8 L2 -8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {/* 面与盔 */}
      <circle cx="0" cy="0" r="3.1" fill={SKIN} stroke="currentColor" strokeWidth="1.1" />
      <path d="M-3.2 -0.6 A3.2 3.2 0 0 1 3.2 -0.6 Z" fill="currentColor" />
      <circle cx="-1.2" cy="0.4" r="0.55" fill="currentColor" />
      <circle cx="1.2" cy="0.4" r="0.55" fill="currentColor" />
      {/* 颈与肩甲 */}
      <path
        d="M0 3 L0 4.4 M-3.6 5.4 L3.6 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* 躯干甲片 */}
      <path d="M-2.8 5 L2.8 5 L2.2 13 L-2.2 13 Z" fill="currentColor" opacity="0.86" />
      <path
        d="M-2.2 8 L2.2 8 M-2.1 10.6 L2.1 10.6"
        fill="none"
        stroke={SKIN}
        strokeWidth="0.8"
        opacity="0.7"
      />
      {/* 双臂 */}
      <path
        d="M-2.8 6 L-5 11 M2.8 6 L5 10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      {/* 腿与靴 */}
      <path
        d="M-1.2 13 L-2 19 M1.2 13 L2 19"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
      <path
        d="M-4 19.4 L-0.6 19.4 M0.6 19.4 L4 19.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </g>
  );
}

function Flag() {
  return (
    <g>
      <path d="M4 25 L4 8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 8 L13 10.5 L4 13 Z" fill="currentColor" opacity="0.9" />
      <path d="M4 7 L4 5" fill="none" stroke="currentColor" strokeWidth="0.9" />
    </g>
  );
}

function Spear() {
  return (
    <g>
      <path d="M22 3 L22 26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 1 L19.6 5 L24.4 5 Z" fill="currentColor" />
      <path d="M18.4 6 L25.6 7.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </g>
  );
}

function Horse() {
  return (
    <g>
      <path
        d="M5 23 Q7 17 14 18.5 L19 14 L23 15 L25 19 L22 23 L14 23 Q8 25 5 23 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M6 22 L5 27 M11 23 L11 27 M20 22 L20 27 M23 21 L24 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M5 27 L3 28 M24 26 L26 27" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M19 14 L18 10 L21 9" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </g>
  );
}

function Chariot() {
  return (
    <g>
      <circle cx="9" cy="24" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="24" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 19.6 L9 28.4 M4.6 24 L13.4 24 M23 19.6 L23 28.4 M18.6 24 L27.4 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path d="M6 18 L26 18 L24 22 L8 22 Z" fill="currentColor" opacity="0.82" />
      <path d="M26 18 L30 12" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </g>
  );
}

function Boat() {
  return (
    <g>
      <path d="M3 23 L29 23 L24 29 L8 29 Z" fill="currentColor" opacity="0.78" />
      <path d="M16 23 L16 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 7 L27 17 L17 17 Z" fill="currentColor" opacity="0.62" />
      <path d="M6 25 L2 29 M26 25 L30 29" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </g>
  );
}

export function UnitGlyph({ branch }: { branch: UnitBranch }) {
  switch (branch) {
    case "infantry":
      return (
        <g>
          <Flag />
          <Spear />
          <path d="M12 12 L16 12 L15 19 L13 19 Z" fill="currentColor" opacity="0.55" />
          <Human />
        </g>
      );
    case "crossbow":
      return (
        <g>
          <Flag />
          <path
            d="M19 12 Q25 6 31 12 M19 12 L25 16 L31 12 M25 16 L25 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M25 15 L25 22" fill="none" stroke={SKIN} strokeWidth="0.9" />
          <Human />
        </g>
      );
    case "cavalry":
      return (
        <g>
          <Flag />
          <Horse />
          <Human x={19} y={12} scale={0.68} />
        </g>
      );
    case "chariot":
      return (
        <g>
          <Flag />
          <Chariot />
          <Human x={16} y={11} scale={0.66} />
        </g>
      );
    case "navy":
      return (
        <g>
          <Boat />
          <Human x={11} y={13} scale={0.62} />
        </g>
      );
  }
}
