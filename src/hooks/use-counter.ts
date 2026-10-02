import { useCallback, useState } from "react";

export interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface UseCounterResult {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
}

export function useCounter(options: UseCounterOptions = {}): UseCounterResult {
  const {
    initialValue = 0,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    step = 1,
  } = options;

  const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [min, max]);

  const [count, setCount] = useState(() => clamp(initialValue));

  const increment = useCallback(() => setCount((current) => clamp(current + step)), [clamp, step]);

  const decrement = useCallback(() => setCount((current) => clamp(current - step)), [clamp, step]);

  const reset = useCallback(() => setCount(clamp(initialValue)), [clamp, initialValue]);

  const set = useCallback((value: number) => setCount(clamp(value)), [clamp]);

  return { count, increment, decrement, reset, set };
}
