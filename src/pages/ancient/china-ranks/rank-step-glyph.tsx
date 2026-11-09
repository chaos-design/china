/**
 * 品级阶梯的装饰性等距台阶图形（纯几何、无文字、不接收交互）：
 * 每个等级行一枚固定比例的小台阶，行的逐级缩进让整列台阶自然连成阶梯。
 * 与 hand-drawn-map 的 china-map-geometry 同一思路——多边形是由常数推出的
 * 纯函数，可单测；颜色全部走裸通道 token，不碰带完整 hsl 值的 --card/--paper。
 */

/** 单枚台阶的 viewBox 尺寸。 */
export const STEP_GLYPH_VIEWBOX = { width: 40, height: 44 } as const;

export interface StepGlyph {
  front: string;
  side: string;
  tread: string;
}

/** 一枚等距台阶的三面多边形坐标（points 字符串）。 */
export function computeStepGlyph(): StepGlyph {
  // 前立面 24×24，顶面与侧面各向右上斜切 10/8。
  return {
    tread: "2,16 12,8 36,8 26,16",
    front: "2,16 26,16 26,40 2,40",
    side: "26,16 36,8 36,32 26,40",
  };
}

export function LadderStep({ apex = false }: { apex?: boolean }) {
  const glyph = computeStepGlyph();

  return (
    <svg
      aria-hidden="true"
      className="h-10 w-9 shrink-0 self-center opacity-85"
      role="presentation"
      viewBox={`0 0 ${STEP_GLYPH_VIEWBOX.width} ${STEP_GLYPH_VIEWBOX.height}`}
    >
      <polygon
        fill={apex ? "hsl(var(--vermillion) / 0.16)" : "hsl(var(--paper) / 0.9)"}
        points={glyph.tread}
        stroke="hsl(var(--ink) / 0.35)"
        strokeWidth="1"
      />
      <polygon
        fill={apex ? "hsl(var(--vermillion) / 0.08)" : "var(--card)"}
        points={glyph.front}
        stroke="hsl(var(--ink) / 0.35)"
        strokeWidth="1"
      />
      <polygon
        fill="hsl(var(--ink) / 0.1)"
        points={glyph.side}
        stroke="hsl(var(--ink) / 0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}
