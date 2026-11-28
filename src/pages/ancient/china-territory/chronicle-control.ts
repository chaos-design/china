import { toMonthIndex } from "./chronicle-time";
import type {
  ChroniclePeriod,
  ChroniclePolity,
  CityChange,
  ControlChange,
  ControlZone,
  LngLat,
} from "./types";

/**
 * 疆域控制解析：把「按年份记录的控制变更」折叠成当前月份的一张控制图。
 *
 * 规则（与用户口径一致）：
 * - 一个政权在某月被吞并后，它的疆域环整体转归接管方，不再单独绘制；
 *   接管方若后来又被吞并，则连同先前并入的疆域继续向上转移（链式）。
 * - 同一块区域在任一月份只有一个控制方，不会出现 A、B 同时控制。
 * - 城级变更只改城标注的归属（颜色 / 控制方 / 「易主」标签），
 *   疆域大环仍由政权级变更负责。
 */

export interface ResolvedRing {
  /** 当前控制方。 */
  polity: ChroniclePolity;
  ring: readonly LngLat[];
  /** own = 本政权原有疆域；absorbed = 已并入的旧政权疆域。 */
  kind: "own" | "absorbed";
  /** 原属政权（absorbed 时）。 */
  fromPolity?: ChroniclePolity;
  /** 并入年份（absorbed 时）。 */
  sinceYear?: number;
}

export interface ResolvedPolity {
  polity: ChroniclePolity;
  /** 当前有效疆域环（本政权 + 已吞并政权）。 */
  rings: ResolvedRing[];
  /** 已吞并政权名（按并入时间）。 */
  absorbedNames: string[];
  /** 当前是否仍在本期图面上（未被吞并）。 */
  active: boolean;
  /** 被谁吞并（active = false 时）。 */
  absorbedBy?: ChroniclePolity | null;
  /** 被吞并年份。 */
  absorbedYear?: number;
}

export interface ResolvedCity {
  name: string;
  ll: LngLat;
  note?: string;
  kind: "capital" | "city";
  /** 都城等级（kind = capital 时）。 */
  capitalKind?: "main" | "secondary";
  /** 当前控制方（可能为 null = 失守 / 无人控制）。 */
  polity: ChroniclePolity | null;
  /** 原属政权。 */
  originPolity: ChroniclePolity;
  /** 当前生效的最后一条城级变更。 */
  change?: CityChange;
  /** 是否已易主。 */
  changed: boolean;
}

export interface ResolvedZone {
  zone: ControlZone;
  polity: ChroniclePolity | null;
  /** 当前生效的最后一条变更。 */
  change?: {
    year: number;
    month?: number;
    by: string | null;
    note?: string;
  };
}

export interface ResolvedPeriod {
  month: number;
  /** 当前仍存在的政权（含其已并入的疆域环）。 */
  activePolities: ResolvedPolity[];
  /** 全部政权（含已吞并），便于查色 / 显示「已并入」。 */
  polities: ResolvedPolity[];
  /** 当前月份的全部城（都城 + 重要城市）。 */
  cities: ResolvedCity[];
  /** 局部控制区。 */
  zones: ResolvedZone[];
  /** 截至当前月份的控制变更（倒序）。 */
  controlHistory: ControlChange[];
  /** 截至当前月份的城级变更（倒序）。 */
  cityHistory: CityChange[];
  /** 最近 12 个月内生效的变更（用于速报高亮）。 */
  recentChanges: ControlChange[];
}

function changeMonth(change: { year: number; month?: number }): number {
  return toMonthIndex(change.year, change.month ?? 1);
}

