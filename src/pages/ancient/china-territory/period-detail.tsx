import { cn } from "../../../lib/utils";
import { buildWarList } from "./territory-overlays";
import type { ChroniclePeriod } from "./types";

/**
 * 右栏当期详情抽屉：疆域总述 → 都城 → 核心地区 → 行政区划 → 边防 →
 * 战争列表（可点选，选中后地图聚焦）→ 出处。内部滚动。
 */

interface PeriodDetailProps {
  period: ChroniclePeriod;
  /** 当前年份（年度时间轴读数），显示在朝代名旁。 */
  currentYear: number;
  selectedWarId: string | null;
  onSelectWar: (warId: string | null) => void;
}

export function PeriodDetail({
  period,
  currentYear,
  selectedWarId,
  onSelectWar,
}: PeriodDetailProps) {
  const warList = buildWarList(period);
  return (
    <aside className="tch-detail" aria-label="当朝详情">
      <div className="tch-detail-body">
        <header className="tch-detail-head">
          <h2>
            {period.display ?? period.name}
            <span className="tch-detail-now">
              {currentYear < 0 ? `前${-currentYear}年` : `${currentYear}年`}
            </span>
          </h2>
          <p className="tch-detail-years">{period.yearLabel}</p>
        </header>

        <section className="tch-section" aria-label="疆域总述">
          <h3>疆域总述</h3>
          <p className="tch-summary">{period.summary}</p>
          <p className="tch-caliber-note">
            边界为示意范围，据谭其骧《中国历史地图集》概化，非实测边界。
          </p>
        </section>

        <section className="tch-section" aria-label="都城">
          <h3>都城</h3>
          <ul className="tch-point-list">
            {period.polities.flatMap((polity) =>
              polity.capitals.map((capital) => (
                <li key={`${polity.id}-${capital.name}`}>
                  <span className={cn("tch-tag", capital.kind === "main" ? "is-main" : "is-sub")}>
                    {capital.kind === "main" ? "都" : "陪"}
                  </span>
                  <strong>{capital.name}</strong>
                  <span className="tch-point-note">
                    {polity.name}
                    {capital.note ? `｜${capital.note}` : ""}
                  </span>
                </li>
              )),
            )}
          </ul>
        </section>

        {period.coreRegions.length > 0 ? (
          <section className="tch-section" aria-label="核心地区">
            <h3>核心地区</h3>
            <ul className="tch-point-list">
              {period.coreRegions.map((region) => (
                <li key={region.name}>
                  <span className="tch-tag is-core">枢</span>
                  <strong>{region.name}</strong>
                  <span className="tch-point-note">{region.note}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="tch-section" aria-label="行政区划">
          <h3>行政区划（采样）</h3>
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
        </section>

        {period.defenses.length > 0 ? (
          <section className="tch-section" aria-label="边防">
            <h3>边防与工程</h3>
            <ul className="tch-division-list">
              {period.defenses.map((defense) => (
                <li key={defense.id}>
                  <strong>{defense.name}</strong>
                  <span className="tch-tag is-kind">{defense.kind}</span>
                  <span className="tch-point-note">{defense.note}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="tch-section" aria-label="战争">
          <h3>战争（{warList.length}）</h3>
          <ul className="tch-war-list">
            {warList.map((war) => {
              const isSelected = war.id === selectedWarId;
              return (
                <li key={war.id}>
                  <button
                    type="button"
                    className={cn("tch-war-item", isSelected && "is-selected")}
                    aria-pressed={isSelected}
                    onClick={() => onSelectWar(isSelected ? null : war.id)}
                  >
                    <span className="tch-war-head">
                      <strong>{war.name}</strong>
                      <span className="tch-war-year">{war.year}</span>
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

        <section className="tch-section" aria-label="资料出处">
          <h3>资料出处</h3>
          <ul className="tch-source-list">
            {period.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
