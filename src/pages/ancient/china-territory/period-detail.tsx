import { cn } from "../../../lib/utils";
import type { ResolvedPeriod } from "./chronicle-control";
import type { AnnalView } from "./chronicle-time";
import { formatYear, formatYearMonth, fromMonthIndex, toMonthIndex } from "./chronicle-time";
import type { PolityHoverInfo, WarOpHoverInfo } from "./leaflet-scene";
import { buildWarList } from "./territory-overlays";
import { type ChronicleFigure, type ChroniclePeriod, ERA_LABELS } from "./types";

/** 地图要素悬停的完整说明（tooltip 只留两行，全文进右栏）。 */
export type ChronicleHover =
  | { kind: "polity"; info: PolityHoverInfo }
  | { kind: "war"; info: WarOpHoverInfo };

/**
 * 右栏当期详情：顶部吸顶（朝代 / 当前年月 / 在场政权 / 最新控制变更），
 * 正文先给「编年速报」与「此刻控制」两块实时信息，再给疆域总述与战争；
 * 都城、核心地区、区划、边防、人物志、出处收进默认折叠的 details，
 * 避免长列表把重要信息压到首屏之外。
 */

interface PeriodDetailProps {
  period: ChroniclePeriod;
  /** 当前月份序号（编年时间轴读数）。 */
  month: number;
  /** 当前月份的控制解析结果。 */
  resolved: ResolvedPeriod;
  /** 截至当前月份的编年速报（倒序）。 */
  annals: AnnalView[];
  /** 地图要素悬停的完整说明（tooltip 只留两行）。 */
  hover: ChronicleHover | null;
  selectedWarId: string | null;
  onSelectWar: (warId: string | null) => void;
}

const ANNAL_KIND_LABEL: Record<AnnalView["kind"], string> = {
  capital: "都",
  war: "战",
  politics: "政",
  person: "人",
  territory: "疆",
};

const STANCE_LABEL: Record<ChronicleFigure["stance"], string> = {
  loyal: "忠",
  treacherous: "奸",
  notable: "要",
};

