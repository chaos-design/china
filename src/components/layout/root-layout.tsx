import { Asterisk } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, matchPath, Outlet, useLocation } from "react-router-dom";
import { useAccent } from "../../hooks/use-accent";
import { ROUTE_LAYOUT_CONFIGS } from "../../route-layout-config";
import { AccentPicker } from "../accent-picker";
import { findNavGroupId } from "./nav-groups";
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
  const mainRef = useRef<HTMLElement>(null);
  const layoutConfig = ROUTE_LAYOUT_CONFIGS.find((config) =>
    matchPath({ path: config.path, end: true }, location.pathname),
  );
  const showFooter = layoutConfig?.showFooter ?? false;
  const showThemePicker = layoutConfig?.showThemePicker ?? false;
  const accentState = useAccent();

  // 直接派生，不需要 state：路由变了就重算，避免多一次渲染与一处可能过期的副本。
  const activeGroupId = findNavGroupId(location.pathname, (path, pathname) =>
    Boolean(matchPath({ path, end: true }, pathname)),
  );

  // 切路由时把滚动位置清回顶部。外层 <main> 是所有路由共用的滚动容器，
  // 从一条 HTML 资源跳到另一条（iframe srcDoc）或跳到政策/时间页时，
  // 否则残留的 scroll 会停在旧位置，造成"路由变了但内容没刷新"的错觉。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 依赖 pathname 是故意的——effect 本体不读它，但需要路径变化时重跑以滚动归零
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    // jsdom 的 Element 没有实现 scrollTo；真浏览器有。两条路都归零滚动位置。
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: 0, left: 0 });
    } else {
      el.scrollTop = 0;
    }
  }, [location.pathname]);

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

          <SiteMenu activeRouteGroupId={activeGroupId} />
        </nav>
      </header>

      <main ref={mainRef} className="relative z-10 min-h-0 w-full flex-1 overflow-y-auto p-0">
        {/* key 用 location.pathname：真实路径变化才强制 <Outlet> 子树整体重挂载。
            兄弟 HTML 资源路由复用同一组件类型时，React 默认只更新 props 而不换 iframe；
            重挂载才能保证 srcDoc 真正刷新。用 pathname 而非 location.key，避免同页的
            search/state 变化也触发重挂载而丢失页面内部状态。 */}
        <Outlet key={location.pathname} />

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
