import { createRequire } from "node:module";
import { transformSync } from "@babel/core";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const babelPluginJsxSourceLocation = require("./babel-plugin-jsx-source-location.cjs");

function transformJsx(code, filename = "src/example.tsx") {
  return transformSync(code, {
    cwd: process.cwd(),
    filename: `${process.cwd()}/${filename}`,
    parserOpts: {
      plugins: ["jsx", "typescript"],
    },
    plugins: [babelPluginJsxSourceLocation],
  }).code;
}

describe("babel-plugin-jsx-source-location", () => {
  it("injects relative data-source attributes into native JSX elements", () => {
    const code = transformJsx("const view = <div><span>Hi</span></div>;");

    expect(code).toContain('data-source="src/example.tsx:1:14"');
    expect(code).toContain('data-source="src/example.tsx:1:19"');
  });

  it("skips custom components and existing data-source attributes", () => {
    const code = transformJsx(
      'const view = <Card><div data-source="manual">Hi</div><mesh /></Card>;',
    );

    expect(code).not.toContain("<Card data-source");
    expect(code).not.toContain("<mesh data-source");
    expect(code).toContain('data-source="manual"');
  });
});
