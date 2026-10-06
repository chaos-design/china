import { Compass } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "../../lib/utils";
import { HandDrawnMap } from "./hand-drawn-map";
import { NAV_GROUPS, type NavGroup } from "./nav-groups";

const MENU_PANEL_ID = "site-mega-menu";
/** 鼠标离开触发器/面板后，宽限这么多毫秒才收起，穿过缝隙不会把菜单关掉。 */
const CLOSE_GRACE_MS = 140;
/** 悬停经过触发器时略等片刻再展开，扫过顶栏不会一路闪面板。 */
const OPEN_DELAY_MS = 60;

/**
 * 顶栏巨型下拉菜单（参考站外导航的多栏下拉交互）：
 * 触发器悬停即展开，点击切换，移出面板/触发器一段宽限后收起，Escape 关闭。
 *
 * 与旧版全屏面板的差别是有意的：
 * - 下拉是「披露控件」（disclosure pattern）而不是模态框——它不接管页面，
 *   因此不需要焦点陷阱、backdrop 和 inert；焦点可以自由进出面板，
 *   焦点离开触发器与面板时自动收起，键盘用户和鼠标用户走同一套关闭逻辑。
 * - 面板常驻在顶栏 DOM 里（内容按 open 条件挂载），定位锚在导航栏下方，
 *   宽度与导航内容区对齐，三列分类并排，右侧留一条手绘地图带。
 * - 手绘地图仍在：它跟着「悬停/当前路由的分区」高亮，是面板的识别性装饰，
 *   窄屏（<xl）整体隐藏，不参与布局。
 * - 鼠标与焦点处理都挂在 wrapperRef 的原生监听上而不是 JSX 属性：
 *   包裹层和列都是纯静态元素，Biome（以及 ARIA 本身）不允许给静态元素
 *   挂交互处理器；委托还能让列的 hover 高亮只写一处。
 */
