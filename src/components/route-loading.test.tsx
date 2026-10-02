import { render, screen } from "@testing-library/react";

import { RouteLoading } from "./route-loading";

describe("RouteLoading", () => {
  it("renders an accessible route loading state", () => {
    render(<RouteLoading />);

    expect(screen.getByRole("status", { name: "页面加载中" })).toBeInTheDocument();
    expect(screen.getByText("正在铺展卷轴")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});
