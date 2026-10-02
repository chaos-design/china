---
name: "frontend-dev"
description: "Use when building, refactoring, or reviewing frontend code in this React project. Triggers: creating components, hooks, pages, routes, or layout; working with Tailwind CSS classes, shadcn/ui primitives, Emotion styles; modifying the route table, implementing responsive layouts, or any frontend development task."
---

# Frontend Development Skill

## Component Conventions

### File naming
- Lowercase, hyphen-separated: `gradient-badge.tsx`, `use-counter.ts`
- Test files co-located: `gradient-badge.test.tsx`

### Component structure
```tsx
import { memo } from 'react';
import { cn } from '../../lib/utils';

interface GradientBadgeProps {
  label: string;
  variant?: 'primary' | 'secondary';
}

export const GradientBadge = memo(({ label, variant = 'primary' }: GradientBadgeProps) => {
  return (
    <span className={cn(
      'px-3 py-1 rounded-full text-sm font-medium',
      variant === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800',
    )}>
      {label}
    </span>
  );
});

GradientBadge.displayName = 'GradientBadge';
```

### Component placement
| Type                         | Location                    |
| ---------------------------- | --------------------------- |
| shadcn/ui primitives         | `src/components/ui/`        |
| Layout components            | `src/components/layout/`    |
| App-specific components      | `src/components/`           |
| Route pages                  | `src/pages/`                |

## Tailwind CSS 4 Guidelines

- **Preferred**: Tailwind utility classes for all styling
- **Design tokens**: Defined in `src/styles/globals.css` under `@theme`
- **Class merging**: Always use `cn()` from `src/lib/utils.ts` via relative imports for dynamic classes
- **Dark mode**: Use `dark:` prefix; tokens from `@theme`

```tsx
// Good: using cn() for conditional classes
className={cn(
  'px-4 py-2 rounded-md',
  isActive && 'bg-blue-600 text-white',
  className,
)}

// Bad: manual string concatenation
className='px-4 py-2 rounded-md ' + (isActive ? 'bg-blue-600' : '')
```

## Emotion Usage

Use Emotion **only** for dynamic styles that Tailwind cannot handle:

```tsx
import { styled } from '@emotion/styled';

const AnimatedBox = styled.div`
  background: linear-gradient(${props => props.startColor}, ${props => props.endColor});
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;
```

## Routing

All routes are centralized in `src/routes.tsx`:

```tsx
import { RouteObject } from 'react-router-dom';

export const routes: RouteObject[] = [
  {
    path: '/',
    lazy: () => import('./pages/home'),
  },
  {
    path: '/about',
    lazy: () => import('./pages/about'),
  },
  {
    path: '*',
    lazy: () => import('./pages/not-found'),
  },
];
```

Use `lazy()` for code-splitting pages. Keep route definitions in the central file.

## Hooks

- File name: `use-<name>.ts` (e.g. `use-counter.ts`)
- Co-locate test: `use-counter.test.ts`
- Export named function, not default
- Use `renderHook` for testing

```tsx
import { useState, useCallback } from 'react';

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  return { count, increment, decrement };
}
```

## Imports

- Always use relative paths for project-local imports
- Biome's `organizeImports` runs on save
- Group: React/core → external → relative
