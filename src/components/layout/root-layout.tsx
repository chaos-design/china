import { Asterisk, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, matchPath, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAccent } from "../../hooks/use-accent";
import { cn } from "../../lib/utils";
import { HOME_ENTRY_ROUTES } from "../../pages/page-resources";
import { ROUTE_LAYOUT_CONFIGS } from "../../route-layout-config";
import { AccentPicker } from "../accent-picker";

interface NavLeaf {
  label: string;
  to: string;
  description: string;
}

interface NavGroup {
  id: string;
  items: NavLeaf[];
  label: string;
}

// 菜单分组。叶子节点按主题聚成三组，hover 展开。
// 分组是硬编码的：它表达的是编辑判断（哪些内容属于同一类），
// 放进资源元数据反而会让数据层承担分类职责。
const NAV_GROUPS: NavGroup[] = [
  {
    id: "chronology",
    items: [
      {
        description: "3D 朝代浮岛、更替节点与民族线索",
        label: "朝代时间长河",
        to: "/china/timeline",
      },
      {
        description: "按朝代查看政策、机构、人物与疆域",
        label: "朝代政策全览",
        to: "/china/policies",
      },
    ],
    label: "编年与制度",
  },
  {
    id: "culture",
    items: [
      {
        description: "二十项传统技艺的工序与故事",
        label: "中华非遗瑰宝",
        to: "/intangible-culture-heritage",
      },
      {
        description: "汉唐至明清的海陆交通与疆域线索",
        label: "丝绸之路与海疆",
        to: "/silk-road",
      },
    ],
    label: "文化与交通",
  },
  {
    id: "region",
    items: [
      {
        description: "地形结构、岛屿编年、风土人情与近代",
        label: "台湾专题",
        to: "/taiwan",
      },
    ],
    label: "地域与近代",
  },
];

// 只收录首页已经开放、且能解析出路径的条目。
// showInHome: false 与 status: "preview" 的资源不进菜单——
// 未开放的内容不应该出现在导航里，也不应该被键盘 Tab 到。
const AVAILABLE_PATHS = new Set(
  HOME_ENTRY_ROUTES.filter(
    (entry): entry is typeof entry & { path: string; status: "available" } =>
      entry.status === "available" && typeof entry.path === "string",
  ).map((entry) => entry.path),
);

const RESOURCE_NAV_LINKS: NavLeaf[] = HOME_ENTRY_ROUTES.filter(
  (entry): entry is typeof entry & { path: string; status: "available" } =>
    entry.status === "available" && typeof entry.path === "string",
).map((entry) => ({ description: entry.description, label: entry.title, to: entry.path }));

// 校验：分组里出现的路径必须真的有对应资源，否则这条菜单是死链。
for (const group of NAV_GROUPS) {
  for (const item of group.items) {
    if (item.to.startsWith("/china/")) continue;
    if (
      !AVAILABLE_PATHS.has(item.to) &&
      !RESOURCE_NAV_LINKS.some((entry) => entry.to === item.to)
    ) {
      throw new Error(`导航项 ${group.id}/${item.to} 没有对应的可用资源`);
    }
  }
}

function GithubMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-vermillion"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function getActiveGroupId(pathname: string) {
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => matchPath({ path: item.to, end: true }, pathname))) {
      return group.id;
    }
  }
  return undefined;
}

