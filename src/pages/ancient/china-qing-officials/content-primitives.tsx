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
          <span className="font-mono-tech text-[0.7rem] tracking-[0.12em] text-muted-foreground">
            {note}
          </span>
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
