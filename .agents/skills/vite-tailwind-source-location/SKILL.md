---
name: "vite-tailwind-source-location"
description: "Guides Vite + Tailwind JSX source-location setup. Invoke when configuring Vite/Tailwind, data-source injection, or AI source mapping."
---

# Vite Tailwind Source Location

Use this skill when a Vite + Tailwind frontend project needs JSX source-location
metadata, especially when AI agents must locate source files from DOM elements
through a `data-source` attribute.

This skill is based on the Chaos Design Vite Tailwind configuration pattern and
extends it with version-specific Vite integration paths.

## Trigger Conditions

- The user asks to configure Vite + Tailwind from a Chaos Design template.
- The user asks to add JSX source mapping, source location, or `data-source`
  attributes to rendered DOM.
- The project needs AI-friendly DOM-to-source navigation.
- Vite, Tailwind, React, Babel, Rolldown, or `@vitejs/plugin-react` integration
  is being changed for source-location metadata.

## Goals

1. Add a Babel plugin at `scripts/babel-plugin-jsx-source-location.cjs`.
2. Inject `data-source="<relative-file>:<line>:<column>"` only into native
   HTML/SVG JSX elements.
3. Avoid custom React components, React fragments, React Three Fiber elements,
   and files from `node_modules`.
4. Keep paths project-relative and portable.
5. Preserve existing Tailwind and React plugin behavior.

## Babel Plugin Requirements

Create or update `scripts/babel-plugin-jsx-source-location.cjs`.

The plugin must:

- export a CommonJS Babel plugin function;
- visit `JSXOpeningElement`;
- skip missing filenames and `node_modules`;
- skip `React.Fragment`, `Fragment`, `Suspense`, `StrictMode`, member
  expressions such as `Foo.Bar`, and custom components;
- inject only when the opening element does not already have `data-source`;
- use the JSX node location start line and one-based column;
- compute file paths relative to `process.cwd()` or `state.cwd`.

Minimal implementation shape:

```js
module.exports = function babelPluginJsxSourceLocation({ types: t }) {
  const HTML_TAGS = new Set([
    "a",
    "article",
    "aside",
    "button",
    "canvas",
    "div",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "iframe",
    "img",
    "input",
    "label",
    "li",
    "main",
    "nav",
    "ol",
    "option",
    "p",
    "section",
    "select",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "textarea",
    "th",
    "thead",
    "tr",
    "ul",
  ]);

  const SVG_TAGS = new Set([
    "svg",
    "circle",
    "clipPath",
    "defs",
    "ellipse",
    "g",
    "line",
    "linearGradient",
    "mask",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "stop",
    "symbol",
    "text",
    "tspan",
    "use",
  ]);

  const NATIVE_TAGS = new Set([...HTML_TAGS, ...SVG_TAGS]);

  const shouldSkipFile = (filename) => !filename || filename.includes("node_modules");

  const getRelativePath = (filename, cwd) => {
    if (!filename || !cwd) return filename;
    return filename.startsWith(cwd) ? filename.slice(cwd.length + 1) : filename;
  };

  const hasDataSourceAttr = (attributes) =>
    attributes.some(
      (attr) =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name, { name: "data-source" }),
    );

  const shouldSkipElement = (name) => {
    if (t.isJSXMemberExpression(name)) return true;
    if (!t.isJSXIdentifier(name)) return true;

    const tagName = name.name;
    if (["Fragment", "Suspense", "StrictMode"].includes(tagName)) return true;

    return !NATIVE_TAGS.has(tagName);
  };

  return {
    name: "jsx-source-location",
    visitor: {
      JSXOpeningElement(path, state) {
        const { filename } = state;
        if (shouldSkipFile(filename)) return;
        if (shouldSkipElement(path.node.name)) return;
        if (hasDataSourceAttr(path.node.attributes)) return;

        const { line, column } = path.node.loc?.start || {};
        if (!line) return;

        const cwd = state.cwd || process.cwd();
        const relativePath = getRelativePath(filename, cwd);
        const col = column !== undefined ? column + 1 : 1;

        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-source"),
            t.stringLiteral(`${relativePath}:${line}:${col}`),
          ),
        );
      },
    },
  };
};
```

For production use, expand the native HTML/SVG tag whitelist to match the full
tag list needed by the project. Keep React Three Fiber tags such as `mesh`,
`boxGeometry`, and `ambientLight` out of the whitelist.

## Vite Version Integration

Choose the integration path by the Vite major version and the React plugin in
use.

### Vite 4 and Vite 5

Use `@vitejs/plugin-react` and its `babel.plugins` option.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["./scripts/babel-plugin-jsx-source-location.cjs"],
      },
    }),
  ],
});
```

Notes:

- This is the closest implementation to the original Chaos Design template.
- If the project uses `@vitejs/plugin-react-swc`, Babel plugins will not run
  through that React plugin. Prefer switching to `@vitejs/plugin-react` when
  source-location injection is required.
- Preserve existing React options such as `jsxImportSource`.

### Vite 6 and Vite 7

Use the same `@vitejs/plugin-react` Babel hook unless the project has adopted a
Rolldown-specific build pipeline.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["./scripts/babel-plugin-jsx-source-location.cjs"],
      },
    }),
  ],
});
```

Notes:

- Keep config files ESM-compatible when `package.json` has `"type": "module"`.
- Use CommonJS for the Babel plugin file (`.cjs`) so it can be loaded reliably
  by Babel across ESM projects.
- If plugin ordering changes transform results, keep React before unrelated
  asset or framework plugins unless the framework documents otherwise.

### Vite 8 or Rolldown-Based Vite

When the project uses Vite 8 with Rolldown or a Rolldown-compatible Babel
pipeline, prefer `@rolldown/plugin-babel` as a separate Vite plugin.

```ts
/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    babel({
      plugins: ["./scripts/babel-plugin-jsx-source-location.cjs"],
    }),
  ],
});
```

Notes:

- This is the preferred path for this repository because it uses Vite 8 and
  already depends on `@rolldown/plugin-babel`.
- Keep the Babel plugin path project-relative.
- Do not remove existing React plugin options while adding the Rolldown Babel
  plugin.

## Tailwind Version Notes

Source-location injection is independent from Tailwind, but do not break the
project's Tailwind wiring while editing Vite config.

### Tailwind CSS 3

Typical files:

- `tailwind.config.ts` or `tailwind.config.js`
- `postcss.config.js`
- global CSS containing `@tailwind base;`, `@tailwind components;`, and
  `@tailwind utilities;`

Avoid changing Tailwind content globs unless the user asks.

### Tailwind CSS 4

Typical files:

- `postcss.config.js` using `@tailwindcss/postcss`
- global CSS using `@import "tailwindcss";`
- optional CSS-first theme tokens in the global stylesheet

Avoid introducing a Tailwind 3 style config file unless the project already uses
one or the user explicitly asks.

## Required Checks

After changing config or source files, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

If only this Skill file is changed, validate the markdown/frontmatter structure
and inspect the generated file.

## Quality Checklist

- `SKILL.md` frontmatter has `name` and `description`.
- The description states both what the skill does and when to invoke it.
- All referenced paths are project-relative.
- The chosen Vite integration matches the installed Vite and React plugin
  versions.
- Existing Vite, Vitest, Tailwind, Emotion, and React options are preserved.
- Generated `data-source` values are project-relative, not absolute system
  paths.
- Custom JSX elements and React Three Fiber elements are not polluted with DOM
  attributes.
