import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DimensionMenu } from "./dimension-menu";

const DIMS = ["权谋·中央集权", "疆域·地区划分", "工艺·古法制造"];

describe("<DimensionMenu />", () => {
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
  });

  it("renders the vertical title and one entry per dimension with the active state", () => {
    render(<DimensionMenu dims={DIMS} active={DIMS[2]} onSelect={() => {}} />);

    expect(screen.getByText("朝 代 维 度")).toBeInTheDocument();

    const tabs = screen.getAllByRole("button");
    expect(tabs).toHaveLength(DIMS.length);
    expect(tabs[2]).toHaveClass("active");
    expect(tabs[2]).toHaveAttribute("aria-current", "true");
    expect(tabs[0]).not.toHaveClass("active");
    expect(tabs[0]).not.toHaveAttribute("aria-current");
  });

  it("reports the chosen dimension through onSelect", () => {
    const onSelect = vi.fn();
    render(<DimensionMenu dims={DIMS} active={DIMS[0]} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: DIMS[1] }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(DIMS[1]);
  });

  it("shows a full-name bubble to the right on hover and hides it on leave", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    render(<DimensionMenu dims={DIMS} active={DIMS[0]} onSelect={() => {}} />);

    const tab = screen.getByRole("button", { name: DIMS[1] });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(tab);
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent(DIMS[1]);
    // jsdom rects are all zero: the bubble pops right of the entry (left = 0 + 10),
    // vertically clamped into the viewport (top = 0 - 15 → 8).
    expect(tip.style.left).toBe("10px");
    expect(tip.style.top).toBe("8px");

    fireEvent.mouseLeave(tab);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("flips the clamped bubble left when the viewport right edge has no room", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 100 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 200 });
    render(<DimensionMenu dims={DIMS} active={DIMS[0]} onSelect={() => {}} />);

    fireEvent.mouseEnter(screen.getByRole("button", { name: DIMS[0] }));
    const tip = screen.getByRole("tooltip");
    // left = 0 - 150 - 10 = -160 → clamped to 8; top likewise clamped to 8.
    expect(tip.style.left).toBe("8px");
    expect(tip.style.top).toBe("8px");
  });

  it("shows the bubble on keyboard focus and hides it on blur", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    render(<DimensionMenu dims={DIMS} active={DIMS[0]} onSelect={() => {}} />);

    const tab = screen.getByRole("button", { name: DIMS[0] });
    fireEvent.focus(tab);
    expect(screen.getByRole("tooltip")).toHaveTextContent(DIMS[0]);

    fireEvent.blur(tab);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
