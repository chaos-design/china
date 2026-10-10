import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "./ui/button";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * 路由级错误边界。挂在 <RootLayout> 的 <Outlet> 外层，兜住两件事：
 *
 * 1. 某个懒加载路由 chunk（React.lazy 的动态 import）拉取或求值失败时抛错——
 *    没有边界的 SPA 里，这类错误会让整棵 React 树 unmount，表现为「整页白屏、
 *    卡住不动」。边界捕获后渲染一个可恢复的降级卡片，用户点「重新加载」即可
 *    重新拉取资源，而不是干等一片白。
 * 2. 任意路由页面渲染期抛出的运行时错误，同样降级而不是白屏。
 *
 * 用类组件而非函数：只有 class 的 getDerivedStateFromError / componentDidCatch
 * 才能捕获子树渲染错误。
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): RouteErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // 留一份服务端可读的日志（预览/生产排障用），但绝不因为打日志再次抛错。
    try {
      console.error("[RouteErrorBoundary] 路由内容渲染失败：", error, info.componentStack);
    } catch {
      /* 忽略日志失败 */
    }
  }

  private handleReload = () => {
    // 强制重新加载：清掉可能已损坏/卡住的 chunk 缓存后从 index.html 重来
    window.location.reload();
  };

  render() {
    const { children } = this.props;
    if (!this.state.hasError) {
      return children;
    }

    return (
      <section
        className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-6 py-20"
        role="alert"
        data-testid="route-error-boundary"
      >
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vermillion/10 text-vermillion">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.32em] uppercase">
              页面未能完整载入
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="font-brush text-5xl leading-tight text-ink sm:text-6xl">
              这一卷史册未能展开
            </h1>
            <p className="max-w-xl text-muted-foreground leading-relaxed">
              资源加载或页面渲染中断了，可能是网络波动或当前版本的一部分资源未就绪。
              重新加载通常即可恢复；若仍打不开，请返回首页后再次进入。
            </p>
            {this.state.message ? (
              <p
                data-testid="route-error-message"
                className="max-w-xl break-all font-mono-tech text-muted-foreground/70 text-xs"
              >
                {this.state.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={this.handleReload}
              className="btn-ink rounded-sm bg-vermillion px-6 font-mono-tech text-sm font-semibold tracking-wide text-primary-foreground uppercase hover:bg-vermillion"
            >
              重新加载
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-sm font-mono-tech text-sm font-semibold tracking-wide text-ink uppercase underline-offset-4 hover:bg-transparent hover:underline"
            >
              <Link to="/">返回首页</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }
}
