import { memo, type Ref } from "react";

import type { Dynasty } from "./types";

interface DynastyMenuProps {
  activeIndex: number;
  dynasties: Dynasty[];
  onSelect: (index: number) => void;
  /** 时间轴轨道节点，父级用它把当前项滚进可视区。 */
  trackRef?: Ref<HTMLDivElement>;
}

/**
 * 「中国朝代」菜单：政策全览页左侧独立的一栏。
 *
 * 它只负责朝代切换，不参与右侧内容的滚动。整栏是 `.layout` 里固定高度的 flex 项，
 * 页面滚动（实际发生在右侧 `.main-wrap` 内部）永远不会把它带走；只有当视口矮到
 * 9 个朝代都放不下时，这一栏自己才会出现内部滚动条。
 *
 * `dynasty-menu.tsx` 是独立文件而不是内联在 page.tsx 里：它是一个自洽的导航单元，
 * 与「内容区」的渲染完全解耦，父级只传当前选中项和回调。
 */
export const DynastyMenu = memo(function DynastyMenu({
  activeIndex,
  dynasties,
  onSelect,
  trackRef,
}: DynastyMenuProps) {
  return (
    <aside className="dynasty-menu" aria-label="中国朝代">
      <div className="timeline-title">中 国 朝 代</div>
      <div className="timeline">
        <div className="timeline-track" ref={trackRef}>
          {dynasties.map((dynasty, index) => (
            <button
              type="button"
              key={dynasty.id}
              className={`tl-node${index === activeIndex ? " active" : ""}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => onSelect(index)}
            >
              <div className="dot-row">
                <div className="dot" />
              </div>
              <div className="info">
                <div className="name">{dynasty.name}</div>
                <div className="era">{dynasty.era}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
});
