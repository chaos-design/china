import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeEntranceAnimation } from "./home-entrance-animation";

vi.mock("./history-scroll-unfold", () => ({
  HistoryScrollUnfold: ({
    children,
    config,
    contentClassName,
    onComplete,
    paperClassName,
    stageClassName,
  }: {
    children: ReactNode;
    config?: { duration?: number; holdDuration?: number };
    contentClassName?: string;
    onComplete?: () => void;
    paperClassName?: string;
    stageClassName?: string;
  }) => (
    <section
      aria-label="历史画卷展开"
      data-content-class={contentClassName}
      data-duration={config?.duration}
      data-hold-duration={config?.holdDuration}
      data-paper-class={paperClassName}
      data-stage-class={stageClassName}
    >
      <button onClick={onComplete} type="button">
        完成画卷动画
      </button>
      {children}
    </section>
  ),
}));

describe("<HomeEntranceAnimation />", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the scroll animation as a page entrance layer", () => {
    render(<HomeEntranceAnimation />);

    expect(screen.getByRole("status", { name: "首页入场动画" })).toBeInTheDocument();
    const scrollRegion = screen.getByRole("region", { name: "历史画卷展开" });
    expect(scrollRegion).toBeInTheDocument();
    expect(scrollRegion).toHaveAttribute("data-duration", "2.5");
    expect(scrollRegion).toHaveAttribute("data-hold-duration", "1");
    expect(scrollRegion).toHaveAttribute("data-stage-class", expect.stringContaining("86vh"));
    expect(
      screen.getByText("水墨初开，卷载朝代脉络与治国方略；待画卷铺陈之后，再入正文。"),
    ).toBeInTheDocument();
    expect(screen.getByText("治乱兴替")).toBeInTheDocument();
  });

  it("fades out first and then enters the home page", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(<HomeEntranceAnimation onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "完成画卷动画" }));

    expect(screen.getByRole("status", { name: "首页入场动画" })).toHaveClass("opacity-0");
    expect(onComplete).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
