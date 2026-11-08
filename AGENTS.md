# AGENTS.md

Guidance for AI coding agents and humans working in this repository. Keep changes focused, reviewable, and ready to ship.

## Project Overview

This repository is **中国古代全览**, a React 19 + TypeScript single-page app for exploring Chinese ancient history through:

- a water-ink styled home page with a scroll entrance animation that replays at most once per 7 days (localStorage timestamp),
- a Three.js-powered 3D chronology at `/china/timeline`,
- a dynasty policy atlas at `/china/policies`,
- one unified 疆域与民族图谱 explorer at `/china/atlas` (top mega-menu entry: 历史地理 / 图谱总览) with `/china/atlas/*` as preset-layer entry points (all render the same `AtlasExplorer` with a persistent SVG),
- resource-driven preview entries for future topics (home splits them into 已开放 cards and a compact 筹备中 row — preview entries must not render as clickable cards),
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
- The home scroll entrance is a **cross-window, 7-day** experience gate: `src/lib/home-entrance-storage.ts` stores a millisecond timestamp in `localStorage` (`home-entrance-scroll-shown`); once shown, the animation is suppressed for 7 days (exact boundary counts as expired).
- Accent color state is initialized in `RootLayout` so Header, home, 404, and other routes can react consistently.

Home entrance ownership: the gate lives in **`RootLayout`**, not `HomePage`. `RootLayout` decides whether the entrance plays (route is `/` and no fresh 7-day mark), mounts `HomeEntranceAnimation` so the overlay covers the very first paint (the lazy-loaded `HomePage` would otherwise let the header flash before the overlay appears), hides the header and the accent picker (`invisible opacity-0 pointer-events-none`) while it plays, and reveals both on completion. `HomePage` only consumes `homeEntered` from the `Outlet` context (`HomeOutletContext`). The timestamp is written as soon as the entrance starts ("mark at mount" semantics carried over from the old sessionStorage flow), so refreshing or leaving mid-animation never replays it within the window. Two implementation traps worth keeping: the route-change re-evaluation must be guarded by a `prevIsHomeRef` (StrictMode re-runs the layout effect, and re-reading storage there would see the just-written mark and skip the in-flight animation in dev), and it must be a `useLayoutEffect` so navigating to home never paints one frame with the header visible.

## Routing

Routes are centralized in `src/routes.tsx`.

Current public routes:

| Path | Purpose |
| --- | --- |
| `/` | Home page |
| `/china` | Redirect to `/china/timeline` |
| `/china/timeline` | 3D chronology / 时间长河 |
| `/china/policies` | Dynasty policy atlas / 政策全览 |
| `/china/atlas` | Unified atlas / 图谱总览（一张常驻底图，页内切换全部 / 单项不重挂载地图） |
| `/china/atlas/territory` | 疆域变迁预设图层（时间轴 + 真实底图快照节点） |
| `/china/atlas/migration` | 民族迁徙预设图层（真实底图迁徙路线图） |
| `/china/atlas/frontier` | 边疆治理预设图层（真实底图治所地图） |
| `/china/institutions` | Institutions index / 典章制度索引 (官制、赋役、律令、科举、礼制 reserved entries, all 筹备中) |
| `/<html-resource-slug>` | Generated from `resources/html/*.html` with kebab-case slugs |
| `*` | 404 fallback page |

Route-level layout options live in `src/route-layout-config.ts`.

`/china/institutions` is the hub for five topic pages (官制/赋役/律令/科举/礼制). Topic data lives one file per topic in `src/pages/ancient/china-institutions/topics/` (`InstitutionTopic`: intro + chronological `eras` + `keyTerms`), registered in `topics/index.ts` (`INSTITUTION_TOPICS`); `topic-page.tsx` is the shared renderer for all five — one layout, five datasets, so new entries are data + a registry line + a route in `routes.tsx` (explicit paths, `topicId` string prop, no data imports in the routing table — the registry stays inside the lazy chunk). The index page renders the full five-topic lineup from a local `TOPIC_LINEUP` and flips each card to a link only when the slug is registered, so an unimplemented entry keeps its 筹备中 placeholder instead of a dead link. `topics.test.ts` guards data invariants (kebab-case unique slugs, era counts, point/term shapes) and automatically covers newly registered topics. Home card is `status: "available"` with a path; `page-resources.test.ts` enforces that all `preview` home entries have no path, so an enterable page must be `available`.