/** 解析某期在某月的控制状态。 */
export function resolvePeriodAt(period: ChroniclePeriod, month: number): ResolvedPeriod {
  const byId = new Map(period.polities.map((polity) => [polity.id, polity]));
  const changes = (period.control ?? [])
    .filter((change) => changeMonth(change) <= month)
    .sort((a, b) => changeMonth(a) - changeMonth(b));
  const absorbedAt = new Map<string, ControlChange>();
  for (const change of changes) absorbedAt.set(change.absorbed, change);

  /** 沿吞并链找最终控制方；null = 无人接管。 */
  function finalOwner(polityId: string): string | null {
    let current = polityId;
    const seen = new Set<string>();
    while (absorbedAt.has(current) && !seen.has(current)) {
      seen.add(current);
      const change = absorbedAt.get(current)!;
      if (change.by === null) return null;
      if (change.by === current) return current;
      current = change.by;
    }
    return current;
  }

  // 每个政权最终归属
  const ownerOf = new Map<string, string | null>();
  for (const polity of period.polities) {
    ownerOf.set(polity.id, absorbedAt.has(polity.id) ? finalOwner(polity.id) : polity.id);
  }

  const polities: ResolvedPolity[] = period.polities.map((polity) => {
    const absorbed = absorbedAt.get(polity.id);
    const active = !absorbed;
    const absorbedBy = absorbed
      ? absorbed.by
        ? (byId.get(absorbed.by) ?? null)
        : null
      : undefined;
    return {
      polity,
      rings: [{ polity, ring: polity.territory, kind: "own" }],
      absorbedNames: [],
      active,
      absorbedBy,
      absorbedYear: absorbed?.year,
    };
  });
  const resolvedById = new Map(polities.map((entry) => [entry.polity.id, entry]));

  // 把被吞并政权的环挂到最终控制方名下（链式）
  for (const polity of period.polities) {
    if (!absorbedAt.has(polity.id)) continue;
    const ownerId = ownerOf.get(polity.id) ?? null;
    if (!ownerId) continue;
    const owner = resolvedById.get(ownerId);
    if (!owner) continue;
    const absorbed = absorbedAt.get(polity.id)!;
    owner.rings.push({
      polity: owner.polity,
      ring: polity.territory,
      kind: "absorbed",
      fromPolity: polity,
      sinceYear: absorbed.year,
    });
    owner.absorbedNames.push(polity.name);
    // 记录被并入者的最终归属，便于右侧显示
    const entry = resolvedById.get(polity.id)!;
    entry.absorbedBy = owner.polity;
  }

  // 城级控制
  const cityChanges = (period.cityChanges ?? [])
    .filter((change) => changeMonth(change) <= month)
    .sort((a, b) => changeMonth(a) - changeMonth(b));
  const cityChangeByName = new Map<string, CityChange>();
  for (const change of cityChanges) cityChangeByName.set(change.city, change);

  const cities: ResolvedCity[] = [];
  const seenCities = new Set<string>();
  for (const polity of period.polities) {
    for (const capital of polity.capitals) {
      if (seenCities.has(capital.name)) continue;
      seenCities.add(capital.name);
      cities.push(
        resolveCity(capital.name, capital.ll, capital.note, "capital", capital.kind, polity),
      );
    }
    for (const city of polity.cities ?? []) {
      if (seenCities.has(city.name)) continue;
      seenCities.add(city.name);
      cities.push(resolveCity(city.name, city.ll, city.note, "city", undefined, polity));
    }
  }

  function resolveCity(
    name: string,
    ll: LngLat,
    note: string | undefined,
    kind: "capital" | "city",
    capitalKind: "main" | "secondary" | undefined,
    origin: ChroniclePolity,
  ): ResolvedCity {
    const change = cityChangeByName.get(name);
    const originOwnerId = ownerOf.get(origin.id) ?? null;
    const resolvedOwnerId = change ? change.by : originOwnerId;
    // 城的新主若后来又被吞并，沿吞并链归到最终控制方，避免城挂在不存在的政权下。
    const ownerId = resolvedOwnerId ? (finalOwner(resolvedOwnerId) ?? resolvedOwnerId) : null;
    const owner = ownerId ? (byId.get(ownerId) ?? null) : null;
    return {
      name,
      ll,
      note,
      kind,
      capitalKind,
      polity: owner,
      originPolity: origin,
      change,
      changed: owner?.id !== origin.id,
    };
  }

  // 局部控制区
  const zones: ResolvedZone[] = (period.controlZones ?? []).map((zone) => {
    const changes = (zone.changes ?? [])
      .filter((change) => changeMonth(change) <= month)
      .sort((a, b) => changeMonth(a) - changeMonth(b));
    const change = changes[changes.length - 1];
    const rawOwnerId = change ? change.by : zone.polityId;
    const ownerId = rawOwnerId ? (finalOwner(rawOwnerId) ?? rawOwnerId) : null;
    return {
      zone,
      polity: ownerId ? (byId.get(ownerId) ?? null) : null,
      change,
    };
  });

  const activePolities = polities.filter((entry) => entry.active);
  const controlHistory = changes.slice().reverse();
  const cityHistory = cityChanges.slice().reverse();
  const recentChanges = controlHistory.filter((change) => month - changeMonth(change) <= 12);

  return {
    month,
    activePolities,
    polities,
    cities,
    zones,
    controlHistory,
    cityHistory,
    recentChanges,
  };
}

/** 控制状态签名：只有控制图变化时才需要重建地图覆盖层。 */
export function controlSignature(resolved: ResolvedPeriod): string {
  const parts: string[] = [];
  for (const entry of resolved.activePolities) {
    parts.push(entry.polity.id);
    for (const ring of entry.rings) {
      parts.push(`${ring.kind}:${ring.fromPolity?.id ?? "own"}`);
    }
  }
  for (const city of resolved.cities) {
    parts.push(`${city.name}:${city.polity?.id ?? "none"}`);
  }
  for (const zone of resolved.zones) {
    parts.push(`${zone.zone.id}:${zone.polity?.id ?? "none"}`);
  }
  return parts.join("|");
}

/** 当前控制某城的政权（用于右侧「此刻」摘要）。 */
export function controllingPolities(resolved: ResolvedPeriod): ResolvedPolity[] {
  return resolved.activePolities.slice().sort((a, b) => b.rings.length - a.rings.length);
}

/** 某政权当前控制的都城（含已并入政权的旧都）。 */
export function capitalsOf(resolved: ResolvedPeriod, polityId: string): ResolvedCity[] {
  return resolved.cities.filter((city) => city.kind === "capital" && city.polity?.id === polityId);
}

/** 某政权当前控制的重要城市。 */
export function citiesOf(resolved: ResolvedPeriod, polityId: string): ResolvedCity[] {
  return resolved.cities.filter((city) => city.kind === "city" && city.polity?.id === polityId);
}
