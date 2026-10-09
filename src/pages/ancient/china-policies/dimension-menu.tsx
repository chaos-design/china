import { memo } from "react";

interface DimensionMenuProps {
  /** 当前朝代拥有的维度 key（每个朝代的维度集合可能略有不同）。 */
  dims: string[];
  /** 当前选中的维度 key。 */
  active: string;
  /** 选择某个维度。 */
  onSelect: (key: string) => void;
}

/**
 * 「朝代维度」菜单：政策全览页左侧独立的一栏，纵向列出当前朝代的
 * 权谋 / 军事 / 科技 / 民生 / 文·医·农·商 / 灾荒 / 法律 / 疆域 / 官制 / 工艺 等维度。
 *
 * 它放在朝代菜单与图例之间，随朝代切换刷新条目；整栏在 .timeline-wrap 里，
 * 右侧 .main-wrap 滚到哪里都不会带动它。条目多放不下时，本栏自己出现内部滚动条，
 * 而不是把滚动交给外层内容区。
 */
export const DimensionMenu = memo(function DimensionMenu({
  dims,
  active,
  onSelect,
}: DimensionMenuProps) {
  return (
    <nav className="dimension-menu" aria-label="朝代维度">
      <div className="dimension-title">朝 代 维 度</div>
      <ul className="dim-menu-list">
        {dims.map((key) => (
          <li key={key}>
            <button
              type="button"
              className={`dim-tab dim-tab-vertical${key === active ? " active" : ""}`}
              aria-current={key === active ? "true" : undefined}
              onClick={() => onSelect(key)}
            >
              {key}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
});
