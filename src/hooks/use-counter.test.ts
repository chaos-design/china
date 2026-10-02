import { act, renderHook } from "@testing-library/react";

import { useCounter } from "./use-counter";

describe("useCounter", () => {
  it("starts from the provided initial value", () => {
    const { result } = renderHook(() => useCounter({ initialValue: 3 }));

    expect(result.current.count).toBe(3);
  });

  it("increments and decrements by the configured step", () => {
    const { result } = renderHook(() => useCounter({ initialValue: 4, step: 2 }));

    act(() => result.current.increment());
    expect(result.current.count).toBe(6);

    act(() => result.current.decrement());
    expect(result.current.count).toBe(4);
  });

  it("clamps values at the configured boundaries", () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5, min: 0, max: 10, step: 6 }));

    act(() => result.current.increment());
    expect(result.current.count).toBe(10);

    act(() => result.current.decrement());
    act(() => result.current.decrement());
    expect(result.current.count).toBe(0);
  });

  it("clamps initial and manually set values", () => {
    const { result } = renderHook(() => useCounter({ initialValue: -5, min: 0, max: 10 }));

    expect(result.current.count).toBe(0);

    act(() => result.current.set(99));
    expect(result.current.count).toBe(10);
  });

  it("resets to the clamped initial value", () => {
    const { result } = renderHook(() => useCounter({ initialValue: 12, min: 0, max: 10 }));

    act(() => result.current.set(4));
    expect(result.current.count).toBe(4);

    act(() => result.current.reset());
    expect(result.current.count).toBe(10);
  });
});
