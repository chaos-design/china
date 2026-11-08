import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AtlasFocus } from "./atlas-focus";
import { ATLAS_VIEW } from "./atlas-items";

/**
 * 地图视野的交互层：目标视野（AtlasFocus）之外的滚轮缩放、拖拽平移、双指捏合
 * 与「目标变化 → viewBox 平滑过渡」的补间都在这里。
 *
 * 核心约定：
 * - 目标视野变化时，当前视野用 rAF 补间滑过去（ease-in-out），不再瞬间跳变；
 * - 滚轮 / 拖拽是即时操作：直接改当前视野，不经过补间，跟手才有丝滑感；
 * - 手势期间缩放保持当前 viewBox 自身的宽高比不变，避免 meet 留白边来回翻转。
 */

/** 手动缩放的上限（相对全览视野高度）。 */
export const MAP_ZOOM_MAX = 5;

/** 视野补间时长（毫秒）。测试可置 0，让目标视野同步生效、断言终态。 */
export let VIEW_TWEEN_MS = 620;

export function setViewTweenMs(ms: number): void {
  VIEW_TWEEN_MS = ms;
}

const round = (value: number) => Math.round(value * 100) / 100;

export function easeInOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** 由左上角与宽高构造视野；zoom 相对全览视野高度，focused 跟随 zoom。 */
export function makeView(x: number, y: number, width: number, height: number): AtlasFocus {
  const zoom = ATLAS_VIEW.height / height;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return {
    box: `${round(x)} ${round(y)} ${round(width)} ${round(height)}`,
    cx: round(cx),
    cy: round(cy),
    focused: zoom > 1.02,
    height,
    width,
    x,
    y,
    zoom,
  };
}

export function interpolateView(from: AtlasFocus, to: AtlasFocus, t: number): AtlasFocus {
  return makeView(
    lerp(from.x, to.x, t),
    lerp(from.y, to.y, t),
    lerp(from.width, to.width, t),
    lerp(from.height, to.height, t),
  );
}

/** 手势允许的越界余量：随剩余可活动空间等比收缩，缩回全览时严格对齐全览视野。 */
const PAN_SLACK = 0.25;

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): {
  x: number;
  y: number;
} {
  // 全览视野的宽随容器比例变化，这里以当前视野自身比例还原「当前比例下的全览宽」。
  const fullWidth = ATLAS_VIEW.height * (width / height);
  const marginX = (PAN_SLACK * Math.max(0, fullWidth - width)) / 2;
  const marginY = (PAN_SLACK * Math.max(0, ATLAS_VIEW.height - height)) / 2;
  const centerX = Math.min(
    Math.max(x + width / 2, ATLAS_VIEW.x - marginX + width / 2),
    ATLAS_VIEW.x + fullWidth - width / 2 + marginX,
  );
  const centerY = Math.min(
    Math.max(y + height / 2, ATLAS_VIEW.y - marginY + height / 2),
    ATLAS_VIEW.y + ATLAS_VIEW.height - height / 2 + marginY,
  );
  return { x: centerX - width / 2, y: centerY - height / 2 };
}

/**
 * 以 (fx, fy)（viewBox 内 0..1 锚点比例）为支点缩放：锚点对应的用户坐标不动。
 * 高度先按 factor 缩放并夹在 [全览/MAP_ZOOM_MAX, 全览]，宽度跟随当前宽高比。
 */
export function zoomedView(base: AtlasFocus, factor: number, fx: number, fy: number): AtlasFocus {
  const minHeight = ATLAS_VIEW.height / MAP_ZOOM_MAX;
  const height = Math.min(Math.max(base.height / factor, minHeight), ATLAS_VIEW.height);
  const width = height * (base.width / base.height);
  const anchorX = base.x + fx * base.width;
  const anchorY = base.y + fy * base.height;
  const { x, y } = clampPosition(anchorX - fx * width, anchorY - fy * height, width, height);
  return makeView(x, y, width, height);
}