// 分组菜单。三条通路：hover 展开、点击切换、键盘可达。
//
// 为什么展开状态在 React 里而不是纯 CSS：
// - 纯 CSS :hover 在触屏上不成立，tap 会先触发 hover 再触发 click，容易粘住；
// - 纯 CSS :focus-within 展开后鼠标移开不会收起，会残留一个浮层；
// 所以 hover/click 统一落到 state，键盘路径靠原生 button 与 role="menu" 承担，
// 视觉过渡仍然交给 CSS transition。收起有 120ms 延迟，指针从按钮移到面板的路上不闪。
function GroupMenu({
  activeGroupId,
  group,
}: {
  activeGroupId: string | undefined;
  group: NavGroup;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const containsActive = activeGroupId === group.id;

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const close = useCallback(
    (immediate = false) => {
      cancelClose();
      if (immediate) {
        setOpen(false);
        return;
      }
      closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
    },
    [cancelClose],
  );

  useEffect(() => cancelClose, [cancelClose]);

  const handleMouseEnter = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const handleMouseLeave = useCallback(() => close(), [close]);

  return (
    // 容器只负责鼠标进入/离开与 Tab 离开检测。
    // hover 与 blur 对辅助技术不可见，键盘用户走下面的 button + role="menu"，
    // 所以这里不给它任何 ARIA 语义——加了反而会让人误以为这是一个可聚焦控件。
    // biome 的 noStaticElementInteractions 因此在这里关掉，理由同上。
    // biome-ignore lint/a11y/noStaticElementInteractions: 纯鼠标事件，键盘路径由按钮承担
    <div
      className="relative"
      onBlur={(event) => {
        // Tab 走出这个分组时收起，否则展开状态会残留到下一次聚焦。
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          close(true);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1 rounded-none border border-transparent bg-transparent px-3 py-1.5 font-kai text-base transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          containsActive || open ? "text-ink" : "text-muted-foreground hover:text-ink",
        )}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            cancelClose();
            setOpen(true);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        <span>{group.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <div
        className={cn(
          "absolute top-full right-0 z-30 mt-1 w-64 origin-top-right rounded-sm border border-ink/10 bg-paper/95 p-1.5 shadow-xl backdrop-blur-xl transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            close(true);
            buttonRef.current?.focus();
          }
        }}
        role="menu"
      >
        {group.items.map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                "block rounded-sm px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-vermillion/10 text-ink"
                  : "text-muted-foreground hover:bg-ink/5 hover:text-ink",
              )
            }
            end
            key={item.to}
            onClick={() => close(true)}
            role="menuitem"
            to={item.to}
          >
            <span className="block font-kai text-base text-ink">{item.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function RootLayout() {
  const location = useLocation();
  const layoutConfig = ROUTE_LAYOUT_CONFIGS.find((config) =>
    matchPath({ path: config.path, end: true }, location.pathname),
  );
  const showFooter = layoutConfig?.showFooter ?? false;
  const showThemePicker = layoutConfig?.showThemePicker ?? false;
  const accentState = useAccent();
  // 直接派生，不需要 state：路由变了就重算，避免多一次渲染与一处可能过期的副本。
  const activeGroupId = getActiveGroupId(location.pathname);

  return (
    <div className="paper-backdrop flex h-screen overflow-hidden flex-col font-body text-foreground">
      <header className="sticky top-0 z-20 shrink-0 border-ink/8 border-b bg-paper/55 shadow-[0_8px_28px_hsl(var(--ink)/0.06)] backdrop-blur-xl backdrop-saturate-150">
        <nav className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-4 font-kai sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="group flex items-baseline gap-2 rounded-none bg-transparent outline-none transition-colors hover:bg-transparent focus-visible:ring-0"
          >
            <Asterisk className="h-5 w-5 self-center text-primary transition-transform duration-300 group-hover:rotate-90 group-hover:bg-transparent" />
            <span className="text-2xl font-black tracking-tight text-ink">中国古代全览</span>
            {/* <span className="font-mono-tech text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              /atlas
            </span> */}
          </Link>

          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-full px-2 py-1">
            {NAV_GROUPS.map((group) => (
              <GroupMenu activeGroupId={activeGroupId} group={group} key={group.id} />
            ))}
          </div>
        </nav>
      </header>

      <main className="relative z-10 min-h-0 w-full flex-1 overflow-y-auto p-0">
        <Outlet />

        {showFooter ? (
          <footer className="relative z-10 bg-paper/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-2 px-6 py-6 font-mono-tech text-muted-foreground text-xs sm:flex-row sm:items-center">
              <span>© {new Date().getFullYear()} 中国古代全览</span>
              <a
                href="https://github.com/chaos-design/china"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-ink transition-colors hover:text-primary"
              >
                <GithubMark />
                chaos-design/china
              </a>
            </div>
          </footer>
        ) : null}
      </main>

      {showThemePicker ? <AccentPicker {...accentState} /> : null}
    </div>
  );
}
