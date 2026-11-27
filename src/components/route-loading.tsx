export function RouteLoading() {
  return (
    <div
      aria-label="页面加载中"
      aria-live="polite"
      className="flex min-h-full w-full items-center justify-center px-6 py-20 text-center"
      role="status"
    >
      <div className="soft-card flex flex-col items-center gap-4 px-10 py-8">
        {/* 微缩装裱卷轴：宣纸画芯、紫檀轴杆、铜箍与玉轴头，取色同首页入场画卷。 */}
        <div aria-hidden="true" className="relative h-10 w-44">
          <div className="route-scroll-paper absolute inset-y-1 right-2 left-2 bg-[linear-gradient(180deg,hsl(var(--scroll-paper)),hsl(var(--scroll-paper-deep)))] shadow-[inset_0_0_14px_hsl(var(--ochre)/0.3)]" />
          <div className="route-scroll-roll--left absolute inset-y-0 left-0 w-3 rounded-full bg-[linear-gradient(90deg,hsl(var(--scroll-wood)/0.85),hsl(var(--scroll-bronze)/0.55),hsl(var(--scroll-wood)))]" />
          <div className="route-scroll-roll--right absolute inset-y-0 right-0 w-3 rounded-full bg-[linear-gradient(270deg,hsl(var(--scroll-wood)/0.85),hsl(var(--scroll-bronze)/0.55),hsl(var(--scroll-wood)))]" />
          <span className="absolute top-0 left-0 h-1.5 w-[1.1rem] -translate-x-[1px] rounded-[50%] border border-ink/30 bg-[hsl(var(--scroll-jade)/0.75)]" />
          <span className="absolute bottom-0 left-0 h-1.5 w-[1.1rem] -translate-x-[1px] rounded-[50%] border border-ink/30 bg-[hsl(var(--scroll-jade)/0.7)]" />
          <span className="absolute top-0 right-0 h-1.5 w-[1.1rem] translate-x-[1px] rounded-[50%] border border-ink/30 bg-[hsl(var(--scroll-jade)/0.75)]" />
          <span className="absolute right-0 bottom-0 h-1.5 w-[1.1rem] translate-x-[1px] rounded-[50%] border border-ink/30 bg-[hsl(var(--scroll-jade)/0.7)]" />
          <span className="absolute top-1 left-1/2 h-0.5 w-[92%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,hsl(var(--vermillion)/0.55),transparent)]" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-brush text-xl text-ink">正在铺展卷轴</span>
          <span className="font-kai text-muted-foreground text-xs">墨迹未干，请稍候片刻</span>
        </div>
      </div>
    </div>
  );
}
