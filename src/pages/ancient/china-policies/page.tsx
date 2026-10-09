import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { DynastyMenu } from "./dynasty-menu";
import "./page.css";
import { DYNASTIES, GLOSSARY } from "./data";
import { parseTerms } from "./parse";
import { isPolicyFigureId, PolicyFigure } from "./policy-figures";
import type { PolicyCard as PolicyCardData } from "./types";

interface ParsedTextProps {
  as?: "div" | "p" | "span";
  className?: string;
  html: string;
}

function ParsedText({ as: Tag = "span", className, html }: ParsedTextProps) {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local data rendered with term highlighting
    <Tag className={className} dangerouslySetInnerHTML={{ __html: parseTerms(html) }} />
  );
}

function getPlainCardTitle(title: string) {
  return title.replace(/\[\[(.*?)\]\]/g, "$1");
}

interface PolicyCardViewProps {
  card: PolicyCardData;
  onFigureClick: (figure: { id: PolicyCardData["figure"]; title: string }) => void;
}

// memo + 稳定的 onFigureClick：切换维度/朝代时，同一批卡片的 props 不变，
// 重渲染会被整块跳过（卡片里的术语高亮、SVG 图都是纯函数式的重活）。
const PolicyCardView = memo(function PolicyCardView({ card, onFigureClick }: PolicyCardViewProps) {
  const figureTitle = getPlainCardTitle(card.title);
  const figure = card.figure && isPolicyFigureId(card.figure) ? card.figure : null;

  return (
    <Card className="policy-card">
      <CardHeader>
        <CardTitle>
          <ParsedText html={card.title} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {card.bg ? <ParsedText as="div" className="meta-row" html={`【背景】${card.bg}`} /> : null}
        {card.content ? (
          <p>
            <strong>【内容】</strong>
            <ParsedText html={card.content} />
          </p>
        ) : null}
        {card.steps?.length ? (
          <div className="craft-steps">
            <span className="step-title">【古法工序】</span>
            <ol>
              {card.steps.map((step) => (
                <li key={step}>
                  <ParsedText html={step} />
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {card.impact ? (
          <p>
            <strong>【影响】</strong>
            <ParsedText html={card.impact} />
          </p>
        ) : null}
        {figure ? (
          <div className="card-img">
            <button
              type="button"
              className="policy-figure-button"
              onClick={() => onFigureClick({ id: figure, title: figureTitle })}
            >
              <PolicyFigure className="policy-figure" id={figure} title={figureTitle} />
            </button>
            {card.cap ? <span className="cap">{card.cap}</span> : null}
            <span className="img-hint">点击图形可放大查看</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
});

export function AncientChinaPoliciesReactPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dimState, setDimState] = useState<Record<string, string>>({});
  const [lightboxFigure, setLightboxFigure] = useState<{
    id: NonNullable<PolicyCardData["figure"]>;
    title: string;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const tipTitleRef = useRef<HTMLDivElement>(null);
  const tipTypeRef = useRef<HTMLSpanElement>(null);
  const tipBodyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainWrapRef = useRef<HTMLDivElement>(null);

  const dynasty = DYNASTIES[currentIdx];
  const dimKeys = useMemo(() => Object.keys(dynasty.dimensions), [dynasty]);
  const activeDim =
    dimState[dynasty.id] && dynasty.dimensions[dimState[dynasty.id]]
      ? dimState[dynasty.id]
      : dimKeys[0];

  const introHtml = useMemo(() => parseTerms(dynasty.intro), [dynasty]);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= DYNASTIES.length) return;
    setCurrentIdx(idx);
    if (mainWrapRef.current) {
      mainWrapRef.current.scrollTop = 0;
    }
  }, []);

  // 稳定引用：配合 PolicyCardView 的 memo，切换维度时未变的卡片不会重渲染
  const openFigure = useCallback(
    ({ id, title }: { id: PolicyCardData["figure"]; title: string }) => {
      if (id) setLightboxFigure({ id, title });
    },
    [],
  );

  // Scroll the active timeline node into view when the dynasty changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on dynasty change to scroll the new active node
  useEffect(() => {
    const node = trackRef.current?.querySelector<HTMLElement>(".tl-node.active");
    if (node?.scrollIntoView) {
      try {
        node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      } catch {
        // ignore environments without smooth scroll support
      }
    }
  }, [currentIdx]);

  // Keyboard navigation: arrows switch dynasties.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "Escape") {
        setLightboxFigure(null);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(currentIdx - 1);
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(currentIdx + 1);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [currentIdx, goTo]);

  // Tooltip via event delegation on the root, matching the legacy implementation.
  // Updated through direct DOM writes so showing/moving the tooltip never re-renders
  // the (very large) policy content subtree.
  useEffect(() => {
    const root = rootRef.current;
    const tipEl = tooltipRef.current;
    if (!root || !tipEl) return;
    const tip: HTMLDivElement = tipEl;

    function moveTooltip(clientX: number, clientY: number) {
      const pad = 14;
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      let x = clientX + pad;
      let y = clientY + pad;
      if (x + w + 8 > window.innerWidth) x = clientX - w - pad;
      if (y + h + 8 > window.innerHeight) y = clientY - h - pad;
      if (x < 4) x = 4;
      if (y < 4) y = 4;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    }

    function onMouseOver(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-term]");
      if (!el) return;
      const key = el.getAttribute("data-term") ?? "";
      const item = GLOSSARY[key];
      if (!item) return;
      if (tipTitleRef.current) tipTitleRef.current.textContent = item.title || key;
      if (tipTypeRef.current) tipTypeRef.current.textContent = item.type || "";
      if (tipBodyRef.current) tipBodyRef.current.textContent = item.body || "";
      tip.classList.add("show");
      moveTooltip(e.clientX, e.clientY);
    }
    function onMouseMove(e: MouseEvent) {
      if (!tip.classList.contains("show")) return;
      if ((e.target as HTMLElement).closest("[data-term]")) moveTooltip(e.clientX, e.clientY);
    }
    function onMouseOut(e: MouseEvent) {
      if ((e.target as HTMLElement).closest?.("[data-term]")) {
        tip.classList.remove("show");
      }
    }

    root.addEventListener("mouseover", onMouseOver);
    root.addEventListener("mousemove", onMouseMove);
    root.addEventListener("mouseout", onMouseOut);
    return () => {
      root.removeEventListener("mouseover", onMouseOver);
      root.removeEventListener("mousemove", onMouseMove);
      root.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  return (
    <div className="acp-root" ref={rootRef}>
      <div className="layout">
        <aside className="timeline-wrap">
          <DynastyMenu
            activeIndex={currentIdx}
            dynasties={DYNASTIES}
            onSelect={goTo}
            trackRef={trackRef}
          />
          <aside className="legend-panel timeline-legend" aria-label="图例说明">
            <div className="legend-heading">
              <strong>图例</strong>
              <span className="legend-hint">悬停查看详细解释</span>
            </div>
            <div className="legend-items">
              <span className="hl-person">历史人物</span>
              <span className="hl-policy">核心政策</span>
              <span className="hl-system">制度机构</span>
            </div>
          </aside>
        </aside>

        <div className="main-wrap" ref={mainWrapRef}>
          <main>
            <div id="contentArea">
              <section className="dynasty" key={dynasty.id}>
                <h2>
                  {dynasty.fullName} <span className="era">{dynasty.era}</span>
                </h2>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local data rendered with term highlighting */}
                <div className="intro" dangerouslySetInnerHTML={{ __html: introHtml }} />

                <div className="dim-tabs">
                  {dimKeys.map((k) => (
                    <button
                      type="button"
                      key={k}
                      className={`dim-tab${k === activeDim ? " active" : ""}`}
                      onClick={() => setDimState((prev) => ({ ...prev, [dynasty.id]: k }))}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* 只挂载当前维度。以前 10 个维度全部渲染、非当前项用 display:none 藏着，
                    385 张卡片 + 术语解析在首屏一次性构建；既然隐藏的分区没有任何可见价值，
                    就只在选中时构建对应的卡片子树。 */}
                {activeDim ? (
                  <div className="dim-section active" data-dim={activeDim}>
                    {dynasty.dimensions[activeDim].map((card, cardIndex) => (
                      <PolicyCardView
                        card={card}
                        key={`${activeDim}-${cardIndex}`}
                        onFigureClick={openFigure}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          </main>
        </div>
      </div>

      <div ref={tooltipRef} className="acp-tooltip" style={{ left: 0, top: 0 }}>
        <div className="tip-title">
          <span ref={tipTitleRef} />
          <span ref={tipTypeRef} className="tip-type" />
        </div>
        <div ref={tipBodyRef} className="tip-body" />
      </div>

      <button
        type="button"
        aria-label="关闭放大图"
        className={`acp-lightbox-mask${lightboxFigure ? " active" : ""}`}
        onClick={() => setLightboxFigure(null)}
      >
        <span className="acp-lightbox-close">×</span>
        {lightboxFigure ? (
          <PolicyFigure
            className="acp-lightbox-figure"
            id={lightboxFigure.id}
            title={`放大图：${lightboxFigure.title}`}
          />
        ) : null}
      </button>
    </div>
  );
}
