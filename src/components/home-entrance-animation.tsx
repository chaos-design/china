import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../lib/utils";
import { HistoryScrollUnfold } from "./history-scroll-unfold";

interface HomeEntranceAnimationProps {
  onComplete?: () => void;
}

const EXIT_DURATION_MS = 1000;

export function HomeEntranceAnimation({ onComplete }: HomeEntranceAnimationProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  const completeEntrance = useCallback(() => {
    setIsLeaving(true);
    window.setTimeout(() => onComplete?.(), EXIT_DURATION_MS);
  }, [onComplete]);

  const overlay = (
    <div
      aria-label="首页入场动画"
      className={cn(
        // z-[100] 高于 header(z-20) 与 AccentPicker(z-50)，确保全屏覆盖顶部导航
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4 transition-opacity duration-700 [transform:translate3d(0,0,0)] sm:px-8",
        "bg-[linear-gradient(180deg,hsl(40_22%_92%),hsl(36_20%_85%))]",
        isLeaving && "pointer-events-none opacity-0",
      )}
      data-testid="home-entrance-animation"
      role="status"
    >
      {/* 水墨晕染：远山留白与朱砂氤氲 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_16%_12%,hsl(var(--ink)/0.14),transparent_34%),radial-gradient(ellipse_at_82%_8%,hsl(var(--blueprint)/0.16),transparent_38%),radial-gradient(ellipse_at_50%_104%,hsl(var(--vermillion)/0.12),transparent_46%)]" />
      {/* 宣纸细网纹理 */}
      <div className="absolute inset-0 opacity-45 [background-image:repeating-linear-gradient(90deg,hsl(var(--ink)/0.025)_0,hsl(var(--ink)/0.025)_1px,transparent_1px,transparent_9px),repeating-linear-gradient(0deg,hsl(var(--ink)/0.02)_0,hsl(var(--ink)/0.02)_1px,transparent_1px,transparent_10px)]" />
      {/* 写意远山墨影 */}
      <div
        aria-hidden="true"
        className="absolute right-[-10vw] bottom-[-7vw] left-[-8vw] h-[40vh] [background-image:radial-gradient(ellipse_60%_100%_at_22%_100%,hsl(var(--ink)/0.16),transparent_70%),radial-gradient(ellipse_50%_100%_at_52%_100%,hsl(var(--ink)/0.11),transparent_72%),radial-gradient(ellipse_64%_100%_at_82%_100%,hsl(var(--ink)/0.14),transparent_70%)] blur-[2px]"
      />
      {/* 留白飞鸟（两笔写意） */}
      <div
        aria-hidden="true"
        className="absolute top-[16%] right-[18%] hidden text-3xl leading-none text-ink/25 sm:block"
      >
        ㇏㇀
      </div>
      {/* 纵向题签 */}
      {/* <div
        aria-hidden="true"
        className="absolute top-[12%] left-6 hidden font-display text-7xl leading-[1.05] font-black text-ink/[0.06] [writing-mode:vertical-rl] sm:block"
      >
        资治通览
      </div> */}
      {/* 朱砂闲章 */}
      {/* <div
        aria-hidden="true"
        className="font-brush absolute right-8 bottom-10 hidden h-16 w-16 rotate-3 items-center justify-center rounded-[3px] border-2 border-vermillion/55 bg-vermillion/5 text-vermillion/70 text-lg leading-tight sm:flex"
      >
        <span className="grid grid-cols-2 gap-x-1 text-center">
          <span>通</span>
          <span>古</span>
          <span>览</span>
          <span>今</span>
        </span>
      </div> */}
      {/* 竖排草书题诗 */}
      <div
        aria-hidden="true"
        className="font-cursive absolute top-[14%] left-8 hidden text-3xl leading-[1.5] text-ink/25 [writing-mode:vertical-rl] sm:block"
      >
        滚滚长江东逝水
        <br />
        浪花淘尽英雄
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <HistoryScrollUnfold
          config={{
            contentDelayRatio: 0.44,
            contentRevealRatio: 0.56,
            duration: 2.5,
            ease: "power2.inOut",
            holdDuration: 1,
          }}
          contentClassName="max-w-5xl items-center px-10 py-16 text-center sm:px-20 lg:px-28"
          onComplete={completeEntrance}
          paperClassName="inset-x-9 top-6 bottom-6 sm:inset-x-11 sm:top-10 sm:bottom-10"
          stageClassName="min-h-[82vh] sm:min-h-[84vh] lg:min-h-[86vh]"
        >
          <div className="relative flex min-h-[52vh] w-full flex-col items-center justify-center gap-7">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-2 h-36 bg-[radial-gradient(ellipse_at_center,hsl(var(--ink)/0.1),transparent_64%)] blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute top-8 right-4 hidden border-r border-ink/20 pr-3 font-display text-ink/35 text-sm tracking-[0.35em] [writing-mode:vertical-rl] sm:block"
            >
              通览古今兴废
            </div>
            <div
              aria-hidden="true"
              className="font-brush absolute bottom-8 left-4 hidden h-16 w-16 -rotate-6 items-center justify-center border-2 border-vermillion/45 bg-vermillion/5 text-vermillion/65 text-lg leading-tight sm:flex"
            >
              <span className="grid grid-cols-2 gap-x-1 text-center">
                <span>治</span>
                <span>乱</span>
                <span>兴</span>
                <span>替</span>
              </span>
            </div>
            <span className="eyebrow relative">卷首 · 史海钩沉</span>
            <span className="font-brush relative text-6xl tracking-tight text-ink drop-shadow-[0_2px_10px_hsl(var(--ink)/0.12)] sm:text-8xl lg:text-9xl">
              中国古代全览
            </span>
            <span className="font-cursive relative flex items-center gap-3 text-2xl text-blueprint/80 sm:text-3xl">
              以编年为经 · 通览治乱兴替
            </span>
            <div
              aria-hidden="true"
              className="relative h-5 w-56 opacity-70 [background-image:radial-gradient(circle,hsl(var(--vermillion)/0.72)_0_2px,transparent_2px_100%)] [background-size:18px_18px] [mask-image:linear-gradient(90deg,transparent,black_20%,black_80%,transparent)]"
            />
            <span className="relative max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              水墨初开，卷载朝代脉络与治国方略；待画卷铺陈之后，再入正文。
            </span>
            <div className="relative mt-2 flex items-center gap-4 text-vermillion/75">
              <span className="h-px w-16 bg-vermillion/45" />
              <span className="font-cursive text-2xl tracking-[0.3em]">治乱兴替</span>
              <span className="h-px w-16 bg-vermillion/45" />
            </div>
          </div>
        </HistoryScrollUnfold>
      </div>
    </div>
  );

  return typeof document === "undefined" ? overlay : createPortal(overlay, document.body);
}
