import { gsap } from "gsap";
import { type ReactNode, useLayoutEffect, useRef } from "react";

import { cn } from "../lib/utils";

export interface ScrollUnfoldAnimationConfig {
  contentDelayRatio: number;
  contentRevealRatio: number;
  duration: number;
  ease: string;
  holdDuration: number;
}

export const DEFAULT_SCROLL_UNFOLD_CONFIG: ScrollUnfoldAnimationConfig = {
  contentDelayRatio: 0.38,
  contentRevealRatio: 0.5,
  duration: 2.6,
  ease: "power3.inOut",
  holdDuration: 0,
};

interface HistoryScrollUnfoldProps {
  children: ReactNode;
  config?: Partial<ScrollUnfoldAnimationConfig>;
  contentClassName?: string;
  onComplete?: () => void;
  paperClassName?: string;
  stageClassName?: string;
}

export function getScrollRollOffsets(stageWidth: number, rollWidth: number) {
  const travelDistance = Math.max(0, stageWidth / 2 - rollWidth);

  return {
    left: travelDistance,
    right: -travelDistance,
  };
}

function shouldReduceMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function HistoryScrollUnfold({
  children,
  config,
  contentClassName,
  onComplete,
  paperClassName,
  stageClassName,
}: HistoryScrollUnfoldProps) {
  const animationConfig = { ...DEFAULT_SCROLL_UNFOLD_CONFIG, ...config };
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const leftRollRef = useRef<HTMLDivElement>(null);
  const rightRollRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let pendingHold: gsap.core.Tween | null = null;
    const stage = stageRef.current;
    const paper = paperRef.current;
    const mask = maskRef.current;
    const content = contentRef.current;
    const leftRoll = leftRollRef.current;
    const rightRoll = rightRollRef.current;
    const light = lightRef.current;

    if (!stage || !paper || !mask || !content || !leftRoll || !rightRoll || !light) return;

    const offsets = getScrollRollOffsets(stage.offsetWidth, leftRoll.offsetWidth);

    if (shouldReduceMotion()) {
      gsap.set(stage, { opacity: 1 });
      gsap.set(paper, {
        scaleX: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(mask, {
        clipPath: "inset(0 0% 0 0%)",
      });
      gsap.set(content, {
        filter: "blur(0px)",
        opacity: 1,
        y: 0,
      });
      gsap.set([leftRoll, rightRoll], {
        x: 0,
      });
      gsap.set(light, {
        opacity: 1,
        scaleX: 1,
      });
      onComplete?.();
      return;
    }

    const context = gsap.context(() => {
      gsap.set(stage, { opacity: 1 });
      gsap.set(paper, {
        force3D: true,
        scaleX: 0.01,
        transformOrigin: "50% 50%",
      });
      gsap.set(mask, {
        clipPath: "inset(0 50% 0 50%)",
        force3D: true,
      });
      gsap.set(content, {
        filter: "blur(7px)",
        opacity: 0,
        y: 14,
      });
      gsap.set(leftRoll, {
        force3D: true,
        x: offsets.left,
      });
      gsap.set(rightRoll, {
        force3D: true,
        x: offsets.right,
      });
      gsap.set(light, {
        opacity: 0,
        scaleX: 0.01,
        transformOrigin: "50% 50%",
      });

      const timeline = gsap.timeline({
        defaults: { ease: animationConfig.ease },
      });

      // Only transform, opacity, filter, and clip-path are animated to keep the sequence on the compositor.
      timeline
        .to(
          [leftRoll, rightRoll],
          {
            duration: animationConfig.duration,
            x: 0,
          },
          0,
        )
        .to(
          paper,
          {
            duration: animationConfig.duration,
            scaleX: 1,
          },
          0,
        )
        .to(
          mask,
          {
            clipPath: "inset(0 0% 0 0%)",
            duration: animationConfig.duration,
          },
          0,
        )
        .to(
          light,
          {
            duration: animationConfig.duration * 0.85,
            opacity: 1,
            scaleX: 1,
          },
          0,
        )
        .to(
          content,
          {
            duration: animationConfig.duration * animationConfig.contentRevealRatio,
            filter: "blur(0px)",
            opacity: 1,
            y: 0,
          },
          animationConfig.duration * animationConfig.contentDelayRatio,
        );

      const handleComplete = onComplete
        ? () => {
            if (animationConfig.holdDuration > 0) {
              // 必须自己留住这个 tween：delayedCall 是在 timeline 的事件回调里创建的，
              // 而事件回调早于 context 作用域结束，gsap.context 记不到它，
              // 于是它挂在全局 timeline 上，context.revert() 杀不掉。
              // 后果是组件卸载后 holdDuration 之后回调照样触发——线上是对已卸载的
              // 组件 setState，测试里是上一条用例的回调污染下一条用例的 sessionStorage。
              pendingHold?.kill();
              pendingHold = gsap.delayedCall(animationConfig.holdDuration, () => {
                pendingHold = null;
                onComplete();
              });
            } else {
              onComplete();
            }
          }
        : null;

      timeline.eventCallback("onComplete", handleComplete);
    }, stage);

    return () => {
      pendingHold?.kill();
      context.revert();
    };
  }, [
    animationConfig.contentDelayRatio,
    animationConfig.contentRevealRatio,
    animationConfig.duration,
    animationConfig.ease,
    animationConfig.holdDuration,
    onComplete,
  ]);

  return (
    <section aria-label="历史画卷展开" className="relative">
      <div
        ref={stageRef}
        className={cn(
          "relative isolate min-h-[34rem] opacity-0 sm:min-h-[32rem] lg:min-h-[30rem]",
          stageClassName,
        )}
        data-testid="history-scroll-unfold"
      >
        {/* 画芯：仿古宣纸，带做旧底纹与内框 */}
        <div
          ref={paperRef}
          className={cn(
            "absolute inset-x-10 top-7 bottom-7 overflow-hidden border border-ink/35 bg-[linear-gradient(160deg,hsl(40_42%_85%),hsl(36_36%_79%)_55%,hsl(32_32%_72%))] shadow-[0_30px_80px_hsl(var(--ink)/0.22),inset_0_0_120px_hsl(34_34%_56%/0.45)] [transform:translate3d(0,0,0)_scaleX(0.01)] [will-change:transform]",
            paperClassName,
          )}
        >
          {/* 宣纸纤维与水渍墨晕 */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_16%,hsl(var(--ink)/0.09),transparent_34%),radial-gradient(ellipse_at_84%_82%,hsl(var(--blueprint)/0.1),transparent_36%),radial-gradient(ellipse_at_64%_30%,hsl(28_40%_52%/0.24),transparent_40%),radial-gradient(ellipse_at_38%_88%,hsl(30_36%_46%/0.2),transparent_38%)]" />
          {/* 古纸做旧斑渍 */}
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_12%_42%,hsl(32_40%_40%/0.16),transparent_8%),radial-gradient(circle_at_72%_18%,hsl(30_38%_44%/0.14),transparent_7%),radial-gradient(circle_at_88%_64%,hsl(28_36%_38%/0.15),transparent_9%),radial-gradient(circle_at_46%_76%,hsl(34_40%_42%/0.12),transparent_6%)]" />
          <div className="absolute inset-0 opacity-45 [background-image:repeating-linear-gradient(115deg,hsl(var(--ink)/0.025)_0,hsl(var(--ink)/0.025)_1px,transparent_1px,transparent_6px)]" />
          {/* 画芯卷入卷轴处的弧形内阴影，使画卷与画柄衔接紧密丝滑 */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-[linear-gradient(90deg,hsl(26_38%_20%/0.5),hsl(28_34%_40%/0.18)_45%,transparent)] sm:w-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-[linear-gradient(270deg,hsl(26_38%_20%/0.5),hsl(28_34%_40%/0.18)_45%,transparent)] sm:w-10" />
          {/* 内框线，模拟装裱边 */}
          <div className="pointer-events-none absolute inset-[10px] border border-ink/15" />
          <div className="pointer-events-none absolute inset-[14px] border border-vermillion/10" />
          <div
            ref={lightRef}
            className="absolute inset-x-10 top-0 h-px origin-center bg-gradient-to-r from-transparent via-vermillion/70 to-transparent opacity-0 [will-change:transform,opacity]"
          />
          <div
            ref={maskRef}
            className="relative h-full overflow-hidden [clip-path:inset(0_50%_0_50%)] [will-change:clip-path]"
          >
            {/* <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_72%,hsl(var(--ink)/0.09),transparent_34%),radial-gradient(ellipse_at_78%_28%,hsl(var(--blueprint)/0.08),transparent_32%)]"
            />
            <div
              aria-hidden="true"
              className="absolute right-10 bottom-8 left-10 h-[30%] opacity-70 [background-image:radial-gradient(ellipse_44%_100%_at_18%_100%,hsl(var(--ink)/0.16),transparent_70%),radial-gradient(ellipse_50%_100%_at_48%_100%,hsl(var(--ink)/0.1),transparent_72%),radial-gradient(ellipse_42%_100%_at_78%_100%,hsl(var(--ink)/0.13),transparent_70%)] blur-[1px]"
            /> */}
            <div
              aria-hidden="true"
              className="absolute inset-x-10 top-8 h-12 opacity-45 [background-image:repeating-radial-gradient(ellipse_at_center,hsl(var(--blueprint)/0.18)_0_1px,transparent_1px_16px)] [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]"
            />
            {/* 缠枝印花纹样（卷云回纹） */}
            <div
              aria-hidden="true"
              className="absolute inset-x-6 bottom-3 h-8 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent_0_6px,hsl(var(--ink)/0.5)_6px_7px,transparent_7px_13px),repeating-linear-gradient(0deg,transparent_0_6px,hsl(var(--ink)/0.5)_6px_7px,transparent_7px_13px)] [mask-image:linear-gradient(90deg,transparent,black_20%,black_80%,transparent)]"
            />
            {/* 顶部缠枝回纹边饰 */}
            <div
              aria-hidden="true"
              className="absolute inset-x-6 top-2 h-6 opacity-25 [background-image:repeating-linear-gradient(45deg,transparent_0_5px,hsl(var(--ink)/0.45)_5px_6px,transparent_6px_11px),repeating-linear-gradient(-45deg,transparent_0_5px,hsl(var(--ink)/0.45)_5px_6px,transparent_6px_11px)] [mask-image:linear-gradient(90deg,transparent,black_24%,black_76%,transparent)]"
            />
            {/* 朱砂印花角饰 */}
            <div
              aria-hidden="true"
              className="absolute top-7 right-10 hidden h-10 w-10 rotate-12 rounded-full border border-vermillion/30 opacity-50 [background-image:radial-gradient(circle,hsl(var(--vermillion)/0.5)_0_1.5px,transparent_2px)] [background-size:7px_7px] sm:block"
            />
            {/* 团花印花角饰（左下） */}
            <div
              aria-hidden="true"
              className="absolute bottom-10 left-9 hidden h-12 w-12 rotate-6 opacity-40 [background-image:conic-gradient(from_0deg,hsl(var(--vermillion)/0.4)_0_30deg,transparent_30deg_60deg,hsl(var(--vermillion)/0.4)_60deg_90deg,transparent_90deg_120deg,hsl(var(--vermillion)/0.4)_120deg_150deg,transparent_150deg_180deg,hsl(var(--vermillion)/0.4)_180deg_210deg,transparent_210deg_240deg,hsl(var(--vermillion)/0.4)_240deg_270deg,transparent_270deg_300deg,hsl(var(--vermillion)/0.4)_300deg_330deg,transparent_330deg)] [mask-image:radial-gradient(circle,black_38%,transparent_42%,black_46%,transparent_60%)] sm:block"
            />
            {/* 竖排草书题名 */}
            <div
              aria-hidden="true"
              className="font-cursive absolute top-8 left-8 hidden text-6xl leading-none text-ink/[0.07] [writing-mode:vertical-rl] sm:block"
            >
              春秋
              <br />
              秦汉
            </div>
            {/* 竖排草书题诗 · 临江仙 */}
            <div
              aria-hidden="true"
              className="font-cursive absolute top-10 right-7 hidden text-2xl leading-[1.6] text-ink/30 [writing-mode:vertical-rl] sm:block"
            >
              青山依旧在
              <br />
              几度夕阳红
            </div>
            {/* 竖排草书题诗 · 怀古 */}
            <div
              aria-hidden="true"
              className="font-cursive absolute top-1/2 left-6 hidden -translate-y-1/2 text-xl leading-[1.6] text-ink/25 [writing-mode:vertical-rl] lg:block"
            >
              古今多少事
              <br />
              都付笑谈中
            </div>
            {/* 竖排草书题诗 · 兴亡 */}
            <div
              aria-hidden="true"
              className="font-cursive absolute right-6 bottom-24 hidden text-xl leading-[1.6] text-ink/25 [writing-mode:vertical-rl] lg:block"
            >
              兴亡谁人定
              <br />
              盛衰岂无凭
            </div>
            {/* 朱砂闲章 · 史海钩沉 */}
            <div
              aria-hidden="true"
              className="font-brush absolute right-8 bottom-8 hidden h-14 w-14 rotate-6 items-center justify-center rounded-[3px] border-2 border-vermillion/45 bg-vermillion/5 text-vermillion/65 text-base leading-tight sm:flex"
            >
              <span className="grid grid-cols-2 gap-x-0.5 text-center">
                <span>史</span>
                <span>海</span>
                <span>钩</span>
                <span>沉</span>
              </span>
            </div>
            {/* 朱砂闲章 · 鉴往知来 */}
            <div
              aria-hidden="true"
              className="font-brush absolute top-8 left-1/2 hidden h-12 w-12 -translate-x-1/2 -rotate-3 items-center justify-center rounded-[3px] border border-vermillion/40 bg-vermillion/5 text-vermillion/60 text-sm leading-tight lg:flex"
            >
              <span className="grid grid-cols-2 gap-x-0.5 text-center">
                <span>鉴</span>
                <span>往</span>
                <span>知</span>
                <span>来</span>
              </span>
            </div>
            <div
              ref={contentRef}
              className={cn(
                "relative z-10 mx-auto flex h-full max-w-4xl flex-col justify-center gap-7 px-8 py-14 opacity-0 [will-change:transform,opacity,filter] sm:px-14 lg:px-16",
                contentClassName,
              )}
            >
              {children}
            </div>
          </div>
        </div>

        {/* 左卷轴：紫檀木轴杆 + 铜箍 + 玉质轴头，内缘压住画芯边缘 */}
        <div
          ref={leftRollRef}
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-0 z-10 w-12 rounded-full bg-[linear-gradient(90deg,hsl(22_44%_10%)_0%,hsl(28_40%_24%)_16%,hsl(34_44%_52%)_42%,hsl(42_56%_80%)_50%,hsl(32_40%_30%)_70%,hsl(24_44%_14%)_88%,hsl(20_46%_8%)_100%)] shadow-[5px_0_20px_hsl(var(--ink)/0.34)] [will-change:transform] sm:w-14"
        >
          {/* 木纹竖向高光 */}
          <span className="absolute inset-y-2 left-[40%] w-px bg-[linear-gradient(180deg,transparent,hsl(46_60%_88%/0.55),transparent)]" />
          <span className="absolute inset-y-3 right-[28%] w-px bg-[linear-gradient(180deg,transparent,hsl(22_40%_18%/0.5),transparent)]" />
          {/* 上铜箍 */}
          <span className="absolute top-2.5 left-1/2 h-2 w-[116%] -translate-x-1/2 rounded-[50%] bg-[linear-gradient(90deg,hsl(36_50%_30%),hsl(46_72%_70%),hsl(34_48%_28%))] shadow-[0_1px_3px_hsl(var(--ink)/0.5)]" />
          <span className="absolute bottom-2.5 left-1/2 h-2 w-[116%] -translate-x-1/2 rounded-[50%] bg-[linear-gradient(90deg,hsl(36_50%_30%),hsl(46_72%_70%),hsl(34_48%_28%))] shadow-[0_1px_3px_hsl(var(--ink)/0.5)]" />
          {/* 上玉质轴头 */}
          <span className="absolute -top-4 left-1/2 h-6 w-[164%] -translate-x-1/2 rounded-[50%] border border-ink/40 bg-[radial-gradient(ellipse_at_46%_30%,hsl(150_24%_82%),hsl(160_22%_56%)_58%,hsl(165_28%_34%))] shadow-[0_3px_8px_hsl(var(--ink)/0.45)]">
            <span className="absolute top-1 left-1/2 h-1.5 w-1/2 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,hsl(150_30%_94%/0.85),transparent)]" />
          </span>
          {/* 下玉质轴头 */}
          <span className="absolute -bottom-4 left-1/2 h-6 w-[164%] -translate-x-1/2 rounded-[50%] border border-ink/40 bg-[radial-gradient(ellipse_at_46%_70%,hsl(150_24%_82%),hsl(160_22%_56%)_58%,hsl(165_28%_34%))] shadow-[0_-3px_8px_hsl(var(--ink)/0.45)]">
            <span className="absolute bottom-1 left-1/2 h-1.5 w-1/2 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,hsl(150_30%_94%/0.8),transparent)]" />
          </span>
        </div>

        {/* 右卷轴 */}
        <div
          ref={rightRollRef}
          aria-hidden="true"
          className="absolute top-3 right-0 bottom-3 z-10 w-12 rounded-full bg-[linear-gradient(90deg,hsl(20_46%_8%)_0%,hsl(24_44%_14%)_12%,hsl(32_40%_30%)_30%,hsl(42_56%_80%)_50%,hsl(34_44%_52%)_58%,hsl(28_40%_24%)_84%,hsl(22_44%_10%)_100%)] shadow-[-5px_0_20px_hsl(var(--ink)/0.34)] [will-change:transform] sm:w-14"
        >
          {/* 木纹竖向高光 */}
          <span className="absolute inset-y-2 right-[40%] w-px bg-[linear-gradient(180deg,transparent,hsl(46_60%_88%/0.55),transparent)]" />
          <span className="absolute inset-y-3 left-[28%] w-px bg-[linear-gradient(180deg,transparent,hsl(22_40%_18%/0.5),transparent)]" />
          {/* 上铜箍 */}
          <span className="absolute top-2.5 left-1/2 h-2 w-[116%] -translate-x-1/2 rounded-[50%] bg-[linear-gradient(90deg,hsl(34_48%_28%),hsl(46_72%_70%),hsl(36_50%_30%))] shadow-[0_1px_3px_hsl(var(--ink)/0.5)]" />
          <span className="absolute bottom-2.5 left-1/2 h-2 w-[116%] -translate-x-1/2 rounded-[50%] bg-[linear-gradient(90deg,hsl(34_48%_28%),hsl(46_72%_70%),hsl(36_50%_30%))] shadow-[0_1px_3px_hsl(var(--ink)/0.5)]" />
          {/* 上玉质轴头 */}
          <span className="absolute -top-4 left-1/2 h-6 w-[164%] -translate-x-1/2 rounded-[50%] border border-ink/40 bg-[radial-gradient(ellipse_at_54%_30%,hsl(150_24%_82%),hsl(160_22%_56%)_58%,hsl(165_28%_34%))] shadow-[0_3px_8px_hsl(var(--ink)/0.45)]">
            <span className="absolute top-1 left-1/2 h-1.5 w-1/2 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,hsl(150_30%_94%/0.85),transparent)]" />
          </span>
          {/* 下玉质轴头 */}
          <span className="absolute -bottom-4 left-1/2 h-6 w-[164%] -translate-x-1/2 rounded-[50%] border border-ink/40 bg-[radial-gradient(ellipse_at_54%_70%,hsl(150_24%_82%),hsl(160_22%_56%)_58%,hsl(165_28%_34%))] shadow-[0_-3px_8px_hsl(var(--ink)/0.45)]">
            <span className="absolute bottom-1 left-1/2 h-1.5 w-1/2 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,hsl(150_30%_94%/0.8),transparent)]" />
          </span>
        </div>
      </div>
    </section>
  );
}
