export function RouteLoading() {
  return (
    <div
      aria-label="页面加载中"
      aria-live="polite"
      className="route-loading flex min-h-full w-full flex-col items-center justify-center gap-9 px-6 py-20 text-center"
      role="status"
    >
      {/* 手卷舆图：横向展卷的兵要舆图——天/地绫、宣纸画芯（帘纹 + 墨晕 + 淡墨山川 +
          罗盘 + 军标箭头 + 城郭）、朱文方印，两端紫檀轴杆（铜箍 / 玉轴头）向两侧抽出。 */}
      <div aria-hidden="true" className="route-loading__scroll relative">
        <div className="route-loading__brocade route-loading__brocade--top" />
        <div className="route-loading__paper route-scroll-paper">
          <span className="route-loading__vein" />
          <span className="route-loading__mist" />
          <svg aria-hidden="true" className="route-loading__terrain" viewBox="0 0 320 84">
            {/* 淡墨山川：远山两叠 + 河流一道 */}
            <path d="M2 66 C 30 40 52 34 78 50 C 100 34 122 30 146 46 C 170 30 200 32 226 48 C 252 36 284 40 318 58 L 318 84 L 2 84 Z" />
            <path d="M96 70 C 118 54 140 52 162 62 C 186 50 214 52 238 64 L 238 84 L 96 84 Z" />
            <path
              className="route-loading__river"
              d="M0 58 C 46 52 92 62 138 56 C 188 49 240 60 320 50"
            />
          </svg>
          {/* 罗盘：军图指北 */}
          <svg aria-hidden="true" className="route-loading__compass" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" />
            <circle className="route-loading__compass-inner" cx="22" cy="22" r="14.5" />
            <path d="M22 1.5 L25 6 L22 5 L19 6 Z M22 42.5 L25 38 L22 39 L19 38 Z M1.5 22 L6 19 L5 22 L6 25 Z M42.5 22 L38 19 L39 22 L38 25 Z" />
            <path className="route-loading__needle" d="M22 7 L26 22 L22 26 L18 22 Z" />
            <path d="M22 37 L25 24 L22 20.5 L19 24 Z" />
          </svg>
          {/* 军标箭头与城郭：兵要舆图的标图笔意 */}
          <svg aria-hidden="true" className="route-loading__marks" viewBox="0 0 320 84">
            <path
              className="route-loading__mark-arrow"
              d="M188 70 C 214 62 238 56 262 40 L 256 36 L 276 28 L 268 48 L 264 42 C 242 58 216 66 190 74 Z"
            />
            <rect className="route-loading__mark-city" height="14" width="14" x="64" y="22" />
            <rect className="route-loading__mark-city" height="10" width="10" x="148" y="14" />
          </svg>
          <span className="route-loading__caption font-kai">兵要舆图</span>
          <span className="route-loading__seal route-loading__seal--char">全览</span>
          <span className="route-scroll-sweep route-loading__sweep" />
        </div>
        <div className="route-loading__brocade route-loading__brocade--bottom" />
        <div className="route-loading__rod route-loading__rod--left route-scroll-roll--left">
          <span className="route-loading__ferrule route-loading__ferrule--near" />
          <span className="route-loading__ferrule route-loading__ferrule--far" />
          <span className="route-loading__knob route-loading__knob--left" />
        </div>
        <div className="route-loading__rod route-loading__rod--right route-scroll-roll--right">
          <span className="route-loading__ferrule route-loading__ferrule--near" />
          <span className="route-loading__ferrule route-loading__ferrule--far" />
          <span className="route-loading__knob route-loading__knob--right" />
        </div>
        <span className="route-loading__tie route-loading__tie--left" />
        <span className="route-loading__tie route-loading__tie--right" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <span className="route-loading__title font-brush text-2xl text-ink">正在铺展卷轴</span>
        <span className="route-loading__divider" aria-hidden="true" />
        <span className="font-kai text-muted-foreground text-xs">墨迹未干，请稍候片刻</span>
      </div>
    </div>
  );
}