The migration atlas page (`src/pages/ancient/china-atlas/migration-*.ts(x)`) renders its routes on the real-border basemap imported with `?raw` from `resources/html-data/liberation-war.json` — the same shared basemap the 丝绸之路 and 解放战争 pages use. Importing (not copying) keeps one source of truth; Vite dedupes the raw payload into the existing liberation-war chunk. The Lambert projection formula in `migration-projection.ts` is verified against the basemap's own city anchors (`CITIES.ll` → `x/y`) in `migration-projection.test.ts`; if the basemap projection ever changes, that test fails loudly.

The three atlas topics are consolidated into one `AtlasExplorer` page (`atlas-explorer.tsx`), sharing `atlas-shell.tsx` (pinned header, left sidebar with an in-page 图谱导航 switcher, page menu below) and `basemap-layers.tsx` (identical basemap styling). The top mega menu group is `历史地理` with a single `历史地理图谱` entry; the in-page 图谱导航 holds only the 朝代断面 chips (全部朝代 / 汉 / 唐 / 宋 / 元). The side menu is one flat accordion: `全部图谱` / `疆域变迁` / `民族迁徙` / `边疆治理` are four section headers (aria-expanded, one open at a time), each section holding its own data grouped by dynasty. Item rows are single-line names with no right-side type tags; the selected row is vermillion-highlighted. Switching a dynasty overlays a clearly-labelled **schematic** territory extent (outset from the convex hull of documented capitals/cities, never a measured boundary) plus capital / major-city symbols and names; `dynasty-territories.ts` owns the sourced city list, `dynasty-overlay.ts` owns the hull/support-function outset/hand-drawn path/label de-confliction, and `dynasty-territory-layer.tsx` renders it over the unmodified modern-basemap layers. The outline is deliberately organic, not GIS-stiff: the hull is inflated by a support-function offset (`HULL_MARGIN`), given a seeded two-harmonic wobble keyed by dynasty id, and closed with Catmull-Rom → cubic Bézier (`smoothClosedPath`); a blurred under-stroke plus a keyed fade-in (`atlas-dynasty-enter`, remounts on dynasty change) keep the appearance soft. Frontier entries carry a sourced `defenseScope` field and get a uniform dashed schematic ring (`DEFENSE_RADIUS` is a legend symbol, never a measured boundary). Migration uses a brighter fixed 朱色 (`ATLAS_TOPIC_COLOR.migration`), territory uses the accent vermillion, frontier uses ochre. The top strip is always the same fixed-height 疆域断面 timeline — there is no 图层说明 strip — so switching layers never shifts the map. `atlas-items.ts` flattens the three datasets into 22 entries and computes a **fixed** `ATLAS_VIEW` plus a frozen `ATLAS_LABELS` layout; `placeLabels()` is a pure deterministic de-confliction pass that keeps label boxes off each other and off other markers, using leader lines to move crowded labels to open space. `atlas-map.tsx` is a single persistent SVG — switching 全部 / 单项 only changes its children, never the viewBox, label positions, SVG DOM node or surrounding fixed-height panels, so the map cannot jump. Focusing (selecting an item, or switching a dynasty) replaces the viewBox via `atlas-focus.ts` — **never** a CSS transform on a `<g>`, whose transform-origin is not equivalent to SVG user coordinates and pushes the focus off-centre. The focus viewBox keeps the map container's measured aspect ratio (ResizeObserver inside `useMapView`, jsdom falls back to `ATLAS_VIEW`), so `xMidYMid meet` fills the visible area with no letterbox and the focus centre is exactly the viewport centre. All symbol sizes, label boxes and font sizes are compensated by `1/sqrt(zoom)`; `placeLabels()` runs against the **target** view (not the animated frame) so label layout never re-flows during transitions; basemap graticule / river / sea text is dimmed past zoom 1.08 via the `.atlas-notes` CSS-opacity transition. A fixed-size HTML card inside the map frame (outside the SVG) carries dynasty, capital, cities, zoom factor and a reset button — it never scales. Selecting any item also pins its dynasty, so the overlay and the item always agree; switching a topic or using overview clears both. Hover / keyboard focus expands the item's verbatim description and sources in a fixed-height detail card (no floating overlay over the map); do not add unsourced historical claims. Menu entries are deliberately single-line and compact so the whole menu fits the viewport without internal scrolling; keep that property when adding entries. Layout-wise the shell is `lg:h-full` inside the `<main>` scroll container with an internally scrolling map column — `h-full` resolves because `<main>` is a definite-height flex item; jsdom cannot verify any of this, so check a real browser when touching it. Animations default on everywhere; the page-level toggle is the single playback control.

