import { cn } from "../../../lib/utils";
import { CHRONICLE_ERAS, CHRONICLE_PERIODS, periodsOfEra } from "./registry";
import { ERA_LABELS } from "./types";

/**
 * 左栏编年目录：按时代分组的 20 期列表，当前期朱色高亮。
 * 单行紧凑条目；整列允许内部滚动（窄屏下目录很长是预期形态）。
 */

interface ChronicleMenuProps {
  periodIndex: number;
  onSelect: (index: number) => void;
}

/** 由 id 反查全表下标（registry 顺序即编年顺序）。 */
function globalIndex(id: string): number {
  return CHRONICLE_PERIODS.findIndex((period) => period.id === id);
}

export function ChronicleMenu({ periodIndex, onSelect }: ChronicleMenuProps) {
  return (
    <aside className="tch-menu" aria-label="编年目录">
      <nav aria-label="历代编年">
        {CHRONICLE_ERAS.map((era) => {
          const periods = periodsOfEra(era);
          return (
            <section key={era} className="tch-era-group">
              <h2 className="tch-era-title">{ERA_LABELS[era]}</h2>
              <ul className="tch-era-list">
                {periods.map((period) => {
                  const index = globalIndex(period.id);
                  const isCurrent = index === periodIndex;
                  return (
                    <li key={period.id}>
                      <button
                        type="button"
                        className={cn("tch-menu-item", isCurrent && "is-current")}
                        aria-current={isCurrent ? "true" : undefined}
                        onClick={() => onSelect(index)}
                      >
                        <span className="tch-menu-name">{period.display ?? period.name}</span>
                        <span className="tch-menu-years">{period.yearLabel}</span>
                        <span className="tch-menu-meta">
                          {period.polities.length > 1 ? `${period.polities.length} 政权 · ` : ""}
                          {period.wars.length} 战
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
