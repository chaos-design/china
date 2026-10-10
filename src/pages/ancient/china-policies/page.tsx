import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import "./page.css";
import { DYNASTIES, GLOSSARY } from "./data";
import { normalizePunctuation, parseTerms } from "./parse";
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

/** Split a craft step into its leading name (before the first colon) and body.
 * Step strings look like "选料：取上等[[赤铜]]…" — the name may itself carry
 * [[term]] markup, so it is rendered through the same pipeline as the body. */
function splitCraftStep(step: string): { name: string | null; body: string | null } {
  const match = step.match(/^(.+?)[：:](.*)$/);
  if (!match) return { name: null, body: step };
  return { name: match[1], body: match[2] || null };
}

interface PolicyCardViewProps {
  card: PolicyCardData;
  onFigureClick: (figure: { id: PolicyCardData["figure"]; title: string }) => void;
}

function PolicyCardView({ card, onFigureClick }: PolicyCardViewProps) {
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
            <div className="craft-flow" aria-hidden="true">
              {card.steps.map((step, i) => {
                const label = (step.match(/^([^：:]+)[：:]/)?.[1] ?? step).replace(
                  /\[\[[^\]|]+(?:\|[^\]]+)?\]\]/g,
                  "",
                );
                return (
                  <span key={i} className="craft-flow-node">
                    <span className="craft-flow-index">{i + 1}</span>
                    <span className="craft-flow-label">{label}</span>
                    {i < card.steps!.length - 1 ? (
                      <span className="craft-flow-arrow">→</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
            <ol className="craft-steps-list">
              {card.steps.map((step) => {
                const { name, body } = splitCraftStep(step);
                return (
                  <li key={step} className={name ? "has-name" : undefined}>
                    <span className="craft-step-body">
                      {name ? <ParsedText className="craft-step-name" html={name} /> : null}
                      {name && body ? <span className="craft-step-sep">：</span> : null}
                      {body ? <ParsedText html={body} /> : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
        {card.impact ? (
          // The 官制·职级对照 cards embed a <div class="rank-tbl"> comparison table
          // inside the impact string, so render those in a div context; every other
          // impact is plain prose and keeps the original <p> layout.
          card.impact.includes("<div") ? (
            <div className="impact-block">
              <span className="impact-label">【影响】</span>
              <ParsedText as="div" html={card.impact} />
            </div>
          ) : (
            <p>
              <strong>【影响】</strong>
              <ParsedText html={card.impact} />
            </p>
          )
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
}

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

  // Switching the active dimension re-renders the card stack, so snap the content
  // back to the top — otherwise the user stays pinned to the previous dimension's
  // scroll position while new, shorter content fills the viewport.
  const switchDim = useCallback(
    (key: string) => {
      setDimState((prev) => ({ ...prev, [dynasty.id]: key }));
      if (mainWrapRef.current) {
        mainWrapRef.current.scrollTop = 0;
      }
    },
    [dynasty.id],
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
      if (tipTitleRef.current)
        tipTitleRef.current.textContent = normalizePunctuation(item.title || key);
      if (tipTypeRef.current) tipTypeRef.current.textContent = item.type || "";
      if (tipBodyRef.current)
        tipBodyRef.current.textContent = normalizePunctuation(item.body || "");
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
          <div className="timeline-title">中 国 朝 代</div>
          <div className="timeline">
            <div className="timeline-track" ref={trackRef}>
              {DYNASTIES.map((d, i) => (
                <button
                  type="button"
                  key={d.id}
                  className={`tl-node${i === currentIdx ? " active" : ""}`}
                  onClick={() => goTo(i)}
                >
                  <div className="dot-row">
                    <div className="dot" />
                  </div>
                  <div className="info">
                    <div className="name">{d.name}</div>
                    <div className="era">{d.era}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
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
                      onClick={() => switchDim(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {dimKeys.map((k) => (
                  <div
                    key={k}
                    className={`dim-section${k === activeDim ? " active" : ""}`}
                    data-dim={k}
                  >
                    {dynasty.dimensions[k].map((card, ci) => (
                      <PolicyCardView
                        card={card}
                        key={`${k}-${ci}`}
                        onFigureClick={({ id, title }) => {
                          if (id) setLightboxFigure({ id, title });
                        }}
                      />
                    ))}
                  </div>
                ))}
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
