import { useCallback, useLayoutEffect, useState } from "react";

export interface AccentOption {
  id: string;
  label: string;
  light: string;
  dark: string;
}

export const ACCENTS: AccentOption[] = [
  { id: "zhusha", label: "朱砂", light: "2 68% 47%", dark: "4 72% 56%" },
  { id: "moqing", label: "墨青", light: "200 28% 30%", dark: "200 45% 58%" },
  { id: "shiqing", label: "石青", light: "205 55% 36%", dark: "205 60% 56%" },
  { id: "zheshi", label: "赭石", light: "20 58% 42%", dark: "22 62% 56%" },
  { id: "daizi", label: "黛紫", light: "268 28% 40%", dark: "268 42% 64%" },
  { id: "songlv", label: "松绿", light: "158 42% 32%", dark: "158 46% 50%" },
  { id: "tenghuang", label: "藤黄", light: "42 78% 42%", dark: "44 80% 56%" },
  { id: "yanzhi", label: "胭脂", light: "342 52% 44%", dark: "342 58% 60%" },
  { id: "qunqing", label: "群青", light: "224 56% 44%", dark: "224 62% 64%" },
  { id: "chahe", label: "茶褐", light: "28 36% 34%", dark: "28 40% 52%" },
];

const STORAGE_KEY = "accent";
const DEFAULT_ACCENT = ACCENTS[0];

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function applyAccent(accent: AccentOption): void {
  if (typeof document === "undefined") return;
  const channels = isDarkTheme() ? accent.dark : accent.light;
  document.documentElement.style.setProperty("--vermillion", channels);
}

function readStoredAccent(): AccentOption {
  if (typeof localStorage === "undefined") return DEFAULT_ACCENT;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return ACCENTS.find((accent) => accent.id === stored) ?? DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

function persistAccent(accent: AccentOption): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, accent.id);
  } catch {
    // localStorage may be blocked in private or embedded contexts.
  }
}

export interface UseAccentResult {
  accent: AccentOption;
  accents: AccentOption[];
  setAccent: (id: string) => void;
}

export function useAccent(): UseAccentResult {
  const [accent, setAccentState] = useState<AccentOption>(readStoredAccent);

  useLayoutEffect(() => {
    applyAccent(accent);
  }, [accent]);

  const setAccent = useCallback((id: string) => {
    const next = ACCENTS.find((accentOption) => accentOption.id === id);
    if (!next) return;

    setAccentState(next);
    persistAccent(next);
  }, []);

  return { accent, accents: ACCENTS, setAccent };
}
