import type { RankTreeHover } from "./rank-tree-scene";

/**
 * 底部居中读出：hover 信息 / 聚焦提示。pointer-events-none，不挡画布拖拽。
 * 窄屏隐藏（抽屉已是底部 sheet，读出会被覆盖）。
 */
export function RanksHoverReadout({
  hover,
  focusLabel,
  dynastyName,
  compareName,
}: {
  hover: RankTreeHover | null;
  focusLabel: string;
  dynastyName: string;
  compareName: string | undefined;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 hidden justify-center lg:bottom-5 lg:flex">
      {hover ? (
        <div className="rounded-xl border border-ink/10 bg-paper/85 px-4 py-2.5 text-center shadow-[0_12px_32px_hsl(var(--ink)/0.12)] backdrop-blur-md">
          <div className="flex flex-wrap items-baseline justify-center gap-x-2">
            <span className="font-brush text-xl text-ink">{hover.title}</span>
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.06em]">
              {hover.subtitle}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
            {hover.detail}
          </p>
        </div>
      ) : (
        <span className="rounded-full border border-ink/10 bg-paper/85 px-4 py-1.5 font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em] backdrop-blur-md">
          聚焦 {focusLabel}
          {compareName ? ` · ${dynastyName} / ${compareName}` : ""} · 拖拽旋转 滚轮缩放 点选节点
        </span>
      )}
    </div>
  );
}
