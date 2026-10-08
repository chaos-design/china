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
- `src/pages/ancient/china/page.css` must keep `#loading` as `position: absolute`, not `fixed`. With `inset: 0; z-index: 99` on the viewport it covers `<header>`, and since the panel only disappears when Three.js initialises successfully, an initialisation failure leaves navigation permanently unclickable — the symptom looks like "the menu does nothing", not like a page error.
### The header mega menu

The header has a single trigger (「全览地图」) that opens a **hover mega dropdown** anchored under the navigation bar (modeled on the Claude.ai nav): three category columns side by side, each listing its entries by name only (no subtitle, no visible path; long names truncate to one line), plus a decorative hand-drawn China map strip on the right edge. Files:

| File | Role |
| --- | --- |
| `src/components/layout/nav-groups.ts` | `NAV_GROUPS` — categories, leaves, and each category's `mapZone` |
| `src/components/layout/site-menu.tsx` | The disclosure mega menu: trigger + panel, hover/close grace timers |
| `src/components/layout/hand-drawn-map.tsx` | Pure presentation — renders the geometry module as SVG |
| `src/components/layout/china-map-geometry.ts` | Projection, outlines, and per-region marks as plain data |

Decisions worth keeping:

- Group membership is an editorial judgement, so `NAV_GROUPS` stays hardcoded rather than in resource metadata. A startup check still rejects leaves with no matching available resource, so dead links fail loudly.
- The dropdown is a **disclosure pattern, not a modal**. No `role="dialog"`, no backdrop, no focus trap: focus moves freely between trigger and panel, Escape closes and refocuses the trigger, `pointerdown` outside or focus leaving the wrapper closes it. Do not reintroduce a focus trap here — there is nothing to trap.
- Hover opens after a short delay (`OPEN_DELAY_MS`); leaving the trigger/panel area closes after a grace period (`CLOSE_GRACE_MS`) so crossing the gap does not blink the panel shut. Both timers must be cleaned up on unmount — a late `setOpen` from a StrictMode double-mount reopens a closed panel.
- Panel content is conditionally mounted (`{open ? <div id="site-mega-menu">…} : null}`), so "closed means absent" is a fact; there is no hidden tree needing `inert`.
- All three columns are rendered at once (the old full-screen panel swapped one tabpanel). Tests can therefore assert all five destinations in a single pass.
- The map strip (`.mega-map`) is `pointer-events-none` and `hidden` below `lg`; the map's active zone follows the hovered column, falling back to the group that owns the current route.

### Editing the hand-drawn map

