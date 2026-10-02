import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardContent, CardHeader, CardTitle } from "../card";

describe("Card", () => {
  it("renders composed card sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>标题</CardTitle>
        </CardHeader>
        <CardContent>内容</CardContent>
      </Card>,
    );

    expect(screen.getByText("标题")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("内容")).toHaveAttribute("data-slot", "card-content");
  });

  it("merges caller classes", () => {
    const { container } = render(<Card className="rounded-none px-4">卡片</Card>);
    expect(container.firstElementChild).toHaveClass("rounded-none", "px-4");
  });
});
