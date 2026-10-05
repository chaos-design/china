# AGENTS.md

Guidance for AI coding agents and humans working in this repository. Keep changes focused, reviewable, and ready to ship.

## Project Overview

This repository is **中国古代全览**, a React 19 + TypeScript single-page app for exploring Chinese ancient history through:

- a water-ink styled home page with a one-per-window scroll entrance animation,
- a Three.js-powered 3D chronology at `/china/timeline`,
- a dynasty policy atlas at `/china/policies`,
- resource-driven preview entries for future topics,
- iframe-isolated HTML resource pages generated from `resources/html/*.html`,
- a 404 fallback page for unknown routes.

Public URL:

- https://china.chaosmic.cn/

Deployment target: **Vercel**, fully declared in `vercel.json` (`framework: vite`, `installCommand: pnpm install --frozen-lockfile`, `buildCommand: pnpm build`, `outputDirectory: dist`, SPA `rewrites` to `/index.html`). The Git integration posts a GitHub Deployment whose `environment_url` is the Vercel production URL, but that URL is password-protected — verify against the custom domain instead.

## Tech Stack

| Layer | Tooling |
| --- | --- |
| Framework | React 19, TypeScript |
| Build | Vite 8 |
| Routing | React Router |
| Styling | Tailwind CSS 4, shadcn/ui, Emotion |
| Motion | GSAP, CSS animations |
| 3D | Three.js |
| Source mapping | `@rolldown/plugin-babel` with JSX `data-source` injection |
| Quality | Biome, TypeScript, Vitest, Testing Library |
| Analytics | Vercel Analytics |
| Package manager | pnpm 10 |

## Setup Commands

```bash
pnpm install
pnpm dev
```

Use Node >= 20.19. Node 22 LTS is recommended in local development.

## Required Checks

Run and pass all checks before considering a change complete:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Coverage thresholds are enforced in `vite.config.ts`; `pnpm test:coverage` exits non-zero below them, so CI catches regressions. The enforced floors are statements 93, lines 94, functions 90, branches 80. Branches are lower on purpose: the remaining uncovered branches are almost entirely environment guards (`typeof window === "undefined"`) and defensive fallbacks for data fields that are always populated — all 385 policy cards carry `bg`/`content`/`impact`, and all 419 glossary terms carry `title`/`type`/`body`. Reaching 90% branches would mean deleting globals or mocking the data files, which makes the tests worse rather than better. If you remove one of those guards, drop the corresponding threshold.

## Code Conventions

- TypeScript only in `src/`; no plain `.js` source files.
- File names are lowercase and hyphen-separated, for example `home-entrance-animation.tsx`.
- Functions use `lowerCamelCase`; React components use PascalCase identifiers.
- Use **relative imports** for project-local modules. Do not introduce or use `@/` path aliases.
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind class composition.
- Keep edits scoped to the requested behavior. Do not perform unrelated refactors.

## Styling Conventions

Priority order:

1. Tailwind utilities.
2. shadcn/ui primitives for common UI.
3. Local CSS or Emotion only where Tailwind is awkward or behavior is highly specific.

Visual language:

- Prefer Chinese water-ink, paper, seal, scroll, and traditional color details where appropriate.
- Preserve layout stability over visual flourish.
- Use subtle motion and avoid blocking interaction layers; decorative overlays should use `pointer-events: none`.

State persistence:

- Long-lived user preferences, such as theme/accent choices, belong in `localStorage`.
- Per-window experience state, such as whether the home scroll entrance has already played, belongs in `sessionStorage`.
- Accent color state is initialized in `RootLayout` so Header, home, 404, and other routes can react consistently.

## Routing

Routes are centralized in `src/routes.tsx`.

Current public routes:

| Path | Purpose |
| --- | --- |
| `/` | Home page |
| `/china` | Redirect to `/china/timeline` |
| `/china/timeline` | 3D chronology / 时间长河 |
| `/china/policies` | Dynasty policy atlas / 政策全览 |
| `/<html-resource-slug>` | Generated from `resources/html/*.html` with kebab-case slugs |
| `*` | 404 fallback page |