- **Only `--ink`, `--paper`, `--vermillion`, `--blueprint`, `--ochre` are bare channel triples** (`220 14% 13%`) and can take an alpha suffix. `--card`, `--border`, `--background`, `--foreground`, `--muted` and friends hold *complete* `hsl(...)` values, so `hsl(var(--card) / 0.46)` is invalid CSS that silently falls back to the initial value — `fill` becomes opaque black and the whole map turns into a black board. Use a bare-channel token, or `var(--card)` with no alpha. This failure is invisible to jsdom and only shows up in a real browser.
- The map strip container (`.mega-map`) is the last grid column of the dropdown panel (13rem wide, hidden below `lg`); the SVG keeps the full viewBox 1000×720 via `preserveAspectRatio="meet"` and fades into the panel with a radial `mask-image`. Earlier full-screen attempts (`inset: 0` under an opaque content panel, or a wider box whose eastern half sat under the text column) failed and should not be retried — a smaller but complete outline beats a large cropped one.
- Outline points are real lon/lat, and `project()` scales longitude by `cos(lat)` **per point**. A single `cos(lat0)` stretches the north — the same reasoning as `makeProjector` in `taiwan.html`. The horizontal scale is derived from the outline data, not hand-tuned, so editing coordinates re-fits the composition automatically.
- The mainland outline must stay a **simple closed curve**. This is a correctness constraint, not a taste one: `map-land-bleed` strokes the same path at 7px, so any self-intersection stacks 13% ink to near-opaque and shatters the map into black bands. Tracing the real Bohai Bay hairpin is therefore not allowed; the bay is omitted and the Shandong peninsula is simplified away.
- Hand-drawn feel comes from two independent layers: deterministic per-point `wobble()` offsets, and a Catmull-Rom → cubic Bézier conversion so the outline reads as a curve rather than a polygon. Skipping the Bézier step leaves visible straight runs even under the displacement filter.
- Wobble uses a seeded `mulberry32` evaluated at **module scope**. If it ran during render, the outline would differ between renders (and shift under StrictMode's double render).
- Region marks are plain `{ className, d }` strokes rather than JSX, so the geometry module stays render-free and directly testable. `map-stipple` exists as a separate class because a stipple dot's diameter is half its stroke width; at `map-mark`'s 1.9px the dots vanish at rail width.
- jsdom does not validate CSS. The alpha-channel bug above and the `mask-image` fade are invisible to the test suite — both were found by screenshotting a real browser. Visual changes to this menu need a browser check, not just `pnpm test`.
- Do not assert that the home entrance overlay is still mounted from a test that renders `/`. GSAP's `rAF` ticker unmounts it once the timeline reaches `onComplete` (~2.5s + a 1s hold), so `findByRole` races the real clock and fails intermittently on a loaded machine. Assert the sessionStorage write instead; `home-entrance-animation.test.tsx` covers the overlay itself with controllable timing.
- Island rings are sized against the island's actual extent in the viewBox. Taiwan is only ~30 units tall, so ring gaps that look reasonable on Hainan will swallow Taiwan entirely.

### Block vocabulary in `resources/html/taiwan.html`

`taiwan.json` chapters carry `blocks` discriminated by `type`: `profile`, `map`, `art`, `image`, `prose`, `grid`, `list`, `timeline`, `quote`, `note`. The renderer and its palette live entirely inside `taiwan.html`.

The `PROFILE_SVG` cross-section carries a viewBox that **starts above zero** (`0 -18 1000 268`). The peak label sits at `y=8` with a baseline-relative glyph body reaching `y≈-8.5`, so a viewBox starting at `0` shaves the label's top off. SVG root `overflow` is `hidden`, which makes this a real clip rather than a visual near-miss — and it is invisible to jsdom, which resolves no CSS and computes no glyph box. Any new text added near the top of that SVG needs the headroom re-checked, not eyeballed.

The timeline (`timeline` blocks) has two coupled pieces worth not breaking. The **dot/line alignment** hangs off one custom property, `--tl-axis` on `.tl` (100px desktop, 8px below 960px): the 1px rule sits at `left:var(--tl-axis)` and the 9px dot at `left:calc(var(--tl-axis) - 4px)`, so both centre on `axis + 0.5`. `.tl` must keep `padding-left:0` — the rule is positioned against `.tl`'s padding box but the dot against the `li`, so any `.tl` padding shifts every dot sideways (an earlier `padding-left:2px` put the line 2px left of centre, which the old note here wrongly reported as aligned). Vertically the dot's `top:22px` centre (26.5) matches the year's first line box (`line-height:22.95px` / 2 + 15px `li` padding = 26.475). Browser-measured: horizontal drift 0, vertical 0.025px. Years wrap instead of ellipsing (the year is the entry's key), and the dot stays aligned with the first line. Touching `--tl-axis`, `top`, the year `line-height`, or the `li` padding without recomputing the other side breaks it silently. The **3D rise** (`.tl-3d` + `IntersectionObserver`) adds `opacity:0` *before* the observer runs, so it must stay gated on three things, each a real failure mode: `IntersectionObserver` existing, `matchMedia` not reporting `prefers-reduced-motion: reduce`, and a `root` of the scroll container. Remove any guard and the timeline becomes permanently invisible rather than unanimated. `display:none` panes re-fire intersection events on becoming visible, so switching chapters reveals them without extra bookkeeping — but that only holds because the observer is never disconnected.

Each chapter is a `role="tabpanel"` shown one at a time, driven by a `role="tablist"` pager. Deliberately not a continuous scroll: five chapters total roughly twenty thousand characters, and one long scroll loses the reader's position while making a single chapter impossible to cite or screenshot.

