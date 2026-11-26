import type { ReactNode } from "react";

import { cn } from "../../../lib/utils";

/**
 * 内容区的共享视觉原语：把中间内容区各区块统一成「一卷官制档案」的语言。
 * 只负责呈现，不承载状态与业务；标记均为 aria-hidden，不改变可访问名称。
 */

/** 朱砂印签：章节序号读作一枚小印章。 */
export function SealBadge({ mark, className }: { mark: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-vermillion/45 bg-vermillion/10 font-brush text-sm leading-none text-vermillion",
        className,
      )}
    >
      {mark}
    </span>
  );
}

/**
 * 层级透视面片：一枚带厚度的菱面，中心朱点与面片共用同一几何中心。
 * 层级越深面片越小，和竖线一起把「从属越远、透视越收敛」画成可读的纵深关系。
 * 纯装饰，不改变可访问名称；调用方负责把面片中心与竖线中心对齐。
 */
export function TierPlane({
  depth,
  count,
  className,
}: {
  depth: number;
  count: number;
  className?: string;
}) {
  const shrink = 1 - (Math.min(depth, Math.max(0, count - 1)) / Math.max(1, count - 1)) * 0.4;
  return (
    <svg
      aria-hidden="true"
      className={cn("h-5 w-10 overflow-visible", className)}
      style={{ transform: `scale(${shrink})`, transformOrigin: "50% 50%" }}
      viewBox="0 0 40 24"
    >
      <path
        className="fill-vermillion/[0.07] stroke-vermillion/40"
        d="M1 9 L20 2.5 L39 9 L20 15.5 Z"
        strokeWidth="0.9"
      />
      <path className="fill-vermillion/15" d="M1 9 L20 15.5 L20 19 L1 12.5 Z" />
      <path className="fill-vermillion/10" d="M39 9 L20 15.5 L20 19 L39 12.5 Z" />
      <path className="stroke-vermillion/25" d="M8 11 L20 6 L32 11" fill="none" strokeWidth="0.5" />
      <circle className="fill-vermillion" cx="20" cy="9" r="2.6" />
      <circle className="fill-paper/80" cx="19.2" cy="8.2" r="0.7" />
    </svg>
  );
}

/** 章节题头：印签 + 毛笔题 + 等宽副题 + 起笔细线，给长内容一个可扫读的锚点。 */
export function ArchiveSectionHead({
  mark,
  title,
  note,
  children,
  className,
}: {
  mark: string;
  title: string;
  note?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SealBadge mark={mark} />
        <h3 className="font-brush text-xl text-ink">{title}</h3>
        {note ? (
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground">{note}</span>
        ) : null}
        {children}
      </div>
      <span
        aria-hidden="true"
        className="block h-px w-full bg-[linear-gradient(90deg,hsl(var(--vermillion)/0.45),hsl(var(--ink)/0.08)_22%,transparent)]"
      />
    </div>
  );
}
