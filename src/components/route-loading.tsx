export function RouteLoading() {
  return (
    <div
      aria-label="页面加载中"
      aria-live="polite"
      className="route-loading flex min-h-full w-full flex-col items-center justify-center gap-9 px-6 py-20 text-center"
      role="status"
    >
      {/* 挂轴装裱：天绫 · 惊燕 · 宣纸画芯（帘纹 + 墨晕 + 淡墨山影）· 朱文方印 · 地绫 · 紫檀轴杆（铜箍 / 玉轴头）。 */}
      <div aria-hidden="true" className="route-loading__scroll relative">
        <div className="route-loading__brocade route-loading__brocade--head" />
        <span className="route-loading__ribbon route-loading__ribbon--left" />
        <span className="route-loading__ribbon route-loading__ribbon--right" />
        <div className="route-loading__paper route-scroll-paper">
          <span className="route-loading__vein" />
          <span className="route-loading__mist" />
          <svg aria-hidden="true" className="route-loading__hills" viewBox="0 0 176 56">
            <path d="M4 52 C 28 34 44 30 62 42 C 78 30 92 26 108 38 C 126 28 148 30 172 46 L 172 56 L 4 56 Z" />
            <path d="M64 52 C 82 40 96 38 112 46 C 130 38 150 40 170 50 L 170 56 L 64 56 Z" />
          </svg>
          <span className="route-loading__seal route-loading__seal--char">全览</span>
          <span className="route-loading__caption font-kai">輿圖・兵要</span>
          <span className="route-scroll-sweep route-loading__sweep" />
        </div>
        <div className="route-loading__brocade route-loading__brocade--foot" />
        <div className="route-loading__rod route-loading__rod--left route-scroll-roll--left">
          <span className="route-loading__ferrule" />
          <span className="route-loading__knob" />
        </div>
        <div className="route-loading__rod route-loading__rod--right route-scroll-roll--right">
          <span className="route-loading__ferrule" />
          <span className="route-loading__knob" />
        </div>
        <span className="route-loading__cord" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <span className="route-loading__title font-brush text-2xl text-ink">正在铺展卷轴</span>
        <span className="route-loading__divider" aria-hidden="true" />
        <span className="font-kai text-muted-foreground text-xs">墨迹未干，请稍候片刻</span>
      </div>
    </div>
  );
}
