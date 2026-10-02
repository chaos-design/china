---
name: "testing-guide"
description: "Use when writing, running, or debugging tests in this project. Triggers: creating test files, writing test cases, fixing test failures, adding test coverage, debugging Vitest or @testing-library tests, or when the user mentions testing, test coverage, unit tests, or integration tests."
---

# Testing Guide Skill

## Framework

- **Runner**: Vitest (globals enabled — no imports needed)
- **DOM**: @testing-library/react
- **Hooks**: renderHook from @testing-library/react
- **Setup**: `vitest.setup.ts`

## Test File Convention

- Co-locate with source: `use-counter.test.ts` next to `use-counter.ts`
- Extension: `.test.ts` or `.test.tsx`
- Use Vitest globals: `describe`, `it`, `expect` (no imports)

## Component Tests

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradientBadge } from './gradient-badge';

describe('GradientBadge', () => {
  it('renders the label', () => {
    render(<GradientBadge label="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    const { container } = render(<GradientBadge label="Test" variant="secondary" />);
    expect(container.firstChild).toHaveClass('bg-gray-100');
  });
});
```

## Hook Tests

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCounter } from './use-counter';

describe('useCounter', () => {
  it('starts at initial value', () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));
    result.current.increment();
    expect(result.current.count).toBe(1);
  });
});
```

## Coverage Requirements

- **Target**: > 90%
- Extract non-trivial logic into testable hooks/utils
- Cover: positive cases, negative cases, boundary conditions

## Running Tests

```bash
pnpm test           # Run all tests
pnpm test -- --watch  # Watch mode
pnpm test -- --coverage  # With coverage report
```

## Best Practices

1. **Test behavior, not implementation** — query by text/role, not by class name
2. **One assertion per test concept** — group related assertions in a single `it()`
3. **Arrange-Act-Assert** — structure test bodies clearly
4. **Mock external calls** — network, timers, random values
5. **Name tests clearly** — `it('displays error on invalid input')` not `it('works')`
