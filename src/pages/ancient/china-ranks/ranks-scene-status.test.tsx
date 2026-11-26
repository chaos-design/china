import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RanksSceneStatus } from "./ranks-scene-status";

describe("<RanksSceneStatus /> — 画布加载反馈与 WebGL 异常态", () => {
  it("shows a live loading hint until the scene is ready", () => {
    render(
      <RanksSceneStatus ready={false} failed={false} onOpenGenealogy={vi.fn()} onRetry={vi.fn()} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("正在生长品级树");
    expect(screen.queryByText(/未能启用 WebGL/)).toBeNull();
  });

  it("shows the genealogy shortcut and a retry action when WebGL is unavailable", () => {
    const onOpenGenealogy = vi.fn();
    const onRetry = vi.fn();
    render(
      <RanksSceneStatus
        failed={true}
        onOpenGenealogy={onOpenGenealogy}
        onRetry={onRetry}
        ready={true}
      />,
    );

    expect(screen.getByText(/未能启用 WebGL/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /打开「族谱」对照/ }));
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onOpenGenealogy).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders no overlay when the scene is ready", () => {
    render(
      <RanksSceneStatus ready={true} failed={false} onOpenGenealogy={vi.fn()} onRetry={vi.fn()} />,
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByText(/未能启用 WebGL/)).toBeNull();
    expect(screen.queryByRole("button", { name: "重试" })).toBeNull();
  });
});
