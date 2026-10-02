import { useEffect, useState } from "react";

import "./page.css";
import { startAncientChinaRuntime, stopAncientChinaRuntime } from "./runtime";

export function AncientChinaReactPage() {
  const [isFilterbarCollapsed, setIsFilterbarCollapsed] = useState(false);

  useEffect(() => {
    if (import.meta.env.MODE === "test") return;

    try {
      startAncientChinaRuntime();
    } catch (error: unknown) {
      const loading = document.getElementById("loading");
      if (loading) {
        loading.textContent =
          error instanceof Error ? `Three.js 加载失败：${error.message}` : "Three.js 加载失败";
      }
    }

    return () => stopAncientChinaRuntime();
  }, []);

  return (
    <div className="ancient-china-root">
      <div id="app">
        <div className="cosmic-flow" aria-hidden="true">
          <span className="cosmic-meteor cosmic-meteor-forward cosmic-meteor-one" />
          <span className="cosmic-meteor cosmic-meteor-forward cosmic-meteor-two" />
          <span className="cosmic-meteor cosmic-meteor-reverse cosmic-meteor-three" />
          <span className="cosmic-meteor cosmic-meteor-reverse cosmic-meteor-four" />
          <span className="cosmic-meteor cosmic-meteor-forward cosmic-meteor-five" />
          <span className="cosmic-meteor cosmic-meteor-reverse cosmic-meteor-six" />
          <span className="cosmic-impact cosmic-impact-one" />
          <span className="cosmic-impact cosmic-impact-two" />
          <span className="cosmic-impact cosmic-impact-three" />
        </div>
        <div id="cv" />
        <div id="header">
          <div className="sub">汉族朝代与少数民族朝代 (前221 — 1912)</div>
        </div>
        <div id="toolbar">
          <button type="button" id="btn-river" className="active">
            时间主轴
          </button>
          <button type="button" id="btn-wars" className="active">
            战争连线
          </button>
          <button type="button" id="btn-tribes" className="active">
            少数民族朝代
          </button>
          <button type="button" id="btn-annex" className="active">
            吞并流向
          </button>
          <button type="button" id="btn-tour">
            巡游
          </button>
          <button type="button" id="btn-reset">
            重置视角
          </button>
        </div>
        <div id="filterbar" className={isFilterbarCollapsed ? "is-collapsed" : undefined}>
          <div className="fbar-row fbar-row-title">
            <span className="fbar-label">朝代筛选</span>
            <div className="fbar-actions">
              <button
                type="button"
                id="btn-toggle-filterbar"
                className="fbar-btn"
                onClick={() => setIsFilterbarCollapsed((collapsed) => !collapsed)}
              >
                {isFilterbarCollapsed ? "展开" : "收起"}
              </button>
              <button type="button" id="btn-clear-filter" className="fbar-btn">
                清除
              </button>
            </div>
          </div>
          <div className="fbar-row fbar-collapsible" id="dyn-buttons" />
          <div className="fbar-row fbar-row-title ancient-china-year-title fbar-collapsible">
            <span className="fbar-label">时间范围</span>
            <span id="yr-display">前280 ~ 1912</span>
          </div>
          <div className="fbar-row fbar-collapsible" id="yr-row">
            <input type="range" id="yr-min" min="-280" max="1912" defaultValue="-280" step="1" />
            <input type="range" id="yr-max" min="-280" max="1912" defaultValue="1912" step="1" />
          </div>
          <div className="fbar-row yr-scale fbar-collapsible">
            <span>公元前</span>
            <span>0</span>
            <span>1912</span>
          </div>
        </div>
        <div id="legend">
          <h3>图例</h3>
          <div className="item">
            <span className="swatch ancient-china-swatch-main" />
            汉族王朝主线
            {/* 汉族王朝主线 (z=0) */}
          </div>
          <div className="item">
            <span className="swatch ancient-china-swatch-north" />
            北方游牧副线 (上方)
          </div>
          <div className="item">
            <span className="swatch ancient-china-swatch-northeast" />
            东北/渔猎副线
          </div>
          <div className="item">
            <span className="swatch ancient-china-swatch-west" />
            西部/西南副线 (下方)
          </div>
          <div className="item ancient-china-legend-divider">
            <span className="swatch ancient-china-swatch-war" />
            战争连线 (汉族 ↔ 少数民族)
          </div>
          <div className="item">
            <span className="swatch ancient-china-swatch-annex" />
            吞并流向 (少数民族 → 少数民族)
          </div>
          <div id="hint" className="ancient-china-legend-help">
            <div className="ancient-china-legend-help-row">
              <span>操作</span>
              <div className="ancient-china-legend-help-copy">
                左键拖拽旋转，滚轮缩放，右键平移视角
                <br />
                <span className="ancient-china-legend-help-highlight">Mac</span>: <kbd>⌘</kbd> +
                左键平移，<kbd>⌥</kbd> + 滚轮精细缩放
                <br />
                <span className="ancient-china-legend-help-highlight">Win</span>: <kbd>Ctrl</kbd> +
                左键平移，<kbd>Alt</kbd> + 滚轮精细缩放
              </div>
            </div>
            <div className="ancient-china-legend-help-row">
              <span>详情</span>
              点击主线朝代、副线族群或战争弧线查看面板
            </div>
            <div className="ancient-china-legend-help-row">
              <span>人物</span>
              在详情面板内悬停彩色人物徽章查看词卡
            </div>
          </div>
        </div>
        <div id="panel">
          <button type="button" id="close-btn" aria-label="关闭朝代详情">
            ×
          </button>
          <div className="panel-head">
            <div className="p-header">
              <h2 id="p-title">—</h2>
              <div className="tribes" id="p-tribes" />
            </div>
            <div className="meta" id="p-meta">
              —
            </div>
            <div className="tabs">
              <button type="button" className="tab active" data-tab="all">
                综合时间线
              </button>
              <button type="button" className="tab" data-tab="relation">
                关系
              </button>
              <button type="button" className="tab" data-tab="event">
                事件
              </button>
              <button type="button" className="tab" data-tab="war">
                战争
              </button>
              <button type="button" className="tab" data-tab="people">
                人物
              </button>
            </div>
          </div>
          <div id="p-timeline" />
        </div>
        <div id="minority-panel">
          <button type="button" id="mp-close" aria-label="关闭少数民族详情">
            ×
          </button>
          <h2 id="mp-title">—</h2>
          <div className="meta" id="mp-meta">
            —
          </div>
          <div className="mp-desc" id="mp-desc" />
          <h3 className="mp-section-title">相关战争</h3>
          <div id="mp-wars" />
          <h3 className="mp-section-title">相关吞并事件</h3>
          <div id="mp-annex" />
        </div>
        <div id="tip" />
        <div id="person-card" />
        <div id="loading">加载中 · 3D 朝代长河</div>
      </div>
    </div>
  );
}
