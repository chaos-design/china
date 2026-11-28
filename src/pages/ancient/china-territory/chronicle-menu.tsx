import { useEffect, useState } from "react";

import { cn } from "../../../lib/utils";
import { CHRONICLE_ERAS, CHRONICLE_PERIODS, periodsOfEra } from "./registry";
import { type ChronicleEra, ERA_COLORS, ERA_LABELS } from "./types";

/**
 * 左栏编年目录：按时代分组的 20 期列表，当前期朱色高亮。
 * 整列可收起为「编年目录」chip；每个时代分组也可单独折叠。
 * 单行紧凑条目；整列允许内部滚动（窄屏下目录很长是预期形态）。
 */

const STORAGE_KEY = "territory-chronicle-menu-open";

interface ChronicleMenuProps {
  periodIndex: number;
  onSelect: (index: number) => void;
}

/** 由 id 反查全表下标（registry 顺序即编年顺序）。 */
function globalIndex(id: string): number {
  return CHRONICLE_PERIODS.findIndex((period) => period.id === id);
}

function readStoredOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function ChronicleMenu({ periodIndex, onSelect }: ChronicleMenuProps) {
  const [open, setOpen] = useState(readStoredOpen);
  const [collapsedEras, setCollapsedEras] = useState<ReadonlySet<ChronicleEra>>(() => new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      // localStorage 不可用时静默降级
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        className="tch-menu-toggle"
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        ☰ 编年目录
      </button>
    );
  }

  const toggleEra = (era: ChronicleEra) => {
    setCollapsedEras((current) => {
      const next = new Set(current);
      if (next.has(era)) next.delete(era);
      else next.add(era);
      return next;
    });
  };

  return (
    <aside className="tch-menu" aria-label="编年目录">
      <header className="tch-menu-head">
        <span>编年目录</span>
        <button
          type="button"
          className="tch-menu-collapse"
          aria-expanded={true}
          aria-label="收起编年目录"
          onClick={() => setOpen(false)}
        >
          −
        </button>
      </header>
      <nav aria-label="历代编年">
        {CHRONICLE_ERAS.map((era) => {
          const periods = periodsOfEra(era);
          const collapsed = collapsedEras.has(era);
          const hasCurrent = periods.some((period) => globalIndex(period.id) === periodIndex);
          return (
            <section
              key={era}
              className={cn("tch-era-group", hasCurrent && "is-current-era")}
              data-era={era}
            >
              <button
                type="button"
                className="tch-era-title"
                aria-expanded={!collapsed}
                onClick={() => toggleEra(era)}
                style={{ ["--era-color" as string]: ERA_COLORS[era] }}
              >
                <span>{ERA_LABELS[era]}</span>
                <i aria-hidden="true">{collapsed ? "+" : "−"}</i>
              </button>
              {collapsed ? null : (
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
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
