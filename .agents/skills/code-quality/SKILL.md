---
name: "code-quality"
description: "Use when linting, formatting, or ensuring code quality in this project. Triggers: running Biome, fixing lint errors, formatting code, setting up pre-commit hooks, or when the user mentions linting, formatting, code quality, or Biome."
---

# Code Quality Skill

## Linter: Biome

All linting/formatting is handled by Biome. Config in `biome.json`.

### Essential Commands

```bash
pnpm lint           # Check for lint issues (must pass: zero warnings/errors)
pnpm lint:fix       # Auto-fix formatting and lint issues
```

### Pre-Task Checklist

Before considering any task done, **all** of these must pass:

```bash
pnpm lint           # Biome lint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest
pnpm build          # Production build
```

## Code Conventions

### Language
- TypeScript only — no `.js` source files in `src/`

### File naming
- Lowercase, hyphen-separated: `use-counter.ts`, `gradient-badge.tsx`

### Function names
- `lowerCamelCase`: `useCounter`, `cn`, `formatDate`
- React components: PascalCase identifiers in hyphen-cased files

### Imports
- Use relative paths for project-local imports under `src/`; do not use `@/`
- Biome's `organizeImports` keeps imports sorted

### Styling priority
1. Tailwind utility classes (preferred)
2. shadcn/ui components for common primitives
3. Emotion only for dynamic / one-off styles

## Do / Don't

- ✅ Fix lint issues directly in code
- ✅ Use `pnpm lint:fix` for auto-fixable issues
- ✅ Keep changes minimal and focused
- ✅ Add or update tests when changing logic
- ❌ Don't disable Biome rules globally
- ❌ Don't add `.js` files to `src/`
- ❌ Don't commit `dist/`, `coverage/`, or `node_modules/`

## Biome Configuration

Key settings in `biome.json`:
- `organizeImports`: enabled
- Formatting: sensible defaults (2-space indent, single quotes)
- Linting: recommended rules enabled

Run `pnpm lint:fix` before submitting changes.
