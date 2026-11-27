import type { UnitBranch } from "./types";

/**
 * 军种小人：同一套 32×32 人形骨架，按兵种换持械与坐具。
 * 全部是地图符号而非插画，尺寸固定、随沙盘缩放补偿，颜色由 currentColor 继承阵营色。
 */
export function UnitGlyph({ branch }: { branch: UnitBranch }) {
  const limbs = (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <path d="M16 11 L16 20 M16 21 L12 27 M16 21 L20 27 M11 15 L21 15" />
    </g>
  );
  const head = <circle cx="16" cy="7" r="3" fill="currentColor" />;

  switch (branch) {
    case "infantry":
      return (
        <g>
          <path d="M24 4 L24 27" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M24 2 L22 6 L26 6 Z" fill="currentColor" />
          {head}
          {limbs}
        </g>
      );
    case "crossbow":
      return (
        <g>
          <path
            d="M7 12 Q16 5 25 12 M7 12 L16 17 L25 12 M16 17 L16 25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          {head}
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
            <path d="M16 11 L16 20 M16 21 L12 27 M16 21 L20 27 M11 15 L21 15" />
          </g>
        </g>
      );
    case "cavalry":
      return (
        <g>
          <path
            d="M4 25 Q8 18 16 20 L21 15 L25 16 L27 21 L23 26 L16 26 Q9 28 4 25 Z"
            fill="currentColor"
            opacity="0.72"
          />
          <path d="M4 25 L2 29 M27 21 L30 19" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="20" cy="11" r="2.6" fill="currentColor" />
          <path
            d="M20 14 L18 20 M18 20 L15 24 M18 20 L22 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </g>
      );
    case "chariot":
      return (
        <g>
          <circle cx="9" cy="25" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="23" cy="25" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 19 L26 19 L24 22 L8 22 Z M26 19 L30 13" fill="currentColor" />
          <circle cx="16" cy="11" r="2.6" fill="currentColor" />
          <path
            d="M16 14 L16 19 M12 16 L20 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </g>
      );
    case "navy":
      return (
        <g>
          <path d="M3 24 L29 24 L24 29 L8 29 Z" fill="currentColor" opacity="0.82" />
          <path d="M16 24 L16 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M17 7 L27 17 L17 17 Z" fill="currentColor" opacity="0.7" />
          <circle cx="11" cy="17" r="2.6" fill="currentColor" />
          <path
            d="M11 20 L11 24 M8 21 L14 21"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </g>
      );
  }
}
