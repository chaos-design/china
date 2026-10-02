---
name: "project-stack"
description: "Use when working with this React 19 + TypeScript + Vite project stack. Triggers: questions about the tech stack, setting up the project, understanding architecture decisions, adding new dependencies, configuring Vite/Tailwind/Emotion, or when the user mentions React 19, Vite, Tailwind CSS 4, shadcn/ui, Biome, or Vitest."
---

# Project Stack Skill

## Tech Stack Overview

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Runtime      | Node.js >= 20.19                        |
| Package mgr  | pnpm 10                                 |
| Frontend     | React 19, React Router 7                |
| Build        | Vite                                    |
| Language     | TypeScript 5.x                          |
| Styling      | Tailwind CSS 4 (CSS-first) + shadcn/ui  |
| CSS-in-JS    | Emotion (`@emotion/styled`, `jsxImportSource`) |
| Lint/Format  | Biome                                   |
| Tests        | Vitest + @testing-library/react         |
| Deploy       | Vercel                                  |

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui primitives (button.tsx, card.tsx, etc.)
│   ├── layout/      # Nav bar, Outlet wrapper
│   └──              # App-specific & CSS-in-JS components
├── pages/           # Route pages (home, about, not-found)
├── hooks/           # Reusable, unit-tested hooks
├── lib/             # Framework-agnostic utilities
├── styles/
│   └── globals.css  # Tailwind layers + @theme design tokens
├── routes.tsx       # Centralized React Router route table
└── main.tsx         # Entry point
```

## Key Configuration

- **Project imports**: Use relative paths for imports under `src/`; no `@/` alias is configured
- **Tailwind 4**: Config lives in `src/styles/globals.css` via `@theme`, not a JS config
- **Emotion JSX**: `jsxImportSource: "@emotion/react"` in `tsconfig.app.json`
- **Biome**: Config in `biome.json`; run `pnpm lint:fix` to auto-fix

## Essential Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server
pnpm lint           # Biome lint (must pass)
pnpm typecheck      # tsc --noEmit (must pass)
pnpm test           # Vitest (must pass)
pnpm build          # Production build (must succeed)
pnpm lint:fix       # Auto-fix lint/format issues
```

## Common Tasks

### Adding a new page

1. Create file in `src/pages/` (lowercase, hyphen-separated name)
2. Add route entry in `src/routes.tsx`
3. Add a test file: `src/pages/<name>.test.tsx`

### Adding a new component

1. Place in `src/components/` or `src/components/ui/` for reusable primitives
2. File name: lowercase hyphen-separated (e.g. `avatar-group.tsx`)
3. Use relative paths for imports from `src/`
4. Prefer Tailwind classes; use Emotion only for dynamic styles

### Adding a new hook

1. Create in `src/hooks/` (e.g. `use-window-size.ts`)
2. Write co-located test: `src/hooks/use-window-size.test.ts`
3. Use `renderHook` from `@testing-library/react` for testing

### Adding a new utility

1. Create in `src/lib/` (framework-agnostic)
2. Export from a single barrel file if many utilities
3. Write co-located test file