Route-level layout options live in `src/route-layout-config.ts`.

Current HTML resource slugs: `/ancient-china` (legacy, hidden from home), `/intangible-culture-heritage`, `/silk-road`, `/taiwan`.

The site's stated scope is 中国古代, but the HTML resources are not all 中国古代 material. Three of the four (非遗, 丝绸之路, and the legacy 朝代浮岛 page) are cultural-history topics that fit; `/taiwan` is geography plus modern history and deliberately does not. When adding a resource, decide explicitly whether it fits the 中国古代 frame. If it does not, either widen the framing in `README.md` / `index.html` metadata, or keep the resource but document the exception here — do not silently expand the site's meaning through a single page.

HTML resource routing:

- HTML files live in `resources/html/`.
- Matching metadata lives in `resources/html-resource/` and must satisfy `PageResourceConfig` from `src/pages/page-resources.ts`.
- Optional data payloads live in `resources/html-data/` and are inlined into `<script id="ndata" data-resource="..."></script>` placeholders.
- Missing `resources/html-resource/*.json` metadata is non-fatal. The app filters that HTML resource out instead of throwing during route or home-page aggregation.
- Render complex imported HTML with `iframe srcDoc`; do not mount it directly into the React tree.
- HTML resources render inside an `iframe srcDoc`, so **absolute** paths in them resolve against the site root. `intangible-culture-heritage` relies on this: its `img` fields point at `/heritage/*.jpg` under `public/`. Never inline large binary payloads as base64 in `html-data` — that ships them in the JS chunk regardless of whether the element is visible.
- `resources/html/*` and `resources/html-data/*` are **not** loaded eagerly. `src/pages/html-resources/resource.ts` keeps only `path` + `PageResourceConfig` in the synchronous index; the HTML/JSON bodies are code-split and fetched through `HtmlResource.loadDocument()`, which `HtmlResourcePage` renders via `React.lazy` + `Suspense`.
- `src/pages/ancient/china-policies/figures/*.svg` total ~3.9MB and are referenced through static `import("./figures/x.svg?raw")` specifiers so each map becomes its own chunk. Keep the literal specifiers — they preserve compile-time path checking. `PolicyFigure` owns a `Suspense` boundary and a cached lazy component per figure id.
- `loadDocument()` caches its in-flight promise. Keep it that way if you refactor it: React re-invokes lazy factories on re-suspension.
- Do **not** reintroduce `React.use()` here. Under this project's Vitest + jsdom + React 19.2 setup a promise passed to `use()` never resolves inside a Testing Library `render()`. `React.lazy` is the pattern that works, and it matches `src/routes.tsx`.
- HTML resources are standalone documents with their own CSS and render loops. Do not try to share stylesheets or renderers between them: each file is inlined into its own `iframe srcDoc`, so sharing would require a build-time template step that does not exist. Copy the pattern and diverge; the duplication is cheaper than the coupling.

### Block vocabulary in `resources/html/taiwan.html`

`taiwan.json` chapters carry `blocks` discriminated by `type`: `terrain`, `prose`, `grid`, `list`, `timeline`, `quote`. The renderer and its palette live entirely inside `taiwan.html`.

This is intentionally **not** a shared abstraction, because exactly one resource uses it. Extracting it now would be speculative generality. Revisit only when a second resource needs the same block types — at that point pull the renderer into `resources/html/_shared/` and have each HTML `<link>` or inline it. Do not extract at one consumer.

Two content conventions are worth knowing before editing:

- `renderInline()` escapes all HTML first, then re-enables only `<b>` and `<T t='tooltip'>term</T>`. Any other tag in the JSON renders as visible text. `<T>` tooltips are hover-only, so they are unreachable on touch devices — use `<b>` or a `list` block for anything essential.
- Contested figures (2/28 casualty counts, comfort-women numbers, White Terror case counts) are written as ranges with the dispute stated inline, plus a disclaimer in the page footer. Keep that pattern if the numbers are updated; do not collapse a range into a single number to look authoritative.

## Directory Map

