import { cn } from "../../../lib/utils";

/**
 * 画布宿主上方的状态层：加载反馈 + WebGL 异常态。
 * - ready 之前显示轻量载入提示，避免首帧空白；
 * - failed 时给出可读的降级说明，「打开族谱」保持原有入口，另加入「重试」按钮重试建场景。
 * 两层都 pointer-events-none，只有卡片内的按钮重新开启交互。
 */
export function RanksSceneStatus({
  ready,
  failed,
  onOpenGenealogy,
  onRetry,
}: {
  ready: boolean;
  failed: boolean;
  onOpenGenealogy: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {!ready && !failed ? (
        <div
          aria-live="polite"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
          role="status"
        >
          <span
            aria-hidden="true"
            className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-vermillion"
          />
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            正在生长品级树
          </span>
        </div>
      ) : null}

      {failed ? (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink/15 bg-paper/95 p-5 text-center shadow-[0_18px_48px_hsl(var(--ink)/0.18)]">
          <p className="text-muted-foreground text-sm leading-relaxed">
            当前浏览器未能启用
            WebGL，立体树无法绘制。右侧「品级资料」抽屉的族谱、阶梯与断面仍可查看全部品级与职权。
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              className={cn(
                "rounded-full border border-vermillion/35 bg-vermillion/10 px-3 py-1 font-body text-xs text-vermillion transition-colors hover:bg-vermillion/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              onClick={onOpenGenealogy}
              type="button"
            >
              打开「族谱」对照 →
            </button>
            <button
              className="rounded-full border border-ink/15 bg-card/70 px-3 py-1 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={onRetry}
              type="button"
            >
              重试
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
