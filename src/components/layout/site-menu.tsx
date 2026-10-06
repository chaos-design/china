import { ArrowRight, Compass, X } from "lucide-react";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";
import { HandDrawnMap } from "./hand-drawn-map";
import { NAV_GROUPS, type NavGroup } from "./nav-groups";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), summary, input, select, textarea';

interface SiteMenuProps {
  /** 当前路由所属的分组；不在任何分组内时回落到第一个，保证面板永远有内容。 */
  activeRouteGroupId: string | undefined;
  onClose: () => void;
  /** 打开面板的按钮。关闭时焦点必须回到它，见下面 effect 里的说明。 */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

function tabIdFor(group: NavGroup) {
  return `site-menu-tab-${group.id}`;
}

function panelIdFor(group: NavGroup) {
  return `site-menu-panel-${group.id}`;
}

/**
 * 全屏菜单面板。左手是分类，右手是该分类的完整内容，地图是左手那栏的底纹。
 *
 * 为什么面板由 RootLayout 条件挂载而不是常驻：
 * 常驻意味着滤镜、地图路径、几十个节点一直挂在 DOM 上，遮罩的 aria 语义也要靠
 * inert 之类的手段才能对屏幕阅读器隐藏。条件挂载让"打开才存在"变成事实而不是约定，
 * 代价只是没有退出动画——用 CSS 入场动画补偿更划算。
 */
export function SiteMenu({ activeRouteGroupId, onClose, triggerRef }: SiteMenuProps) {
  const initialGroupId = NAV_GROUPS.some((group) => group.id === activeRouteGroupId)
    ? (activeRouteGroupId as string)
    : NAV_GROUPS[0].id;

  const [activeGroupId, setActiveGroupId] = useState(initialGroupId);
  const activeGroup = useMemo(
    () => NAV_GROUPS.find((group) => group.id === activeGroupId) ?? NAV_GROUPS[0],
    [activeGroupId],
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const focusTab = useCallback((groupId: string) => {
    setActiveGroupId(groupId);
    // 等 tabpanel 换完再挪焦点，否则 arrow 键连按会打在旧面板的元素上。
    window.requestAnimationFrame(() => tabRefs.current.get(groupId)?.focus());
  }, []);

  // Esc 关闭 + Tab 焦点循环 + 关闭后把焦点还给触发按钮。
  // 这三件事必须挂在同一个 effect 里：拆开就会出现"焦点跑了但没关"或"关了但焦点丢了"。
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      // 不用 offsetParent 过滤可见性：面板整体是 position: fixed，
      // offsetParent 恒为 null，这个判断会把所有元素都滤掉，循环焦点直接失效。
      // 面板是条件挂载的，里面没有折叠或 display:none 的分支，选择器过滤已经够了。
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // 焦点回到触发按钮，而不是记住打开时的 activeElement：
      // Firefox 在 macOS 上点击 button 不会给它焦点，那样记下来的 activeElement
      // 是 body，关闭后键盘用户就丢了落脚点。
      triggerRef.current?.focus();
    };
  }, [onClose, triggerRef]);

  function handleTabKeyDown(event: React.KeyboardEvent) {
    const index = NAV_GROUPS.findIndex((group) => group.id === activeGroupId);
    if (index < 0) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % NAV_GROUPS.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + NAV_GROUPS.length) % NAV_GROUPS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = NAV_GROUPS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    focusTab(NAV_GROUPS[nextIndex].id);
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩做成 button 而不是 div：Esc 与关闭按钮是键盘路径，
          这里只需要一个可点的"关掉"目标，button 自带 Enter/Space 语义。 */}
      <button
        aria-label="关闭全览目录"
        className="site-menu-backdrop absolute inset-0 h-full w-full cursor-default bg-ink/45 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div
        aria-label="全览目录"
        aria-modal="true"
        className="site-menu relative flex h-full w-full flex-col"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {/* 地图铺满整个面板，作为底纹。
            放在面板根部而不是左栏内部是有原因的：中国是横长的（viewBox 1000×720），
            左栏是竖窄的（~336×700）。SVG 用 preserveAspectRatio="meet" 时按宽度贴合，
            塞进左栏只有 336×242，上下会空出四百多像素。铺满面板则能按高度贴合，
            得到一张接近满屏的大图。
            地图压在左手栏那一侧（inset 负值收到左半边），右半边完全留给文字。 */}
        <div className="site-menu-map pointer-events-none">
          <HandDrawnMap activeZone={activeGroup.mapZone} />
        </div>

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-ink/10 border-b bg-paper/78 px-5 py-3 backdrop-blur-xl sm:px-8">
          <div className="flex items-baseline gap-3">
            <Compass aria-hidden="true" className="h-4 w-4 self-center text-primary" />
            <h2 className="font-kai text-lg text-ink">全览目录</h2>
            <span className="hidden font-mono-tech text-[10px] tracking-[0.25em] text-muted-foreground uppercase sm:inline">
              atlas index
            </span>
          </div>
          <button
            aria-label="关闭全览目录"
            className="btn-ink grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-ink"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="site-menu-split relative z-10 grid min-h-0 flex-1 lg:grid-cols-[clamp(15rem,25vw,21rem)_minmax(0,1fr)]">
          {/* 左手：地图底纹上的分类列表。
              用 div 而不是 nav：tablist 不是 landmark，套在 nav 里会让
              "导航地标"和"可交互控件容器"两个角色互相干扰读屏。 */}
          <div
            aria-label="内容分类"
            aria-orientation="vertical"
            className="site-menu-rail relative flex min-h-0 flex-col overflow-hidden border-ink/10 border-r"
            onKeyDown={handleTabKeyDown}
            role="tablist"
          >
            {/* 竖向渐隐层。地图在面板根部，这里只负责把列表区域的对比度拉回来，
                并让地图看起来是从栏外延续进来的，而不是被裁在一个方框里。 */}
            {/* relative + z-10：veil 的 ::after 渐隐层是这个 div 的伪元素，
                会盖住自己的子节点。不抬起来的话，未选中的分类按钮会整片发白，
                看起来像被禁用了。 */}
            <div className="site-menu-veil relative flex-1">
              <ul className="relative z-10 flex flex-col gap-2 p-4 sm:p-5">
                {NAV_GROUPS.map((group) => {
                  const isActive = group.id === activeGroupId;
                  return (
                    <li key={group.id}>
                      <button
                        aria-controls={panelIdFor(group)}
                        aria-selected={isActive}
                        className={cn(
                          "site-menu-tab w-full rounded-sm border px-3.5 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isActive
                            ? "border-vermillion/40 bg-paper text-ink shadow-[0_10px_30px_hsl(var(--ink)/0.1)]"
                            : "border-ink/12 bg-paper/85 text-muted-foreground hover:border-ink/25 hover:text-ink",
                        )}
                        id={tabIdFor(group)}
                        onClick={() => setActiveGroupId(group.id)}
                        ref={(node) => {
                          if (node) tabRefs.current.set(group.id, node);
                          else tabRefs.current.delete(group.id);
                        }}
                        role="tab"
                        tabIndex={isActive ? 0 : -1}
                        type="button"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-kai text-base">{group.label}</span>
                          <span className="font-mono-tech text-[10px] text-muted-foreground">
                            {String(group.items.length).padStart(2, "0")}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {group.items.length} 个入口
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* 右手：当前分类的完整内容。tabIndex=0 是 WAI-ARIA APG 对可滚动 tabpanel 的要求，
              否则键盘用户进到面板里的链接后无法用方向键滚动本区域 */}
          <div
            aria-labelledby={tabIdFor(activeGroup)}
            className="site-menu-panel min-h-0 overflow-y-auto"
            id={panelIdFor(activeGroup)}
            role="tabpanel"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: 见上一行注释，APG 明确要求
            tabIndex={0}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9">
              <header className="flex flex-col gap-2.5">
                <span className="eyebrow">{activeGroup.mapZone}</span>
                <h3 className="font-kai text-2xl text-ink sm:text-3xl">{activeGroup.label}</h3>
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {activeGroup.blurb}
                </p>
              </header>

              <ul className="flex flex-col gap-4">
                {activeGroup.items.map((item) => (
                  <li key={item.to}>
                    <article className="site-menu-card group flex flex-col gap-3 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="font-kai text-xl text-ink">{item.label}</h4>
                        <code className="font-mono-tech text-[11px] text-muted-foreground">
                          {item.to}
                        </code>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {item.highlights.map((highlight) => (
                          <li
                            className="rounded-full border border-ink/15 bg-card/70 px-2.5 py-0.5 text-xs text-ink"
                            key={highlight}
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <NavLink
                        className="mt-1 inline-flex w-fit items-center gap-1.5 font-kai text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={onClose}
                        to={item.to}
                      >
                        进入
                        <ArrowRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </NavLink>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
