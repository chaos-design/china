import { Asterisk, Compass } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, matchPath, Outlet, useLocation } from "react-router-dom";
import { useAccent } from "../../hooks/use-accent";
import { ROUTE_LAYOUT_CONFIGS } from "../../route-layout-config";
import { AccentPicker } from "../accent-picker";
import { findNavGroupId, NAV_GROUPS } from "./nav-groups";
import { SiteMenu } from "./site-menu";

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

export function RootLayout() {
  const location = useLocation();
  const layoutConfig = ROUTE_LAYOUT_CONFIGS.find((config) =>
    matchPath({ path: config.path, end: true }, location.pathname),
  );
  const showFooter = layoutConfig?.showFooter ?? false;
  const showThemePicker = layoutConfig?.showThemePicker ?? false;
  const accentState = useAccent();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // 直接派生，不需要 state：路由变了就重算，避免多一次渲染与一处可能过期的副本。
  const activeGroupId = findNavGroupId(location.pathname, (path, pathname) =>
    Boolean(matchPath({ path, end: true }, pathname)),
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
          </Link>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono-tech text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {NAV_GROUPS.length} 类 /{" "}
              {NAV_GROUPS.reduce((total, group) => total + group.items.length, 0)} 篇
            </span>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              className="btn-ink inline-flex items-center gap-2 rounded-full bg-paper/90 px-4 py-1.5 font-kai text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              onClick={() => setMenuOpen(true)}
              ref={menuTriggerRef}
              type="button"
            >
              <Compass aria-hidden="true" className="h-4 w-4 text-primary" />
              全览地图
            </button>
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
      {menuOpen ? (
        <SiteMenu
          activeRouteGroupId={activeGroupId}
          onClose={closeMenu}
          triggerRef={menuTriggerRef}
        />
      ) : null}
    </div>
  );
}
