import type { ChronicleAnnal, ChronicleEra, ChroniclePeriod, WarEvent } from "./types";

/**
 * 编年时间模型：把「公元前 / 公元」年份换算成连续的**月份序号**。
 *
 * 历史纪年没有公元 0 年：前 1 年之后直接是 1 年。这里把前 1 年映射到
 * 0 年（内部序号），1 年映射到 1 年，使 前1-12 → 1-01 连续无空洞。
 * 所有时间推进（滑杆、键盘、播放）都以月为最小单位。
 */

export interface ChronicleDate {
  /** 负数 = 公元前（如 -2070 = 前 2070 年），无 0 年。 */
  year: number;
  /** 1–12。 */
  month: number;
}

export const MONTHS_PER_YEAR = 12;

/** 年份 + 月份 → 连续月份序号（可跨公元前 / 公元后）。 */
export function toMonthIndex(year: number, month = 1): number {
  const shiftedYear = year < 0 ? year + 1 : year;
  return shiftedYear * MONTHS_PER_YEAR + (month - 1);
}

/** 连续月份序号 → 历史年月（无 0 年）。 */
export function fromMonthIndex(index: number): ChronicleDate {
  const shiftedYear = Math.floor(index / MONTHS_PER_YEAR);
  const month = (((index % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR) + 1;
  const year = shiftedYear <= 0 ? shiftedYear - 1 : shiftedYear;
  return { year, month };
}

/** 年份显示（前 2070 / 1840）。 */
export function formatYear(year: number): string {
  return year < 0 ? `前${-year}` : `${year}`;
}

/** 年月显示（前 2070 年 1 月 / 1840 年 12 月）。 */
export function formatYearMonth(date: ChronicleDate): string {
  return `${formatYear(date.year)}年${date.month}月`;
}

/** 年 + 可选月 → 月份序号。 */
export function dateToMonth(year: number, month = 1): number {
  return toMonthIndex(year, month);
}

/**
 * 战争起始月份（战争数据只有年份，统一按当年 1 月上线）。
 * 解析口径与 territory-overlays 的 parseWarYearRange 一致：支持
 * 「约前1600」「前230 — 前221」「前202 — 公元8」，取第一个年份。
 */
export function warStartMonth(war: WarEvent): number {
  const re = /(前|公元)?\s*(\d+)/g;
  const match = re.exec(war.year);
  if (!match) return 0;
  const value = Number(match[2]);
  return toMonthIndex(match[1] === "前" ? -value : value, 1);
}

/** 期起始月份。 */
export function periodStartMonth(period: ChroniclePeriod): number {
  return toMonthIndex(period.startYear, 1);
}

/** 期结束月份（含当年 12 月）。 */
export function periodEndMonth(period: ChroniclePeriod): number {
  return toMonthIndex(period.endYear, 12);
}

/** 某月所属的期下标（最后一个 startMonth ≤ month 的期）。 */
export function getPeriodIndexForMonth(periods: readonly ChroniclePeriod[], month: number): number {
  let index = 0;
  for (let i = 0; i < periods.length; i += 1) {
    if (periodStartMonth(periods[i]) <= month) index = i;
  }
  return index;
}

/** 某月所属的期。 */
export function getPeriodForMonth(
  periods: readonly ChroniclePeriod[],
  month: number,
): ChroniclePeriod {
  return periods[getPeriodIndexForMonth(periods, month)];
}

/** 编年时间轴事件类型。 */
export type ChronicleEventKind = "period" | "war" | "control" | "city" | "zone";

export interface ChronicleEvent {
  month: number;
  kind: ChronicleEventKind;
  /** 全局期下标。 */
  periodIndex: number;
  /** 时间轴 hover 标题（短）。 */
  label: string;
  /** 时间轴 hover 说明（长）。 */
  detail: string;
  /** 关联政权（着色）。 */
  polityId?: string;
  /** 关联战争 id（点选跳转）。 */
  warId?: string;
}

/** 时代色带（底部进度条与速报标签共用）。 */
export interface EraBand {
  era: ChronicleEra;
  startMonth: number;
  endMonth: number;
}

/** 一期在时间轴上的色带（朝代进度）。 */
export interface PeriodBand {
  period: ChroniclePeriod;
  periodIndex: number;
  era: ChronicleEra;
  startMonth: number;
  endMonth: number;
}

/** 时代色带：从该时代第一期的起始月到最后一期的有效结束月。 */
export function buildEraBands(periods: readonly ChroniclePeriod[]): EraBand[] {
  const bands = new Map<ChronicleEra, EraBand>();
  for (const band of buildPeriodBands(periods)) {
    const current = bands.get(band.era);
    if (!current) {
      bands.set(band.era, {
        era: band.era,
        startMonth: band.startMonth,
        endMonth: band.endMonth,
      });
    } else {
      current.startMonth = Math.min(current.startMonth, band.startMonth);
      current.endMonth = Math.max(current.endMonth, band.endMonth);
    }
  }
  return [...bands.values()].sort((a, b) => a.startMonth - b.startMonth);
}

/**
 * 朝代色带：每期一条，按编年顺序。
 * 有效结束月取「下一期起始月 - 1」，与 getPeriodIndexForMonth 的归属规则
 * 完全一致——相邻色带首尾相接、不重叠，也不会出现「当前期在色带之外」。
 * 末期用自身 endYear 的 12 月收尾。
 */
export function buildPeriodBands(periods: readonly ChroniclePeriod[]): PeriodBand[] {
  return periods.map((period, periodIndex) => {
    const startMonth = periodStartMonth(period);
    const next = periods[periodIndex + 1];
    const endMonth = next
      ? Math.max(startMonth, periodStartMonth(next) - 1)
      : periodEndMonth(period);
    return {
      period,
      periodIndex,
      era: period.era,
      startMonth,
      endMonth,
    };
  });
}

/** 全站编年事件（时间轴刻度 + hover 提示）。 */
export function buildChronicleEvents(periods: readonly ChroniclePeriod[]): ChronicleEvent[] {
  const events: ChronicleEvent[] = [];
  periods.forEach((period, periodIndex) => {
    const start = periodStartMonth(period);
    events.push({
      month: start,
      kind: "period",
      periodIndex,
      label: period.display ?? period.name,
      detail: `${period.yearLabel} · ${period.polities.length} 政权`,
    });
    for (const war of period.wars) {
      events.push({
        month: warStartMonth(war),
        kind: "war",
        periodIndex,
        label: war.name,
        detail: `${war.year} · ${war.sideA} vs ${war.sideB}`,
        warId: war.id,
      });
    }
    for (const change of period.control ?? []) {
      events.push({
        month: toMonthIndex(change.year, change.month ?? 1),
        kind: "control",
        periodIndex,
        label: change.note,
        detail: `${formatYearMonth({ year: change.year, month: change.month ?? 1 })} · ${change.note}`,
        polityId: change.by ?? change.absorbed,
      });
    }
    for (const change of period.cityChanges ?? []) {
      events.push({
        month: toMonthIndex(change.year, change.month ?? 1),
        kind: "city",
        periodIndex,
        label: `${change.city}易主`,
        detail: `${formatYearMonth({ year: change.year, month: change.month ?? 1 })} · ${change.note}`,
        polityId: change.by ?? undefined,
      });
    }
    for (const zone of period.controlZones ?? []) {
      for (const change of zone.changes ?? []) {
        events.push({
          month: toMonthIndex(change.year, change.month ?? 1),
          kind: "zone",
          periodIndex,
          label: `${zone.name}易主`,
          detail: `${formatYearMonth({ year: change.year, month: change.month ?? 1 })} · ${change.note ?? zone.note}`,
          polityId: change.by ?? undefined,
        });
      }
    }
  });
  return events.sort((a, b) => a.month - b.month);
}

/** 期内「截至某月」最新开战的战争。 */
export function latestWarAtOrBeforeMonth(period: ChroniclePeriod, month: number): WarEvent | null {
  let found: WarEvent | null = null;
  for (const war of period.wars) {
    const start = warStartMonth(war);
    if (start <= month) {
      if (!found || start > warStartMonth(found)) found = war;
    }
  }
  return found;
}

/** 期内「截至某月」已开战但非当前部署的战争。 */
export function pastWarsAtOrBeforeMonth(
  period: ChroniclePeriod,
  month: number,
  activeId: string | null,
): WarEvent[] {
  return period.wars.filter((war) => war.id !== activeId && warStartMonth(war) <= month);
}

/** 编年速报视图条目。 */
export interface AnnalView extends ChronicleAnnal {
  month: number;
  /** 原始数据是否带月份（无月份时 UI 只显示年份，避免伪造「1 月」）。 */
  monthKnown: boolean;
}

/** 截至某月的编年速报（逆序：最新在上），并合并战争起始。 */
export function annalsAtOrBefore(period: ChroniclePeriod, month: number): AnnalView[] {
  const entries: AnnalView[] = [];
  for (const annal of period.annals ?? []) {
    const at = toMonthIndex(annal.year, annal.month ?? 1);
    if (at <= month) entries.push({ ...annal, month: at, monthKnown: annal.month != null });
  }
  for (const war of period.wars) {
    const at = warStartMonth(war);
    if (at > month) continue;
    entries.push({
      year: fromMonthIndex(at).year,
      month: at,
      monthKnown: false,
      kind: "war",
      text: `${war.name}：${war.brief}`,
      polityId: undefined,
    });
  }
  for (const change of period.control ?? []) {
    const at = toMonthIndex(change.year, change.month ?? 1);
    if (at > month) continue;
    entries.push({
      year: change.year,
      month: at,
      monthKnown: change.month != null,
      kind: "territory",
      text: change.note,
      polityId: change.by ?? change.absorbed,
    });
  }
  for (const change of period.cityChanges ?? []) {
    const at = toMonthIndex(change.year, change.month ?? 1);
    if (at > month) continue;
    entries.push({
      year: change.year,
      month: at,
      monthKnown: change.month != null,
      kind: "territory",
      text: `${change.city}：${change.note}`,
      polityId: change.by ?? undefined,
    });
  }
  // 去重（同一月同一文本），按月份倒序
  const seen = new Set<string>();
  return entries
    .sort((a, b) => b.month - a.month)
    .filter((entry) => {
      const key = `${entry.month}/${entry.kind}/${entry.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** 月份在 [min, max] 内的比例（0–1）。 */
export function monthRatio(month: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (month - min) / (max - min)));
}