/** 平移：位移以「当前视野宽度」为单位（屏幕位移 / 屏幕上的视野像素宽）。 */
export function pannedView(base: AtlasFocus, dxRatio: number, dyRatio: number): AtlasFocus {
  const { x, y } = clampPosition(
    base.x + dxRatio * base.width,
    base.y + dyRatio * base.height,
    base.width,
    base.height,
  );
  return makeView(x, y, base.width, base.height);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 地图视野状态机：测量容器比例、跟踪目标视野、补间过渡，并提供
 * 滚轮 / 拖拽 / 双指的手势处理。返回的 interactionProps 直接铺在地图容器上。
 *
 * 目标视野由 computeTarget(ratio) 计算——聚焦视野的宽高比依赖本 hook 实测的
 * 容器比例，所以把比例作为入参回调出去，避免「先有 target 才能测量」的死结。
 */
export function useMapView(computeTarget: (ratio: number) => AtlasFocus) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState(ATLAS_VIEW.width / ATLAS_VIEW.height);
  const target = useMemo(() => computeTarget(ratio), [computeTarget, ratio]);
  const [view, setView] = useState<AtlasFocus>(target);
  const [panning, setPanning] = useState(false);

  const viewRef = useRef(view);
  const targetRef = useRef(target);
  const overviewRef = useRef<AtlasFocus>(target);
  const tweenRef = useRef(0);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const prevPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef({ lastX: 0, lastY: 0, moved: false });

  const applyView = useCallback((next: AtlasFocus) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const cancelTween = useCallback(() => {
    if (tweenRef.current) {
      cancelAnimationFrame(tweenRef.current);
      tweenRef.current = 0;
    }
  }, []);

  const startTween = useCallback(
    (to: AtlasFocus) => {
      cancelTween();
      const from = viewRef.current;
      if (from.box === to.box) return;
      if (VIEW_TWEEN_MS <= 0 || prefersReducedMotion()) {
        applyView(to);
        return;
      }
      let start: number | null = null;
      const step = (now: number) => {
        if (start === null) start = now;
        const progress = Math.min(1, (now - start) / VIEW_TWEEN_MS);
        applyView(interpolateView(from, to, easeInOutCubic(progress)));
        tweenRef.current = progress < 1 ? requestAnimationFrame(step) : 0;
      };
      tweenRef.current = requestAnimationFrame(step);
    },
    [applyView, cancelTween],
  );

  // 目标视野变化（选择条目 / 切朝代 / 容器比例变化）→ 从当前帧平滑滑过去。
  useEffect(() => {
    if (!target.focused) overviewRef.current = target;
    const previous = targetRef.current;
    targetRef.current = target;
    if (previous.box === target.box) return;
    startTween(target);
  }, [startTween, target]);

  useEffect(() => cancelTween, [cancelTween]);

  // 容器实测宽高比：聚焦视野按它生成，放大后正好铺满可视区（jsdom 退回全览比例）。
  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const { height, width } = node.getBoundingClientRect();
      if (width > 0 && height > 0) setRatio(width / height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const screenToFraction = useCallback(
    (clientX: number, clientY: number, base: AtlasFocus): { fx: number; fy: number } | null => {
      const node = frameRef.current;
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      // preserveAspectRatio="xMidYMid meet" 的实际贴片区域与留白。
      const scale = Math.min(rect.width / base.width, rect.height / base.height);
      const offsetX = (rect.width - base.width * scale) / 2;
      const offsetY = (rect.height - base.height * scale) / 2;
      return {
        fx: Math.min(1, Math.max(0, (clientX - rect.left - offsetX) / (base.width * scale))),
        fy: Math.min(1, Math.max(0, (clientY - rect.top - offsetY) / (base.height * scale))),
      };
    },
    [],
  );

  const userPerPixel = useCallback((base: AtlasFocus): number | null => {
    const node = frameRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scale = Math.min(rect.width / base.width, rect.height / base.height);
    return 1 / scale;
  }, []);

  // 滚轮 / 触控板捏合：React 的 wheel 监听是 passive 的，必须手动挂非 passive 监听。
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const base = viewRef.current;
      const anchor = screenToFraction(event.clientX, event.clientY, base);
      if (!anchor) return;
      const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
      cancelTween();
      applyView(zoomedView(base, Math.exp(-delta * 0.0022), anchor.fx, anchor.fy));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [applyView, cancelTween, screenToFraction]);

  const zoomStep = useCallback(
    (factor: number) => {
      cancelTween();
      startTween(zoomedView(viewRef.current, factor, 0.5, 0.5));
    },
    [cancelTween, startTween],
  );

  const resetView = useCallback(() => {
    startTween(targetRef.current);
  }, [startTween]);

  const interactionProps = {
    onDoubleClick: (event: React.MouseEvent) => {
      const element = event.target as Element | null;
      if (element?.closest('button, [role="button"]')) return;
      const anchor = screenToFraction(event.clientX, event.clientY, viewRef.current);
      if (!anchor) return;
      zoomStep(1.7);
    },
    onPointerCancel: (event: React.PointerEvent) => {
      pointersRef.current.delete(event.pointerId);
      prevPointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size === 0) setPanning(false);
    },
    onPointerDown: (event: React.PointerEvent) => {
      const element = event.target as Element | null;
      // 按钮上的按下交给按钮；地图空白处才开始手势。
      if (element?.closest("button")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      cancelTween();
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      prevPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragRef.current = { lastX: event.clientX, lastY: event.clientY, moved: false };
    },
    onPointerMove: (event: React.PointerEvent) => {
      const pointers = pointersRef.current;
      if (!pointers.has(event.pointerId)) return;
      const base = viewRef.current;
      const pixel = userPerPixel(base);
      if (!pixel) return;

      // 双指捏合：以两指中点为支点缩放，再叠加中点位移的平移。
      if (pointers.size >= 2) {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const entries = [...pointers.entries()].slice(0, 2);
        const previous = entries.map(([id]) => prevPointersRef.current.get(id));
        if (previous.every(Boolean)) {
          const [first, second] = entries.map(([, point]) => point);
          const [oldFirst, oldSecond] = previous as { x: number; y: number }[];
          const oldDistance = Math.hypot(oldFirst.x - oldSecond.x, oldFirst.y - oldSecond.y);
          const newDistance = Math.hypot(first.x - second.x, first.y - second.y);
          const anchor = screenToFraction((first.x + second.x) / 2, (first.y + second.y) / 2, base);
          if (anchor && oldDistance > 8 && newDistance > 8) {
            let next = zoomedView(base, newDistance / oldDistance, anchor.fx, anchor.fy);
            const pixelNow = userPerPixel(next);
            if (pixelNow) {
              // 中点位移换算成用户单位后，按 next 的视野尺寸换算成位移比例。
              const midX = ((first.x + second.x) / 2 - (oldFirst.x + oldSecond.x) / 2) * pixelNow;
              const midY = ((first.y + second.y) / 2 - (oldFirst.y + oldSecond.y) / 2) * pixelNow;
              next = pannedView(next, -midX / next.width, -midY / next.height);
            }
            applyView(next);
          }
        }
        // 快照同步到本帧：捏合结束转单指拖拽时，lastX/lastY 不至于跳变。
        prevPointersRef.current = new Map(pointers);
        dragRef.current.lastX = event.clientX;
        dragRef.current.lastY = event.clientY;
        dragRef.current.moved = true;
        setPanning(true);
        return;
      }

      const dx = event.clientX - dragRef.current.lastX;
      const dy = event.clientY - dragRef.current.lastY;
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      if (!dragRef.current.moved) {
        if (Math.hypot(dx, dy) < 4) return;
        dragRef.current.moved = true;
        setPanning(true);
        // 拖拽确认后才捕获指针：点击按钮 / 标注的 click 事件不受捕获影响。
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      }
      // 拖向下 → 内容跟手向下 → 视野上移（y 减小）。
      applyView(pannedView(base, (-dx * pixel) / base.width, (-dy * pixel) / base.height));
      prevPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    },
    onPointerUp: (event: React.PointerEvent) => {
      pointersRef.current.delete(event.pointerId);
      prevPointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size === 0) setPanning(false);
    },
  };

  return { frameRef, interactionProps, panning, ratio, resetView, target, view, zoomStep };
}