export function PeriodDetail({
  period,
  month,
  resolved,
  annals,
  hover,
  selectedWarId,
  onSelectWar,
}: PeriodDetailProps) {
  const warList = buildWarList(period);
  const date = fromMonthIndex(month);
  const dateText = formatYearMonth(date);
  const currentCapitalNames = resolved.cities
    .filter((city) => city.kind === "capital" && city.polity)
    .map((city) => city.name);
  const changedCities = resolved.cities.filter((city) => city.changed);
  const recentChange = resolved.controlHistory[0];
  const figures = period.figures ?? [];
  // 编年体人物状态：按生卒年推断当前月在世的人物（缺生卒年者记「事迹在本期」）。
  const livingFigures = figures.filter(
    (figure) =>
      (figure.birthYear == null || figure.birthYear <= date.year) &&
      (figure.deathYear == null || figure.deathYear >= date.year),
  );
  const groupedFigures = (
    [
      {
        stance: "loyal",
        label: "忠臣 · 名将",
        items: figures.filter((figure) => figure.stance === "loyal"),
      },
      {
        stance: "treacherous",
        label: "权奸 · 乱政",
        items: figures.filter((figure) => figure.stance === "treacherous"),
      },
      {
        stance: "notable",
        label: "重要人物",
        items: figures.filter((figure) => figure.stance === "notable"),
      },
    ] satisfies Array<{
      stance: ChronicleFigure["stance"];
      label: string;
      items: ChronicleFigure[];
    }>
  ).filter((group) => group.items.length > 0);

  return (
    <aside className="tch-detail" aria-label="当朝详情">
      <header className="tch-detail-head">
        <div className="tch-detail-title">
          <h2>{period.display ?? period.name}</h2>
          <span className="tch-detail-now">{dateText}</span>
        </div>
        <p className="tch-detail-years">
          {period.yearLabel} · {ERA_LABELS[period.era]}
        </p>
        <ul className="tch-owner-chips" aria-label="在场政权">
          {resolved.activePolities.map((entry) => (
            <li key={entry.polity.id}>
              <i style={{ background: entry.polity.color }} />
              <span>{entry.polity.name}</span>
              {entry.absorbedNames.length > 0 ? (
                <em title={entry.absorbedNames.join("、")}>+{entry.absorbedNames.length}</em>
              ) : null}
            </li>
          ))}
        </ul>
        {recentChange ? (
          <p className="tch-detail-change">
            最新控制变更：{formatYear(recentChange.year)} 年 · {recentChange.note}
          </p>
        ) : null}
      </header>

      <div className="tch-detail-body">
        {hover ? <HoverCard hover={hover} /> : null}

        <section className="tch-section tch-annals" aria-label="编年速报">
          <h3>
            编年速报
            <span className="tch-section-meta">截至 {dateText}</span>
          </h3>
          <ol className="tch-annal-list">
            {annals.slice(0, 16).map((entry) => {
              const at = fromMonthIndex(entry.month);
              const isNow = month - entry.month <= 12;
              return (
                <li
                  key={`${entry.month}-${entry.kind}-${entry.text}`}
                  className={cn("tch-annal", `is-${entry.kind}`, isNow && "is-now")}
                >
                  <span className="tch-annal-date">
                    {entry.monthKnown ? formatYearMonth(at) : formatYear(at.year)}
                  </span>
                  <span className="tch-annal-kind">{ANNAL_KIND_LABEL[entry.kind]}</span>
                  <span className="tch-annal-text">{entry.text}</span>
                </li>
              );
            })}
            {annals.length === 0 ? (
              <li className="tch-annal is-empty">本期尚未到有记载的编年事件。</li>
            ) : null}
          </ol>
        </section>

        {livingFigures.length > 0 ? (
          <section className="tch-section tch-figures-live" aria-label="人物动态">
            <h3>
              人物动态
              <span className="tch-section-meta">在世 / 活跃 · {livingFigures.length} 人</span>
            </h3>
            <ul className="tch-live-figures">
              {livingFigures.slice(0, 8).map((figure) => (
                <li key={figure.name} className={cn("is-" + figure.stance)}>
                  <strong>{figure.name}</strong>
                  <span>{figure.role}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="tch-section" aria-label="此刻控制">
          <h3>
            此刻控制
            <span className="tch-section-meta">
              {resolved.activePolities.length} 政权
              {currentCapitalNames.length > 0 ? ` · ${currentCapitalNames.length} 都城` : ""}
            </span>
          </h3>
          <ul className="tch-now-list">
            {resolved.activePolities.map((entry) => {
              const capitals = resolved.cities.filter(
                (city) => city.kind === "capital" && city.polity?.id === entry.polity.id,
              );
              const cityCount = resolved.cities.filter(
                (city) => city.kind === "city" && city.polity?.id === entry.polity.id,
              ).length;
              return (
                <li key={entry.polity.id}>
                  <i style={{ background: entry.polity.color }} />
                  <strong>{entry.polity.name}</strong>
                  <span>
                    {capitals.length > 0
                      ? `都 ${capitals.map((city) => city.name).join("、")}`
                      : "无都城在控"}
                    {cityCount > 0 ? ` · ${cityCount} 重镇` : ""}
                    {entry.absorbedNames.length > 0
                      ? ` · 已并 ${entry.absorbedNames.join("、")}`
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          {changedCities.length > 0 ? (
            <p className="tch-city-change">
              易主：
              {changedCities
                .slice(0, 4)
                .map(
                  (city) =>
                    `${city.name}（原属${city.originPolity.name} → ${
                      city.polity?.name ?? "失守"
                    }）`,
                )
                .join("；")}
            </p>
          ) : null}
        </section>

        <section className="tch-section" aria-label="疆域总述">
          <h3>疆域总述</h3>
          <p className="tch-summary">{period.summary}</p>
          <p className="tch-caliber-note">
            边界为示意范围，据谭其骧《中国历史地图集》概化，非实测边界；已并入的旧疆以虚线保留旧界、按接管方着色。
          </p>
        </section>

        <details className="tch-fold" aria-label="都城">
          <summary>
            都城 <em>{resolved.cities.filter((city) => city.kind === "capital").length}</em>
          </summary>
          <ul className="tch-point-list">
            {resolved.cities
              .filter((city) => city.kind === "capital")
              .map((city) => (
                <li key={city.name}>
                  <span
                    className={cn("tch-tag", city.capitalKind === "main" ? "is-main" : "is-sub")}
                  >
                    {city.capitalKind === "main" ? "都" : "陪"}
                  </span>
                  <strong>{city.name}</strong>
                  <span className="tch-point-note">
                    {city.polity?.name ?? "失守"}
                    {city.changed ? `（原属${city.originPolity.name}）` : ""}
                    {city.note ? `｜${city.note}` : ""}
                  </span>
                </li>
              ))}
          </ul>
        </details>

        {period.coreRegions.length > 0 ? (
          <details className="tch-fold" aria-label="核心地区">
            <summary>
              核心地区 <em>{period.coreRegions.length}</em>
            </summary>
            <ul className="tch-point-list">
              {period.coreRegions.map((region) => (
                <li key={region.name}>
                  <span className="tch-tag is-core">枢</span>
                  <strong>{region.name}</strong>
                  <span className="tch-point-note">{region.note}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <details className="tch-fold" aria-label="行政区划">
          <summary>
            行政区划（采样） <em>{period.divisions.length}</em>
          </summary>
          <ul className="tch-division-list">
            {period.divisions.map((division) => (
              <li key={division.name}>
                <strong>{division.name}</strong>
                <span className="tch-tag is-kind">{division.kind}</span>
                <span className="tch-point-note">{division.note}</span>
              </li>
            ))}
          </ul>
          <p className="tch-caliber-note">放大地图（≥6 级）可在沙盘上看到这些治所点位。</p>
        </details>

        {period.defenses.length > 0 ? (
          <details className="tch-fold" aria-label="边防">
            <summary>
              边防与工程 <em>{period.defenses.length}</em>
            </summary>
            <ul className="tch-division-list">
              {period.defenses.map((defense) => (
                <li key={defense.id}>
                  <strong>{defense.name}</strong>
                  <span className="tch-tag is-kind">{defense.kind}</span>
                  <span className="tch-point-note">{defense.note}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <section className="tch-section" aria-label="战争">
          <h3>
            战争 <span className="tch-section-meta">{warList.length} 役</span>
          </h3>
          <ul className="tch-war-list">
            {warList.map((war) => {
              const isSelected = war.id === selectedWarId;
              const started = toMonthIndex(war.startYear, 1) <= month;
              return (
                <li key={war.id}>
                  <button
                    type="button"
                    className={cn(
                      "tch-war-item",
                      isSelected && "is-selected",
                      !started && "is-future",
                    )}
                    aria-pressed={isSelected}
                    onClick={() => onSelectWar(isSelected ? null : war.id)}
                  >
                    <span className="tch-war-head">
                      <strong>{war.name}</strong>
                      <span className="tch-war-year">
                        {war.year}
                        <em className={cn("tch-war-status", started ? "is-live" : "is-future")}>
                          {started ? "已开战" : "未及"}
                        </em>
                      </span>
                    </span>
                    <span className="tch-war-sides">
                      {war.sideA} <i>vs</i> {war.sideB}
                    </span>
                    <span className="tch-war-brief">{war.brief}</span>
                    {isSelected ? (
                      <span className="tch-war-open-hint">地图已聚焦战场，再次点击取消</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {figures.length > 0 ? (
          <details className="tch-fold tch-figures" aria-label="人物志">
            <summary>
              人物志 <em>{figures.length}</em>
            </summary>
            <div className="tch-figure-groups">
              {groupedFigures.map((group) => (
                <section
                  key={group.stance}
                  className={cn("tch-figure-group", `is-${group.stance}`)}
                >
                  <h4>{group.label}</h4>
                  <ul>
                    {group.items.map((figure) => {
                      const living = livingFigures.includes(figure);
                      return (
                        <li key={figure.name} className={cn("tch-figure", living && "is-living")}>
                          <div className="tch-figure-head">
                            <strong>{figure.name}</strong>
                            <span className={cn("tch-figure-role", `is-${figure.stance}`)}>
                              {STANCE_LABEL[figure.stance]} · {figure.role}
                              {living ? " · 在世" : ""}
                            </span>
                          </div>
                          <p className="tch-figure-life">{figure.life}</p>
                          <p className="tch-figure-fate">结局：{figure.fate}</p>
                          {figure.note ? (
                            <p className="tch-figure-note">注：{figure.note}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </details>
        ) : null}

        <details className="tch-fold" aria-label="资料出处">
          <summary>资料出处</summary>
          <ul className="tch-source-list">
            {period.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </details>
      </div>
    </aside>
  );
}

/** 悬停详情卡：地图 tooltip 只留两行，完整说明在这里展开。 */
function HoverCard({ hover }: { hover: ChronicleHover }) {
  if (hover.kind === "polity") {
    const info = hover.info;
    return (
      <section className="tch-hover-card" aria-label="悬停详情">
        <h3>
          <i style={{ background: info.color }} />
          {info.name}
          <span className="tch-hover-kind">{info.kind === "absorbed" ? "旧疆" : "疆域"}</span>
        </h3>
        <p>{info.note}</p>
        {info.kind === "absorbed" && info.fromName ? (
          <p className="tch-hover-meta">
            原属{info.fromName}
            {info.sinceYear ? `，${formatYear(info.sinceYear)} 年并入` : ""}
          </p>
        ) : null}
        {info.absorbedNames.length > 0 ? (
          <p className="tch-hover-meta">已并入：{info.absorbedNames.join("、")}</p>
        ) : null}
      </section>
    );
  }
  const info = hover.info;
  const kindLabel =
    info.kind === "advance"
      ? "推进方向"
      : info.kind === "retreat"
        ? "撤退路线"
        : info.kind === "battle"
          ? "战场"
          : "包围圈";
  return (
    <section className="tch-hover-card" aria-label="悬停详情">
      <h3>
        {info.name}
        <span className="tch-hover-kind">
          {kindLabel} · {info.side === 1 ? "甲方" : "乙方"}
        </span>
      </h3>
      <p>{info.note ?? "该要素属于当前战役的部署图；点击地图或右栏战役条目可聚焦战场。"}</p>
    </section>
  );
}