export function SiteMenu({ activeRouteGroupId }: { activeRouteGroupId: string | undefined }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [hoverGroupId, setHoverGroupId] = useState<string | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);

  // 当前路由所属分组，决定默认高亮列与地图分区
  const activeGroup = useMemo(
    () => NAV_GROUPS.find((group) => group.id === activeRouteGroupId) ?? NAV_GROUPS[0],
    [activeRouteGroupId],
  );
  const focusGroupId = hoverGroupId ?? activeGroup.id;
  const focusGroup = NAV_GROUPS.find((group) => group.id === focusGroupId) ?? NAV_GROUPS[0];

  const cancelTimers = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(() => {
    cancelTimers();
    openTimerRef.current = window.setTimeout(() => {
      setOpen(true);
      openTimerRef.current = null;
    }, OPEN_DELAY_MS);
  }, [cancelTimers]);

  const scheduleClose = useCallback(() => {
    cancelTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_GRACE_MS);
  }, [cancelTimers]);

  // 路由变化即收起：跳转后面板仍开着会挡住新页面。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 重置 effect 故意只依赖路由 pathname，体内不需要读它
  useEffect(() => {
    setOpen(false);
    setHoverGroupId(undefined);
  }, [location.pathname]);

  // document 级兜底：Escape、面板外按下、焦点离开（披露模式没有焦点陷阱，靠这些关闭）
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      if (event.target instanceof Node && wrapper.contains(event.target)) return;
      setOpen(false);
    }
    function onFocusOut(event: FocusEvent) {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const next = event.relatedTarget;
      if (next instanceof Node && wrapper.contains(next)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  // wrapper 上的鼠标/焦点处理。mouseenter/mouseleave 不冒泡，直接挂在
  // 包裹元素上正好覆盖「触发器 + 面板」整体；mouseover 委托负责列高亮。
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // 用 const 箭头函数而不是 function 声明：函数声明会提升到 null 守卫之前，
    // TS 无法在闭包里保留 wrapper 的非空收窄
    const onWrapperOver = (event: MouseEvent) => {
      const column = (event.target instanceof Element ? event.target : null)?.closest(
        "[data-menu-group]",
      );
      if (column) setHoverGroupId(column.getAttribute("data-menu-group") ?? undefined);
    };
    const onWrapperFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && wrapper.contains(next)) return;
      setOpen(false);
    };

    wrapper.addEventListener("mouseenter", cancelTimers);
    wrapper.addEventListener("mouseleave", scheduleClose);
    wrapper.addEventListener("mouseover", onWrapperOver);
    wrapper.addEventListener("focusout", onWrapperFocusOut);
    return () => {
      wrapper.removeEventListener("mouseenter", cancelTimers);
      wrapper.removeEventListener("mouseleave", scheduleClose);
      wrapper.removeEventListener("mouseover", onWrapperOver);
      wrapper.removeEventListener("focusout", onWrapperFocusOut);
    };
  }, [cancelTimers, scheduleClose]);

  // 卸载时清掉挂起的定时器，避免 StrictMode 双挂载后残留一个迟到的 setOpen
  useEffect(() => cancelTimers, [cancelTimers]);

  function renderColumn(group: NavGroup): ReactNode {
    const isFocus = group.id === focusGroup.id;
    return (
      <div
        className={cn(
          "mega-col relative flex flex-col gap-1.5 px-5 py-5 sm:px-6",
          // 分隔线只在列与列之间，末列不画
          group.id !== NAV_GROUPS[NAV_GROUPS.length - 1].id && "lg:border-ink/10 lg:border-r",
        )}
        data-menu-group={group.id}
        key={group.id}
      >
        <div className="flex items-baseline justify-between gap-3 pb-2">
          <span className="font-kai text-base text-ink">{group.label}</span>
          <span className="font-mono-tech text-[10px] text-muted-foreground uppercase">
            {String(group.items.length).padStart(2, "0")}
          </span>
        </div>
        <ul className="flex flex-col">
          {group.items.map((item) => (
            <li key={item.to}>
              <NavLink
                className={cn(
                  "mega-link -mx-2 flex flex-col gap-0.5 rounded-md px-2 py-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
                onClick={() => setOpen(false)}
                to={item.to}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-kai text-[15px] text-ink">{item.label}</span>
                  <span className="font-mono-tech text-[10px] text-muted-foreground">
                    {item.to}
                  </span>
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
        {/* 当前分组淡染一层底色，扫过列时随 hover 走（纯装饰） */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 transition-opacity duration-200",
            isFocus ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--vermillion) / 0.05), hsl(var(--vermillion) / 0.015) 55%, transparent)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-controls={MENU_PANEL_ID}
        aria-expanded={open}
        aria-haspopup="true"
        className="btn-ink inline-flex items-center gap-2 rounded-full bg-paper/90 px-4 py-1.5 font-kai text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        onClick={() => setOpen((value) => !value)}
        onFocus={scheduleOpen}
        onMouseEnter={scheduleOpen}
        ref={triggerRef}
        type="button"
      >
        <Compass aria-hidden="true" className="h-4 w-4 text-primary" />
        全览地图
      </button>

      {open ? (
        <section
          aria-label="全览目录"
          className={cn(
            "mega-panel absolute right-0 top-full z-40 mt-3 w-[min(56rem,calc(100vw-3rem))]",
            "rounded-2xl border border-ink/12 bg-paper/97 backdrop-blur-xl",
          )}
          id={MENU_PANEL_ID}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_13rem]">
            {NAV_GROUPS.map((group) => renderColumn(group))}

            {/* 右缘地图带：装饰性识别区，随悬停/当前路由切换分区高亮。
                窄屏没有空间，整条隐藏（<lg）；不接受指针事件，免得挡住面板边缘。 */}
            <div
              aria-hidden="true"
              className="mega-map pointer-events-none relative hidden overflow-hidden lg:block"
            >
              <div className="absolute inset-y-0 right-0 flex w-full items-center justify-center px-3">
                <HandDrawnMap activeZone={focusGroup.mapZone} />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
