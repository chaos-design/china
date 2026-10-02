# Contributing Guide

Thanks for your interest in contributing! This document explains how to set up
the project, the conventions we follow, and how to submit changes.

## Prerequisites

- **Node.js** >= 20.19.0 (Node 22 LTS recommended — this is what CI uses)
- **pnpm** 10.18.1, pinned via `packageManager`. `corepack enable` is the easiest way to get it.

## Getting started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The dev server runs at http://localhost:5173 and serves history fallback, so deep links like
`/china/policies` work without extra configuration.

## Project structure

```
src/
├── components/      # App-specific components and entrance animation
│   ├── layout/      # Shared layout and navigation
│   └── ui/          # shadcn/ui primitives
├── hooks/           # Reusable React hooks (unit-tested)
├── lib/             # Framework-agnostic utilities
├── pages/           # Route-level pages (home, timeline, policies, html resources)
├── styles/          # Global Tailwind CSS + design tokens
├── routes.tsx       # Central route table
├── App.tsx          # Root component
└── main.tsx         # Application entry point

resources/
├── html/            # HTML topic resources that become generated routes
├── html-data/       # Optional JSON payloads inlined into HTML resources
└── html-resource/   # PageResourceConfig metadata for each HTML resource

scripts/             # Build-time Babel plugins
```

## Available scripts

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `pnpm dev`            | Start the Vite dev server                    |
| `pnpm build`          | Type-check and build for production          |
| `pnpm preview`        | Preview the production build locally         |
| `pnpm lint`           | Run Biome checks (lint + format)             |
| `pnpm lint:fix`       | Auto-fix lint/format issues                  |
| `pnpm format`         | Format with Biome                            |
| `pnpm typecheck`      | Run the TypeScript compiler (no emit)        |
| `pnpm test`           | Run unit tests once                          |
| `pnpm test:watch`     | Run unit tests in watch mode                 |
| `pnpm test:coverage`  | Run unit tests with a coverage report        |

Note that `testTimeout` is widened to 20s in `vite.config.ts` because the policy and
timeline pages render data-dense DOM trees under jsdom, and the policy atlas test file
raises it further to 45s since each of its cases renders ~385 cards.

Coverage floors are enforced by Vitest: statements 93, lines 94, functions 90, branches 80.
Falling below any of them fails `pnpm test:coverage`, and therefore CI. Branches sit lower
than the rest because the uncovered remainder is mostly environment guards and defensive
fallbacks for data fields that are always present in the current datasets.

## Coding conventions

- **Language**: TypeScript everywhere.
- **File names**: lowercase, hyphen-separated (e.g. `use-counter.ts`).
- **Function names**: lowerCamelCase (e.g. `useCounter`, `cn`).
- **Styling**: Prefer Tailwind utilities and shadcn/ui components. Use Emotion
  (`@emotion/styled`) only for dynamic, one-off styles that are awkward in Tailwind.
- **Formatting & linting**: Biome is the single source of truth. Run
  `pnpm lint:fix` before committing — CI enforces zero warnings/errors.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user profile card
fix: clamp counter at upper bound
docs: update deployment steps
chore: bump dependencies
```

## Submitting a pull request

1. Fork the repo and create your branch from `main`.
2. Make your changes and add tests where appropriate.
3. Ensure all checks pass locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage && pnpm build
   ```
4. Open a pull request and fill out the PR template.

CI will run lint, type-check, tests, and build on every pull request.

## Deployment

Production deploys go to Vercel and are driven entirely by `vercel.json` — the dashboard
needs no manual build-command or output-directory configuration.

```bash
npx vercel          # preview deployment
npx vercel --prod   # production deployment
npx vercel dev      # local dev against the real vercel.json
```

If you touch build output settings, `vercel.json`, or dependency versions, update the
deployment section of `README.md` in the same pull request. Vercel installs with
`pnpm install --frozen-lockfile`, so `pnpm-lock.yaml` must be committed alongside any
`package.json` change or the build will fail.

## Reporting bugs & requesting features

Please use the [issue templates](.github/ISSUE_TEMPLATE) when opening a new issue.