Maps are generated, not traced: a `map` block carries `{ projection: { lat0, lon0, scale }, shapes, labels, links }` in real lon/lat, and `makeProjector()` does the rest. Longitude is scaled by `cos(lat)` per point rather than once per image — Taiwan spans 3.4° of latitude, so a single `cos(lat0)` visibly widens the north. Outline points must run clockwise and close; a different order self-intersects. The viewBox is derived from the bounding box, so coordinates are the only thing to edit. Portrait maps (islands, `height > width * 1.2`) must not get `flex-grow` or they render squashed. The generated outlines get a hand-drawn treatment (seeded per-point wobble + Catmull-Rom → cubic Bézier, same technique as the menu panel's `china-map-geometry.ts`) plus an `feTurbulence` brush filter; the stroke jitter runs once at load, so StrictMode-style double-render concerns do not apply. `renderMap` mints unique SVG gradient/filter ids per call (`mland-m1`, `brush-m1`, …) — two maps share the page, so hard-coded ids would collide and the second map would paint with the first one's gradient.

**Map label font size is derived from the render scale, not written in user units.** This is the one thing in `renderMap` that looks wrong but is not: `font-size` in an SVG scales with the viewBox, and the two maps render at very different scales (the strait map is ~1000×1500 user units squeezed into the same 440px column as the ~600×900 island map). A hard-coded `font-size="13"` therefore lands at **13 screen px on the island map and 3.7px on the strait map** — measured, not guessed. `labelFontSize()` divides a target pixel size by the estimated scale, where the estimate comes from `PORTRAIT_MAX_PX` / `WIDE_FILL_PX`. Those two constants are **coupled to CSS**: `PORTRAIT_MAX_PX` must equal the `max-height` cap in `.fig.is-portrait svg`. Change one without the other and labels silently shrink or overflow. Two consequences worth keeping: label extents must be folded into the viewBox bbox (`textExtent()` estimates CJK at 1em and ASCII at 0.55em, two-pass so orientation is decided from geometry before the extents widen the box), otherwise edge-anchored labels like 「东海」 get clipped; and the halo stroke width is expressed as a fraction of the font size, because a fixed halo turns to mush on small text and disappears on large text.

Verified only in a browser. jsdom reports no geometry, so both failure modes — 3.7px labels and a clipped 「东海」 — pass the suite green. The `resource.test.ts` guards cover structural mistakes (image `src` exists, art `id` is in `ART_SVG`), not rendered size.

`art` blocks are decorative code-drawn 水墨 registered in `ART_SVG` by id (`spine`); there is no image generation available offline, so the page draws its own. `renderArt` replaces `{{}}` with `art-<id>` before emitting, so gradient and filter ids stay unique per artwork for the same reason map ids do — hard-coded ids would make the second painting inherit the first's gradient. Three devices are what separate 水墨 from a flat vector fill, and all three are load-bearing: **墨分五色** (each range has its own vertical gradient, light at the ridge and denser at the base, because ink settles downward), **留白** (mist is a blurred paper-coloured band *painted over* the 皴 strokes, so the cloud sits in front of the mountain — reversing the order turns the mist into white bars lying on the peaks), and **皴笔** (short ink strokes on the lit faces for stone texture). Depth is carried by ink value alone — far range pale, main ridge dark — not by introducing a second hue.

`image` blocks embed real scans and photographs: `{ src, w, h, orientation?, alt, credit, sourceUrl?, note? }`. The `src` points at `public/taiwan/*.jpg` (stable filenames, served from the site root like `/heritage/*.jpg`). All ten current images come from Wikimedia Commons — public domain, except the John Thomson photographs (Wellcome Collection scans, CC BY 4.0), which require the credit line. Keep the credit and `sourceUrl` on every image; encode non-ASCII `sourceUrl`s as percent-encoded ASCII, because `resource.test.ts` rejects common Traditional-character forms in the payload and the Commons titles contain them. `resource.test.ts` also asserts every image `src` exists under `public/`, so a renamed file fails the suite instead of shipping a dead link. `w`/`h` must match the shipped file's pixel dimensions — they feed the `<img>` attributes that reserve layout space before load.

This is intentionally **not** a shared abstraction, because exactly one resource uses it. Extracting it now would be speculative generality. Revisit only when a second resource needs the same block types — at that point pull the renderer into `resources/html/_shared/` and have each HTML `<link>` or inline it. Do not extract at one consumer.

Two content conventions are worth knowing before editing:

- `renderInline()` escapes all HTML first, then re-enables only `<b>` and `<T t='tooltip'>term</T>`. Any other tag in the JSON renders as visible text. `renderTerm()` receives its arguments from a wrapper closure — `String.replace` passes the whole match as the first argument, so passing `renderTerm` directly would swap the tooltip text and the term.
- `<T>` renders as a `<button class="term">`, so it works on hover (desktop), focus (keyboard), and click (touch). Below 960px the tooltip becomes a fixed bottom sheet via CSS; do not make it an in-flow block, since that splits the paragraph's line box.
- Contested figures (2/28 casualty counts, comfort-women numbers, White Terror case counts) are written as ranges with the dispute stated inline, plus a disclaimer in the page footer. Verifiable primary sources — treaty text, statutes, official resolutions, apology statements — are named explicitly with their dates. Keep that pattern if the numbers are updated; do not collapse a range into a single number to look authoritative.
- `blocks[].sources` renders as a 「资料出处」 block under the module. Attach it to any block making a factual claim about casualties, statistics, or legal status.
- The page is Simplified Chinese throughout. `resource.test.ts` asserts that common Traditional forms do not appear in the built payload.

## Directory Map

| Path | Purpose |
| --- | --- |
| `src/components/layout/` | Shared layout, the header mega menu, and its hand-drawn map |
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
- Do verify visual changes in a real browser. jsdom parses markup but never resolves CSS, so a broken declaration or a stacking mistake ships green through `pnpm test`.
- Do preserve existing user or generated changes in the worktree.
- Do run the full quality gate before finishing.
- Do update tests when behavior changes.
- Don't revert unrelated changes.
- Don't introduce a new styling system.
- Don't disable Biome rules globally.
- Don't commit `dist/`, `coverage/`, or `node_modules/`.
