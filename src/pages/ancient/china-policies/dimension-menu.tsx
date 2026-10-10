import { memo, useCallback, useState } from "react";

interface DimensionMenuProps {
  /** 当前朝代拥有的维度 key（每个朝代的维度集合可能略有不同）。 */
  dims: string[];
  /** 当前选中的维度 key。 */
  active: string;
  /** 选择某个维度。 */
  onSelect: (key: string) => void;
}

interface DimTip {
  text: string;
  left: number;
  top: number;
}

// 气泡一行能容纳的最长维度名（12 字，如「民生·摊丁入亩·火耗归公」）的保守宽度/高度。
const TIP_W = 150;
const TIP_H = 30;

/**
 * 「朝代维度」菜单：政策全览页左侧独立的一栏，纵向列出当前朝代的
 * 权谋 / 军事 / 科技 / 民生 / 文·医·农·商 / 灾荒 / 法律 / 疆域 / 官制 / 工艺 等维度。
 *
 * 它放在朝代菜单与图例之间，随朝代切换刷新条目；整栏在 .timeline-wrap 里，
 * 右侧 .main-wrap 滚到哪里都不会带动它。条目多放不下时，本栏自己出现内部滚动条，
 * 而不是把滚动交给外层内容区。
 *
 * 长维度名在 168px 卡片里会被省略号截断。hover / 键盘聚焦时弹出一枚
 * position:fixed 的 .dim-tip 气泡，相对视口定位（逃开 .dimension-wrap /
 * .dim-menu-list 的 overflow 裁剪），完整展示维度名；贴到视口右缘自动翻到左侧。
 * 按钮上的原生 title 再兜一层。
 */
export const DimensionMenu = memo(function DimensionMenu({
  dims,
  active,
  onSelect,
}: DimensionMenuProps) {
  const [tip, setTip] = useState<DimTip | null>(null);

  const showTip = useCallback((key: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    // 默认弹在条目右侧；右侧放不下（超出视口右缘）就翻到左侧。
    let left = r.right + 10;
    if (left + TIP_W > window.innerWidth - 8) {
      left = r.left - TIP_W - 10;
    }
    left = Math.max(8, left);
    // 垂直居中于条目，并钳制在视口内。
    let top = r.top + r.height / 2 - TIP_H / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - TIP_H - 8));
    setTip({ text: key, left, top });
  }, []);

  const hideTip = useCallback(() => {
    setTip(null);
  }, []);

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
              title={key}
              onMouseEnter={(event) => showTip(key, event.currentTarget)}
              onMouseLeave={hideTip}
              onFocus={(event) => showTip(key, event.currentTarget)}
              onBlur={hideTip}
              onClick={() => onSelect(key)}
            >
              {key}
            </button>
          </li>
        ))}
      </ul>

      {tip ? (
        <span className="dim-tip" role="tooltip" style={{ left: tip.left, top: tip.top }}>
          {tip.text}
        </span>
      ) : null}
    </nav>
  );
});
