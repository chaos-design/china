export function RouteLoading() {
  return (
    <div
      className="flex min-h-full w-full items-center justify-center px-6 py-20 text-center"
      role="status"
      aria-live="polite"
      aria-label="页面加载中"
    >
      <div className="soft-card flex flex-col items-center gap-4 px-8 py-7">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-vermillion" />
        <div className="flex flex-col gap-1">
          <span className="font-display text-xl font-bold text-ink">正在铺展卷轴</span>
          <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.24em] uppercase">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}