The map is also directly navigable, beyond selection-driven focus. `map-view.ts` owns the view state machine (`useMapView`) and `map-stage.tsx` renders the frame around `AtlasMap` — owning it in a child component keeps the per-frame re-renders of the tween out of the page header, menu and detail card; `BasemapLayers` is memoized for the same reason. Rules worth keeping:

- There are two views: the **target** (`AtlasFocus` from `atlas-focus.ts`, drives label placement and semantics) and the **live view** (the animated frame, drives `viewBox` / `data-zoom` / size compensation). Target changes tween the live view with an ease-in-out rAF loop (`VIEW_TWEEN_MS`); wheel zoom and drag pan bypass the tween entirely — direct manipulation must not lag. Pinch (two pointers) zooms around the finger midpoint.
- The tween and gestures are two ways to move the same state, so they compose: a gesture cancels the in-flight tween, a new target tweens from the current gesture position. Zooming back out to 1× re-aligns exactly with the overview viewBox; panning is clamped to the overview rect with a slack that shrinks to zero at 1× (dragging the overview does nothing — the whole map already fits).
- Wheel zoom is anchored at the cursor via the `xMidYMid meet` inverse (letterbox-aware); React's wheel listener is passive, so the hook attaches its own non-passive listener. Pointer capture is only taken **after** the 4px drag threshold, so clicks on labels and buttons are unaffected. Double-click zooms unless the target is a button/label.
- Zoom is clamped to `[1, MAP_ZOOM_MAX=5]` relative to `ATLAS_VIEW.height`; symbol sizes compensate continuously with `1/sqrt(max(1, zoom))`.
- Tests: `setViewTweenMs(0)` (exported from `map-view.ts`) makes target changes apply synchronously — the exact-viewBox assertions in `atlas-explorer.test.tsx` and the three page tests depend on it. `map-stage.test.tsx` mocks the frame's `getBoundingClientRect` and uses fake rAF wrapped in `act()`; `vi.advanceTimersByTime` outside `act()` silently loses the React updates. jsdom has no ResizeObserver and zero-size rects, so gestures there are pure-math tests.

Current HTML resource slugs: `/ancient-china` (legacy, hidden from home), `/intangible-culture-heritage`, `/silk-road`, `/taiwan`, `/liberation-war`.

The site's stated scope is 中国古代, but the HTML resources are not all 中国古代 material. 非遗 and 丝绸之路 are cultural-history topics that fit the frame. Three deliberate exceptions: `/taiwan` (geography plus modern history, 1895–1945 日治五十年), `/liberation-war` (解放战争 1946–1951 3D sand-table: per-battle attack/defence lines, encirclement rings, breakthrough points and uprising/peaceful-liberation deployments on a height-mapped terrain, with a playable/scrubbable 1946–1951 timeline; built on the same real-borders / province-shape basemap as 丝绸之路 — note its base shapes and the `PROVINCES` outline are shared constants in `resources/html-data/liberation-war.json` extracted from `resources/html-data/silk-road.json`; keep them in sync if the basemap data changes. 海南岛战役 completes in 1950-05, 台湾 is marked as planned-but-not-executed; 新疆 1949-09 和平起义 / 1950-03 完成进驻、西藏 1951《十七条协议》后和平解放 are now in frame as 第五阶段 · 边疆归一 — before 1951-05-23 西藏 is a grey `fringe` province, then flips to CCP via a `CONTROL` entry), and the legacy 朝代浮岛 page (hidden from home). When adding a resource, decide explicitly whether it fits the 中国古代 frame. If it does not, either widen the framing in `README.md` / `index.html` metadata, or keep the resource but document the exception here — do not silently expand the site's meaning through a single page.

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
### Liberation war 3D sand table (`resources/html/liberation-war.html`)

