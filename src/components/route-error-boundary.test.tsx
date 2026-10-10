import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { RouteErrorBoundary } from "./route-error-boundary";

// 故意抛错的子组件：通过 prop 决定渲染时是否触发渲染期错误。
function ExplodingComponent({ boom }: { boom: boolean }) {
  if (boom) {
    throw new Error("kaboom");
  }
  return <p>all good</p>;
}

// 抛出非 Error 值（字符串）：触发 getDerivedStateFromError 里 `String(error)` 兜底路径。
function StringBoom(): ReactElement {
  throw "字符串错误";
}

// 抛出空字符串：`String("")` 为空、message 为 falsy，走详情行的 `: null` 分支。
function EmptyStringBoom(): ReactElement {
  throw "";
}

function renderWith(children: ReactNode, { initialEntries = ["/"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={<RouteErrorBoundary>{children}</RouteErrorBoundary>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("<RouteErrorBoundary />", () => {
  it("passes children through untouched when nothing errors", () => {
    renderWith(<ExplodingComponent boom={false} />);
    expect(screen.getByText("all good")).toBeInTheDocument();
    expect(screen.queryByTestId("route-error-boundary")).not.toBeInTheDocument();
  });

  it("swallows a render error and shows the recoverable fallback", () => {
    renderWith(<ExplodingComponent boom={true} />);

    const alert = screen.getByTestId("route-error-boundary");
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveTextContent("页面未能完整载入");
    expect(screen.getByRole("button", { name: /重新加载/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /返回首页/ })).toBeInTheDocument();
  });

  it("shows the error detail when the thrown value is an Error", () => {
    renderWith(<ExplodingComponent boom={true} />);
    expect(screen.getByTestId("route-error-message")).toHaveTextContent("kaboom");
  });

  it("coerces non-Error throw values into the detail line", () => {
    renderWith(<StringBoom />);
    expect(screen.getByTestId("route-error-message")).toHaveTextContent("字符串错误");
  });

  it("omits the detail line when the message is empty", () => {
    renderWith(<EmptyStringBoom />);
    // 边界仍降级（hasError 为真），但 message 为空 → 详情行不渲染
    expect(screen.getByTestId("route-error-boundary")).toBeInTheDocument();
    expect(screen.queryByTestId("route-error-message")).not.toBeInTheDocument();
  });

  it("reloads the window when 重新加载 is clicked", () => {
    const reloadSpy = vi.fn();
    // 只替换 location.reload，保留其余 window 能力；jsdom 的 location 可写。
    vi.stubGlobal("location", { ...window.location, reload: reloadSpy });
    renderWith(<ExplodingComponent boom={true} />);

    fireEvent.click(screen.getByRole("button", { name: /重新加载/ }));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
