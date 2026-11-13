export const HOME_ENTRANCE_STORAGE_KEY = "home-entrance-scroll-shown";

/** 入场画卷播过一次后，7 天内不再重播。 */
export const HOME_ENTRANCE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 首页画卷入场是否已经播过且仍在 7 天有效期内。
 * 标记存 localStorage（跨窗口、跨会话），值为写入时的毫秒时间戳。
 */
export function hasFreshHomeEntranceMark(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(HOME_ENTRANCE_STORAGE_KEY);
    if (!raw) return false;

    const shownAt = Number(raw);
    if (!Number.isFinite(shownAt)) return false;

    const elapsed = now - shownAt;
    return elapsed >= 0 && elapsed < HOME_ENTRANCE_TTL_MS;
  } catch {
    return false;
  }
}

/** 记录「画卷已展开」的时间戳。隐私模式等受限环境静默降级为不记忆。 */
export function markHomeEntranceShown(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HOME_ENTRANCE_STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}