The page is a canvas-rendered 3D "沙盘" (the old SVG engine was replaced): a heightfield built from `TERRAIN` (plateau/basin polygons + ridge polylines referenced to `MOUNTAINS`) is shaded per-quad on a bottom canvas; military symbols, battle markers and screen-space labels are drawn on a top canvas. Data model in `resources/html-data/liberation-war.json`:

- `STAGES[i].battles[]` carry `t0`/`t1` (ISO dates), `kind` (`attack`/`defense`/`planned`/`peace`), `pri` (解放进程重要性权重，用于同时段多役并进时选「主视角」镜头/字幕), `phases` (dated narration) and `ops` — per-battle military elements: `atk` (CCP arrows), `kmt` (KMT arrows/reliefs), `def` (tick-marked defence lines), `enc` (dashed encirclement rings, `double`/`peace` variants), `ret` (open-head retreat arrows), `brk` (breakthrough/crossing points). Arrow geometry is authored in lon/lat and pre-projected to map units (Albers local affine fit); it is illustrative, not precise march lines. `META.units` / `META.sources` / `META.corrections` are rendered by `buildUnitsPanel()` in the left menu — the provenance for every 野战军 rename (1948-11-01 统一番号规定、1949-01-15 按序数改称、1949-02/03 实际启用差异).
- `CONTROL` (province → flip date) drives continuous province colouring; `CITY_FLIPS`, `EVENTS` (scrubber ticks), `TIMELINE` (1946-06-26 → 1951-10-31, 5 stages / 55 battles). Dates are handled with a monotonic ordinal (`y*372 + m*31 + d`), not real day counts — keep both conversion directions consistent. `fringe` provinces are excluded from `countedProvinces(t)` until their flip date, so 西藏 is neither 解放区 nor 国统区 before 1951-05-23.
- The main loop uses `requestAnimationFrame` with a 40 ms `setInterval` fallback, because the site renders this page in an `iframe srcDoc` whose rAF can be throttled/paused when the pane is backgrounded (the old page hit the same trap — see the `nextPaint` comment in `taiwan.html`). Keep the fallback; a rAF-only loop dead-locks the intro tween and playback in background tabs.
- All element sizes are continuous functions of zoom (no discrete zoom levels, no overshoot easing, no per-state element re-creation): the old "elements grow for no reason" symptom came from a re-created SVG marker set replaying a bouncy `scale(.25→1)` entrance animation on every stage switch.
- `PROVINCES`/`WORLD_PATH`/`CHINA_BORDER`/`ISLANDS_PATH`/`NINE_DASH` stay byte-compatible with `silk-road.json` (shared constants); extend new features as *new* top-level keys, never by mutating the shared geometry.
- Other data keys, added in the v3 revision: `RAILWAYS` (14 条 1946–1950 通车的历史铁路, pre-projected `d` paths; the generator verified the Albers formula `x = off + K·ρ·sinθ`, `y = off + K·(ρ·cosθ − ρ0)` with `K = R·scale/1000/n` and `ρ = √(C−2n·sinφ)` against all 15 `CITIES` — reuse that formula, not a library, when adding ll-sourced geometry), `RIVERS` additions (辽河/松花江/汉江), `MANPOWER` (全军兵力锚点，万人，两点线性内插), and per-battle `forces` (编制/指挥/兵力，军史通行数字，存疑用「约」) + `balance` (兵力对比短句) rendered in the tooltip and the battle detail card. 南海诸岛 is deliberately NOT drawn — no inset map; the `.map-footnote` bar under the canvas is the required annotation.
- The camera is constrained, not free-orbiting: `YAW_LIMIT` (±0.45 rad), `PITCH_MIN/MAX`, `ZOOM_MIN/MAX` (0.65–8×), and `clampCam()` keeps the map centre inside the VIEW box so the sand-table can never be spun 360° or dragged off-map. `battleView()` uses a tighter bounding box and a 2.0–4.4× auto-focus zoom so a single battle fills more of the canvas; playback is 8 days/second at 1× (0.25×/0.5×/1×/2× chips). The wheel zoom anchors on the cursor via `camCenterForScreen()` — an **exact** perspective inverse of the z=0 ground plane; the naive affine `unprojectGround` (which the old code used) leaves hundreds-of-km drift because `persp()` is non-linear. `unprojectGround` itself is now perspective-correct; don't regress it.
- Canvas sizing must survive the srcDoc-iframe boot race: the iframe can still be ~300px wide when `boot()` measures it, and inside a sandboxed srcDoc iframe `ResizeObserver` may never fire (verified: a fresh observer on the live element reports 0 callbacks). The guard is `canvasSizeMismatch()` called from the main loop, `renderDynamic()`, a 600 ms interval, plus `load`/rAF/300 ms one-shots. Keep all of them; removing any one re-opens the "whole map squeezed into a small canvas" failure.
- Military symbols: `drawSolidArrow` renders the classic tapered-shaft barbed operation arrow (screen-space widths scale mildly with zoom), retreat stays a dashed open-head line, and battle markers are crossed-rifle glyphs (`drawCrossedRifles`) on faction-coloured discs (squares for 防御, dashed for 未竟, ★ for 和平解放). The rifle glyph must stay ≤ ~0.8× the disc radius or it turns the marker into a white blob.
- Battle/situation navigation lives **in the right side panel** (`.side-panel` beside `.map-box`): the 战役/态势 tab list (`.map-float` — the fold button and `lw-mapfloat-folded` persistence were removed when it moved here) now sits on top, then the battle detail (`.sp-detail`) which flex-fills the remaining height. The 时间轴+播放控制 (`.sp-time`) block was moved **out of the right panel into the left menu** (`.left-panel`) on later feedback: it sits between the stage list (`.stage-timeline`) and 当前态势 (`.panel-live`). At the left column's 256px content width the control rows wrap to 4–5 lines; `.left-panel .sp-time` carries a few narrow-width overrides (`.speed-chip`/`.tool-btn`/`.zoom-slider`/`.auto-btn`/`.reset-btn`) and drops its solid bottom border so it does not double up with `.panel-live`'s dashed top border. The list area (`.mf-body`) caps at `min(32vh, 280px)`; the panel stretches to exactly the map container's height. The ongoing (or user-selected) battle auto-scrolls into the list view on change — **use `scrollIntoView({ behavior: "auto" })`, never `smooth`**: smooth programmatic scrolling is driven by the same animation clock that gets frozen in embedded browsers (observed: smooth scrollIntoView silently no-ops there). `renderStageContent`, `selectBattle` and `snapUi` all target `#mfBattles`, keep those selectors in sync if the panel is restructured.
- The battle detail lives in the same **normal-flow right panel** (not an overlay, not below the map). It stays open across stage changes; while `playing`, `selectBattle` only refreshes the detail — no `tweenT`, no `focusBattle`, no pause. When nothing is selected, `#spHint` shows instead of the empty detail card (`infoCard.hidden` toggling is gone).
- There is **no stage heading above the map**: `.content-head` was removed; stage name/time/intent live only in the left chapter menu. `renderStageContent()` must not recreate it.
- The sidebar's bottom row now has **two entries** — 番号沿革 / 标图口径 (`.rail-actions`). The 军事图例 entry was removed on feedback and replaced by an **always-visible inline legend**: the legend content now lives in `.pl-legend` under「当前态势」(`.panel-live`), occupying the former「进行中战役」slot (`.pl-battle` and its JS are gone — the 进行中战役 readout is no longer in the menu). `.pl-legend-body` is a full-width **two-column compact grid** (`grid-template-columns: 1fr 1fr`, `max-height: 168px` with internal scroll fallback; the 底图与控制区 group drops to a full-width row via `:nth-child(n+3)` + `.lg-note` spanning `1 / -1`). The old legend popover machinery (`.lg-body`/`.rail-body` for the legend, `legendOpenBtn`/`legendCloseBtn`, auto float/retract on playback) is removed from the DOM; `setLegendOpen()`/`autoShowLegend()` now early-return when `railLegend`/`legendOpenBtn` are null and act as no-op guards, so the pre-existing call sites (startPlay / scrubbing / Escape / mutual-exclusion in the 番号·口径 handlers) are untouched. The 番号沿革 / 标图口径 entries keep the old behavior: click toggles, only one popover open at a time, Escape closes. Their bodies (`.rail-body` / `.rail-info-pop`) are **absolute popovers** anchored above the *row*: inside `.rail-actions` the `.rail-section`/`.rail-info` wrappers must stay `position: static` so the nearest positioned ancestor is the row — otherwise each popover shrinks to its button's width. Do not add another `max-height`/`overflow` rule on `.units-body` (it would override the `.rail-body` limit and stretch the card over the whole sidebar). The stage menu itself does **not** scroll (`overflow: visible`, `flex-shrink: 0`); `.left-panel` keeps `overflow-y: auto` only as the short-screen fallback — zero-height `.rail-body` popovers are what make that possible. `refreshUiBlocks()` only tracks `mapFloat` and `mapScale`.
- The map column fills the viewport: `.viewer-row` has `min-height: calc(100vh - 28px)` (the right panel's 14px top + bottom padding — the floating bottom dock was **removed** on feedback; time/playback then moved into the side panel, and later into the left menu as `.sp-time`) and `.map-canvas` is `flex: 1 1 auto` inside a flex-column `.map-box` — there is **no** `aspect-ratio` on the canvas anymore. The `展开侧栏` handle (`.rail-open`) must keep `display: none` as its base state (shown only via `body.rail-collapsed .rail-open`); the button-icon alignment group rule later in the stylesheet uses the same specificity, so adding `.rail-open` to that selector list silently re-shows the handle — that was a real bug once. The compass needle (`.map-north svg`) rotates by `+cam.yaw` (clockwise-positive), synced in `onCameraChanged()`; the sign is derived from `project()` (screen-space north = `(sin yaw, −cos yaw)`), not hand-tuned.
- `buildUnitsPanel()` renders `META.units` as a date/text grid, `META.corrections` as a bullet list, and `META.sources` as **separate numbered link cards** (`.src-list`: index + name + host + ↗); the full URL is only in `title`/`aria-label`. Never inline raw URLs into the prose.
- Drag direction is inverted relative to naive intuition: `screen_y = Hc/2 + (y − cam.cy)·Cp·S`, so dragging **down** must **decrease** `cam.cy` (and `cam.pitch`); horizontal drag decreases `cam.cx`. Keep both minus signs in the `pointermove` handler.
- The time block must not jitter as time advances: `.pd-top` uses fixed slots for date/chapter/focus-bar (ellipsis + tabular numerals), and the focus bar occupies its own full-width row (`flex: 1 1 100%`) inside `.sp-time` so appearing/disappearing never reflows the date row. Focus bar toggles via `visibility` rather than `display`, `setText()` skips identical DOM writes, `tick-flash` is disabled while playing, `syncFocusZoom()` is throttled to 120 ms, `maybeAutoFocus()` queues pending focuses behind `AUTO_FOCUS_MIN_GAP`/`camTween`, and `.map-scale` has a fixed 176px outer width.
- Labels and annotations must never be silently dropped: `layoutAndDrawLabels()` and `drawMilitaryAnnotations()` try close candidates first, then two rings of 8 far candidates (leader line connects back to the anchor), and as a last resort place at the **minimum-overlap** candidate (`overlapArea()`) — a label that fits nowhere still renders. If you touch the placement loops, keep that guarantee; dropping a label on collision was the original「内容被遮蔽」complaint. Rivers render as a **band polygon** (offset normals + along-path taper 0.55×→1.15× + mouth flare, two flow lines, bank strokes; all 9 `RIVERS` paths run source→mouth so the taper direction is fixed), and mountain glyphs get a two-tone silhouette fill (lit NW / shaded SE) under the ridge strokes — keep both if you rework the terrain art.

### The header mega menu

The header has a single trigger (「全览地图」) that opens a **hover mega dropdown** anchored under the navigation bar (modeled on the Claude.ai nav): category columns side by side (four at present), each listing its entries by name only (no subtitle, no visible path; long names truncate to one line), plus a decorative hand-drawn China map strip on the right edge. Files:

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
- All columns are rendered at once (the old full-screen panel swapped one tabpanel). Tests can therefore assert every destination in a single pass.
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
- Do not assert that the home entrance overlay is still mounted from a test that renders `/`. GSAP's `rAF` ticker unmounts it once the timeline reaches `onComplete` (~2.5s + a 1s hold), so `findByRole` races the real clock and fails intermittently on a loaded machine. Assert the localStorage timestamp write instead (`HOME_ENTRANCE_STORAGE_KEY` in `src/lib/home-entrance-storage.ts`); `home-entrance-animation.test.tsx` covers the overlay itself with controllable timing, and `root-layout.test.tsx` mocks it with a completion button to test the gate deterministically.
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
| `src/pages/ancient/china-institutions/` | Institutions index page (五类预留条目的索引页) |
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
