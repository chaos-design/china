import { render, screen } from "@testing-library/react";

import { LegacyHtmlDocument } from "./legacy-html-document";

describe("<LegacyHtmlDocument />", () => {
  it("renders trusted legacy HTML inside a sandboxed iframe", () => {
    render(<LegacyHtmlDocument html="<main><h1>旧版页面</h1></main>" title="古代中国旧版页" />);

    const iframe = screen.getByTestId("legacy-html-document");

    expect(iframe).toHaveAttribute("title", "古代中国旧版页");
    expect(iframe).toHaveAttribute("srcDoc", "<main><h1>旧版页面</h1></main>");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-forms",
    );
    expect(iframe).toHaveClass("block", "h-full", "w-full", "border-0");
  });
});
