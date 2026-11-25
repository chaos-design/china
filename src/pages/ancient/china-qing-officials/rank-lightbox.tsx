import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import type { RankImage } from "./rank-images";

/**
 * 品级礼制图片放大层：各谱条里的真实藏品照（顶戴 / 朝服 / 补子）双击后
 * 浮出一个居中 lightbox，展示大图、藏品短注与 Commons 出处链接。
 *
 * 采用 Context + Provider 而非每张图各自挂浮层：图片散布在顶戴全谱、朝服全谱、
 * 补子网格与本级档案卡多处，统一由页面层一个 Provider 收纳，只渲染一个浮层。
 * 未包裹 Provider 时（如孤立使用）`useRankLightbox` 返回 noop，双击不崩。
 *
 * 关闭走 document 级监听（外部 pointerdown + Escape，与读图气泡同口径）：
 * 不把点击挂到静态元素上，避免 a11y 规则告警；内容区用 ref 判定是否点在外面。
 */
const RankLightboxContext = createContext<(image: RankImage) => void>(() => {});

/** 取放大入口；Provider 缺失时为无害空函数。 */
export function useRankLightbox() {
  return useContext(RankLightboxContext);
}

export function RankLightboxProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<RankImage | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const open = useCallback((image: RankImage) => setActive(image), []);

  useEffect(() => {
    if (!active) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      // 点内容区内部不关；点遮罩空白处（外部）关闭。
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setActive(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActive(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <RankLightboxContext.Provider value={open}>
      {children}
      {active
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/85 p-6 backdrop-blur-sm">
              <div
                aria-label={active.caption}
                ref={contentRef}
                className="flex max-w-2xl flex-col items-center gap-4"
                role="dialog"
              >
                <img
                  alt={active.caption}
                  className="max-h-[72vh] max-w-[90vw] rounded-lg border border-paper/20 bg-paper object-contain shadow-[0_24px_64px_hsl(var(--ink)/0.5)]"
                  decoding="async"
                  fetchPriority="high"
                  src={active.src}
                />
                <div className="flex flex-col items-center gap-2">
                  <p className="text-center text-sm leading-relaxed text-paper">{active.caption}</p>
                  <a
                    className="text-xs text-paper/70 underline decoration-dotted underline-offset-2 transition-colors hover:text-paper"
                    href={active.source}
                    rel="noreferrer"
                    target="_blank"
                  >
                    图源 · Wikimedia Commons
                  </a>
                  <button
                    className="rounded-full border border-paper/40 px-4 py-1 font-body text-xs text-paper transition-colors hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                    onClick={() => setActive(null)}
                    type="button"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </RankLightboxContext.Provider>
  );
}
