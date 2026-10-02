import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AncientChinaReactPage } from "./page";
import { startAncientChinaRuntime, stopAncientChinaRuntime } from "./runtime";

vi.mock("./runtime", () => ({
  startAncientChinaRuntime: vi.fn(),
  stopAncientChinaRuntime: vi.fn(),
}));

const startRuntime = vi.mocked(startAncientChinaRuntime);
const stopRuntime = vi.mocked(stopAncientChinaRuntime);

describe("<AncientChinaReactPage />", () => {
  beforeEach(() => {
    vi.stubEnv("MODE", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("starts the Three.js runtime outside test mode and stops it on unmount", () => {
    const { unmount } = render(<AncientChinaReactPage />);

    expect(startRuntime).toHaveBeenCalledTimes(1);
    expect(screen.getByText("加载中 · 3D 朝代长河")).toBeInTheDocument();

    unmount();

    expect(stopRuntime).toHaveBeenCalledTimes(1);
  });

  it("shows a loading error when the runtime throws a non-Error value", () => {
    startRuntime.mockImplementationOnce(() => {
      throw "runtime unavailable";
    });

    render(<AncientChinaReactPage />);

    expect(screen.getByText("Three.js 加载失败")).toBeInTheDocument();
  });
});
