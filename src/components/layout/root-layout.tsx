import { Asterisk } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, matchPath, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAccent } from "../../hooks/use-accent";
import { cn } from "../../lib/utils";
import { ROUTE_LAYOUT_CONFIGS } from "../../route-layout-config";
import { AccentPicker } from "../accent-picker";

const NAV_LINKS = [
  { to: "/china/timeline", label: "时间长河", end: true },
  { to: "/china/policies", label: "政策全览", end: true },
];

const MENU_MOTION_DURATION_MS = 320;

type MenuMotion = {
  from: number;
  to: number;
  direction: -1 | 1;
};

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

function getActiveMenuIndex(pathname: string) {
  return NAV_LINKS.findIndex((link) => matchPath({ path: link.to, end: link.end }, pathname));
}

export function RootLayout() {
  const location = useLocation();
  const layoutConfig = ROUTE_LAYOUT_CONFIGS.find((config) =>
    matchPath({ path: config.path, end: true }, location.pathname),
  );
  const showFooter = layoutConfig?.showFooter ?? false;
  const showThemePicker = layoutConfig?.showThemePicker ?? false;
  const accentState = useAccent();
  const activeMenuIndex = getActiveMenuIndex(location.pathname);
  const previousMenuIndexRef = useRef(activeMenuIndex);
  const [menuMotion, setMenuMotion] = useState<MenuMotion | null>(null);

  useEffect(() => {
    const previousMenuIndex = previousMenuIndexRef.current;
    if (activeMenuIndex < 0 || previousMenuIndex < 0 || activeMenuIndex === previousMenuIndex) {
      previousMenuIndexRef.current = activeMenuIndex;
      return;
    }

    const direction = activeMenuIndex > previousMenuIndex ? 1 : -1;
    setMenuMotion({ from: previousMenuIndex, to: activeMenuIndex, direction });
    previousMenuIndexRef.current = activeMenuIndex;

    const timer = window.setTimeout(() => setMenuMotion(null), MENU_MOTION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeMenuIndex]);

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

          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-full px-2 py-1">
            {NAV_LINKS.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-baseline gap-1.5 rounded-none border border-transparent bg-transparent px-3 py-1.5 text-base transition-colors duration-300 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                    isActive ? "text-ink" : "text-muted-foreground hover:text-ink",
                  )
                }
              >
                {({ isActive }) => (
                  <span
                    className={cn(
                      "nav-underline",
                      isActive && "nav-underline-active",
                      isActive &&
                        menuMotion?.to === index &&
                        (menuMotion.direction > 0
                          ? "nav-underline-forward"
                          : "nav-underline-backward"),
                      !isActive &&
                        menuMotion?.from === index &&
                        (menuMotion.direction > 0
                          ? "nav-underline-leaving-forward"
                          : "nav-underline-leaving-backward"),
                    )}
                  >
                    {link.label}
                  </span>
                )}
              </NavLink>
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
