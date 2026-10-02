import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

import { ACCENTS, applyAccent, useAccent } from "./use-accent";

function getAccentVariable() {
  return document.documentElement.style.getPropertyValue("--vermillion");
}

describe("useAccent", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("--vermillion");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("--vermillion");
  });

  it("defaults to the first accent", () => {
    const { result } = renderHook(() => useAccent());

    expect(result.current.accent.id).toBe(ACCENTS[0].id);
    expect(result.current.accents).toHaveLength(ACCENTS.length);
  });

  it("applies the light HSL channels on mount", () => {
    renderHook(() => useAccent());

    expect(getAccentVariable()).toBe(ACCENTS[0].light);
  });

  it("changes the accent and persists it", () => {
    const { result } = renderHook(() => useAccent());

    act(() => result.current.setAccent("zhusha"));

    expect(result.current.accent.id).toBe("zhusha");
    expect(getAccentVariable()).toBe(ACCENTS[0].light);
    expect(localStorage.getItem("accent")).toBe("zhusha");
  });

  it("ignores an unknown accent id", () => {
    const { result } = renderHook(() => useAccent());

    act(() => result.current.setAccent("does-not-exist"));

    expect(result.current.accent.id).toBe(ACCENTS[0].id);
  });

  it("restores the stored accent on the next mount", () => {
    localStorage.setItem("accent", "shiqing");

    const { result } = renderHook(() => useAccent());

    expect(result.current.accent.id).toBe("shiqing");
    expect(getAccentVariable()).toBe(ACCENTS[2].light);
  });

  it("applies dark channels when the dark theme is active", () => {
    document.documentElement.classList.add("dark");

    applyAccent(ACCENTS[1]);

    expect(getAccentVariable()).toBe(ACCENTS[1].dark);
  });
});
