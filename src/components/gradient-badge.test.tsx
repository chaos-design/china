import { render, screen } from "@testing-library/react";

import { GradientBadge } from "./gradient-badge";

describe("<GradientBadge />", () => {
  it("renders badge content with the styled span contract", () => {
    render(<GradientBadge>史鉴</GradientBadge>);

    expect(screen.getByText("史鉴")).toBeInstanceOf(HTMLSpanElement);
  });
});