| Path | Purpose |
| --- | --- |
| `src/components/layout/` | Shared layout and navigation |
| `src/components/ui/` | shadcn/ui primitives |
| `src/components/` | App-specific components and entrance animation |
| `src/hooks/` | Reusable hooks |
| `src/lib/` | Framework-agnostic utilities |
| `src/pages/home.tsx` | Home page |
| `src/pages/html-resources/` | Dynamic HTML resource routes and iframe rendering |
| `src/pages/not-found.tsx` | 404 fallback page |
| `src/pages/page-resources.ts` | Resource aggregation for home entries |
| `src/pages/ancient/china/` | Three.js chronology page |
| `src/pages/ancient/china-policies/` | Policy atlas page, data, parser, tests |
| `src/pages/upcoming/` | Preview resources for planned topics |
| `src/styles/globals.css` | Tailwind layers, design tokens, global CSS |
| `resources/html/` | Static HTML resources that become generated routes |
| `resources/html-data/` | Optional JSON payloads for HTML resources |
| `resources/html-resource/` | `PageResourceConfig` metadata for HTML resources |
| `scripts/babel-plugin-jsx-source-location.cjs` | JSX `data-source` injection for DOM-to-source lookup |
| `.agents/skills/` | Project-local agent skills and workflow notes |

## Testing Conventions

- Co-locate tests next to source where practical as `*.test.ts` or `*.test.tsx`.
- Use Vitest globals and Testing Library.
- Cover positive cases, negative cases, and boundary conditions.
- For UI state persistence, test both first-run and persisted-state paths.
- For visual-only CSS changes, add focused DOM/class assertions when useful.
- For HTML resource changes, cover route slug generation, metadata filtering, and home aggregation behavior.
- For global UI state persistence, prefer assertions around the persisted and first-run paths.

## Agent Skills

Project-local skills live under `.agents/skills/`. Use the most specific skill for the task:

- `frontend-dev`: React routes, components, hooks, Tailwind, shadcn/ui, or layout changes.
- `frontend-design`: visual design, page/component styling, and polished UI work.
- `testing-guide`: adding, fixing, or debugging Vitest and Testing Library tests.
- `code-quality`: Biome, linting, formatting, and final quality gates.
- `project-stack`: stack, Vite, Tailwind, dependency, or architecture questions.
- `deploy-guide`: Vercel/deployment configuration, production build behavior, and hosting notes.
- `html-resource-sync`: generating `resources/html-resource/*.json` metadata for new HTML files.
- `vite-tailwind-source-location`: Vite/Tailwind JSX source-location injection setup.

## Deployment Notes

Public URL:

- https://china.chaosmic.cn/

The app is a Vite SPA. Any hosting target must support fallback rewrites to `index.html` for deep links such as `/china/timeline`, `/china/policies`, and generated HTML resource routes.

Vercel specifics:

- `vercel.json` is the single source of truth. Vercel's `rewrites` run **after** the filesystem check, so the catch-all `/(.*)` → `/index.html` rule coexists with hashed assets under `/assets/`.
- `installCommand` is pinned to `pnpm install --frozen-lockfile`, matching `.github/workflows/ci.yml`. If you change dependencies, regenerate `pnpm-lock.yaml` and commit it, otherwise deploys fail.
- Node.js version is resolved from `engines.node` (`>=20.19.0`), which Vercel maps to the latest LTS. CI uses Node 22. The build has been verified green on both Node 22 and Node 24.
- The Vercel Git integration posts a GitHub Deployment for every push to `main`; its `environment_url` is the password-protected production URL. Verify deployments against the custom domain.
- The `heritage/*.jpg` files under `public/` are served from the site root and intentionally keep stable filenames, so they are **not** covered by the immutable `/assets/*` cache rule.

Do not change build output settings without updating README and deployment config together.

## Do / Don't

- Do keep changes minimal and task-focused.
- Do preserve existing user or generated changes in the worktree.
- Do run the full quality gate before finishing.
- Do update tests when behavior changes.
- Don't revert unrelated changes.
- Don't introduce a new styling system.
- Don't disable Biome rules globally.
- Don't commit `dist/`, `coverage/`, or `node_modules/`.
