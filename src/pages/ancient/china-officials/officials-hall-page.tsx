import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { cn } from "../../../lib/utils";
import type { OfficialGrade, OfficialsDynastyId } from "./officials-data";
import { countPosts, findPost, getOfficialsDynasty, OFFICIALS_DYNASTIES } from "./officials-data";
import type { HallPreset, HallScene, HallSpacing } from "./officials-hall-scene";
import { createHallScene, readHallColors } from "./officials-hall-scene";
import type { BranchFilter, GradeProjection } from "./officials-hud";
import { layoutHudRows, postsByBranch } from "./officials-hud";

const PRESETS: readonly { id: HallPreset; label: string }[] = [
  { id: "three-quarter", label: "斜侧" },
  { id: "front", label: "正视" },
  { id: "overlook", label: "俯瞰" },
];

const BRANCH_FILTERS: readonly { id: BranchFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "civil", label: "文官" },
  { id: "military", label: "武官" },
];

const SPACINGS: readonly { id: HallSpacing; label: string }[] = [
  { id: "roomy", label: "舒展" },
  { id: "compact", label: "紧凑" },
];

function Choice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded-md border px-2 py-1 font-body text-[0.7rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-vermillion/45 bg-vermillion/15 text-vermillion"
          : "border-ink/15 bg-card/60 text-muted-foreground hover:border-vermillion/30 hover:text-ink",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function MenuRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono-tech text-[0.62rem] text-muted-foreground tracking-[0.2em]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function OfficeChip({
  active,
  branch,
  title,
  onClick,
}: {
  active: boolean;
  branch: "civil" | "military";
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded border px-2 py-1 text-left font-body text-[0.78rem] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-vermillion/50 bg-vermillion/15 text-vermillion"
          : branch === "military"
            ? "border-blueprint/25 bg-blueprint/5 text-ink hover:border-blueprint/50"
            : "border-vermillion/25 bg-vermillion/5 text-ink hover:border-vermillion/50",
      )}
      onClick={onClick}
      type="button"
    >
      {title}
    </button>
  );
}

function GradeCard({
  active,
  branchFilter,
  grade,
  onPickPost,
  onRegister,
  selectedTitle,
}: {
  active: boolean;
  branchFilter: BranchFilter;
  grade: OfficialGrade;
  onPickPost: (title: string) => void;
  onRegister: (id: string, element: HTMLElement | null) => void;
  selectedTitle: string | null;
}) {
  const grouped = postsByBranch(grade, branchFilter);

  return (
    <section
      aria-label={`${grade.label}官职名录`}
      className={cn(
        "pointer-events-auto relative rounded-xl border bg-card/80 p-2.5 shadow-[0_10px_28px_hsl(var(--ink)/0.1)] backdrop-blur-md lg:absolute lg:right-0 lg:left-0 lg:max-h-[var(--hall-card-max-h,136px)] lg:overflow-y-auto lg:top-[var(--hall-row-y)] lg:-translate-y-1/2",
        active ? "border-vermillion/45 bg-paper/85" : "border-ink/12",
      )}
      ref={(element) => {
        onRegister(grade.id, element);
      }}
    >
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="font-brush text-xl text-ink">{grade.label}</h3>
        {grade.approx ? (
          <span className="rounded border border-dashed border-ochre px-1 font-body text-[0.68rem] text-ochre">
            {grade.approx}
          </span>
        ) : null}
        <span className="font-mono-tech text-[0.68rem] text-muted-foreground">
          {grade.posts.length} 官 · 文 {grouped.civil.length} / 武 {grouped.military.length}
        </span>
      </header>
      <p className="mt-0.5 text-[0.75rem] text-muted-foreground leading-snug">{grade.caption}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {(
          [
            { key: "civil", label: "文官", posts: grouped.civil },
            { key: "military", label: "武官", posts: grouped.military },
          ] as const
        ).map((group) => (
          <div className="flex min-w-0 flex-col gap-1" key={group.key}>
            <span
              className={cn(
                "flex items-center gap-1 font-mono-tech text-[0.66rem] tracking-[0.12em]",
                group.key === "civil" ? "text-vermillion" : "text-blueprint",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  group.key === "civil" ? "bg-vermillion" : "bg-blueprint",
                )}
              />
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1">
              {group.posts.length === 0 ? (
                <span className="text-[0.72rem] text-muted-foreground">本级无</span>
              ) : (
                group.posts.map((item) => (
                  <OfficeChip
                    active={selectedTitle === item.title}
                    branch={group.key}
                    key={item.title}
                    onClick={() => {
                      onPickPost(item.title);
                    }}
                    title={item.title}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 品秩全景：全屏立体官职体系。
 * 3D 场景只以品级为节点；右侧名录按文 / 武分列标注具体官职，
 * 点官职在「该品级所在的同一层级」展开详情抽屉，不切页、不新增立体节点。
 */
export function OfficialsHallPage() {
  const [dynastyId, setDynastyId] = useState<OfficialsDynastyId>("qin");
  const [branchFilter, setBranchFilter] = useState<BranchFilter>("all");
  const [preset, setPreset] = useState<HallPreset | null>("three-quarter");
  const [autoRotate, setAutoRotate] = useState(false);
  const [spacing, setSpacing] = useState<HallSpacing>("roomy");
  const [focusedGradeId, setFocusedGradeId] = useState<string | null>(
    OFFICIALS_DYNASTIES[0]?.grades[0]?.id ?? null,
  );
  const [hoverGradeId, setHoverGradeId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ gradeId: string; title: string } | null>(null);
  const [failed, setFailed] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HallScene | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const lineRefs = useRef(new Map<string, SVGLineElement>());
  const focusedRef = useRef<string | null>(focusedGradeId);
  const mobileRef = useRef(false);
  const spacingRef = useRef(spacing);
  spacingRef.current = spacing;

  const dynasty = getOfficialsDynasty(dynastyId) ?? OFFICIALS_DYNASTIES[0]!;
  const activeGradeId = selected?.gradeId ?? focusedGradeId;
  focusedRef.current = activeGradeId;

  const detail = useMemo(
    () => (selected ? findPost(dynasty, selected.gradeId, selected.title) : null),
    [dynasty, selected],
  );
  const totalPosts = useMemo(() => countPosts(dynasty), [dynasty]);

  const pickRef = useRef<(id: string | null) => void>(() => {});
  const hoverRef = useRef<(id: string | null) => void>(() => {});

  const handleFrame = useCallback((projections: GradeProjection[]) => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    if (mobileRef.current) {
      for (const card of cardRefs.current.values()) {
        card.style.removeProperty("--hall-row-y");
      }
      return;
    }
    const height = host.clientHeight;
    if (height === 0) {
      return;
    }
    const gap = Math.min(140, (height - 150) / Math.max(1, projections.length - 1));
    // 卡片最大高度 = 行间距 - 12px：相邻卡片中心至少相距 gap，卡高不超过 gap-12，
    // 保证任意视口 / 品级数量下右侧名录都不重叠，超量内容在卡内滚动。
    const cardMaxHeight = Math.max(48, gap - 12);
    const rows = layoutHudRows(projections, {
      minGap: gap,
      minY: 76,
      maxY: height - 76,
    });
    const hostRect = host.getBoundingClientRect();
    const railRect = railRef.current?.getBoundingClientRect();
    const railLeft = railRect ? railRect.left - hostRect.left : hostRect.width - 420;

    for (const row of rows) {
      const card = cardRefs.current.get(row.id);
      card?.style.setProperty("--hall-row-y", `${row.rowY}px`);
      card?.style.setProperty("--hall-card-max-h", `${cardMaxHeight}px`);
      const line = lineRefs.current.get(row.id);
      if (line) {
        line.setAttribute("x1", String(row.x));
        line.setAttribute("y1", String(row.y));
        line.setAttribute("x2", String(Math.max(0, railLeft - 10)));
        line.setAttribute("y2", String(row.rowY));
      }
    }

    const activeRow = rows.find((row) => row.id === focusedRef.current);
    const drawerHalf = Math.min(215, height / 2 - 20);
    const drawerY = Math.min(
      height - drawerHalf,
      Math.max(drawerHalf, activeRow?.rowY ?? height / 2),
    );
    rootRef.current?.style.setProperty("--hall-drawer-y", `${drawerY}px`);
  }, []);

  pickRef.current = (gradeId) => {
    if (!gradeId) {
      setSelected(null);
      return;
    }
    setFocusedGradeId(gradeId);
    setSelected(null);
    sceneRef.current?.focusGrade(gradeId);
  };
  hoverRef.current = setHoverGradeId;

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      mobileRef.current = !query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const scene = createHallScene(host, readHallColors(host), {
      onFrame: handleFrame,
      onGradeHover: (gradeId) => {
        hoverRef.current(gradeId);
      },
      onGradePick: (gradeId) => {
        pickRef.current(gradeId);
      },
      onUnavailable: () => {
        setFailed(true);
      },
    });
    if (!scene) {
      setFailed(true);
      return;
    }
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [handleFrame]);

  useEffect(() => {
    sceneRef.current?.setDynasty(dynasty, { spacing: spacingRef.current });
  }, [dynasty]);

  useEffect(() => {
    sceneRef.current?.setSpacing(spacing);
  }, [spacing]);

  useEffect(() => {
    sceneRef.current?.setActiveGrade(activeGradeId);
  }, [activeGradeId]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  const chooseDynasty = (id: OfficialsDynastyId) => {
    const next = getOfficialsDynasty(id);
    if (!next) {
      return;
    }
    setDynastyId(id);
    setSelected(null);
    setFocusedGradeId(next.grades[0]?.id ?? null);
  };

  const chooseBranch = (next: BranchFilter) => {
    setBranchFilter(next);
    setSelected(null);
  };

  const applyPreset = (next: HallPreset) => {
    setPreset(next);
    setAutoRotate(false);
    sceneRef.current?.applyPreset(next);
  };

  const openPost = (gradeId: string, title: string) => {
    setSelected({ gradeId, title });
    setFocusedGradeId(gradeId);
  };

  const registerCard = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  return (
    <article
      className="relative min-h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_42%_36%,hsl(var(--ink)/0.09),transparent_62%)] lg:h-full"
      ref={rootRef}
      style={{ "--hall-drawer-y": "50%" } as CSSProperties}
    >
      <div
        aria-label={`${dynasty.name}官职体系立体场景：${dynasty.grades.length} 个品级节点、${totalPosts} 个具体官职。拖拽旋转、滚轮缩放、点击品级台定位；右侧名录可展开同层官职详情。`}
        className="relative h-[54vh] w-full lg:absolute lg:inset-0 lg:h-full"
        ref={hostRef}
        role="img"
      />

      {failed ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 grid h-[54vh] place-items-center bg-paper/80 p-6 text-center lg:h-full">
          <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
            当前浏览器未能启用 WebGL，立体品级台无法绘制。右侧名录、官职详情与人物示例仍可完整浏览。
          </p>
        </div>
      ) : null}

      {/* 桌面端 HUD：投影引线把每个品级节点连到同高的名录卡片 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
          {dynasty.grades.map((grade) => (
            <line
              className={cn(
                "transition-colors",
                activeGradeId === grade.id || hoverGradeId === grade.id
                  ? "text-vermillion/70"
                  : "text-ink/20",
              )}
              key={grade.id}
              ref={(element) => {
                if (element) {
                  lineRefs.current.set(grade.id, element);
                } else {
                  lineRefs.current.delete(grade.id);
                }
              }}
              stroke="currentColor"
              strokeDasharray="3 5"
              strokeWidth="1"
            />
          ))}
        </svg>
        <div className="absolute inset-y-0 right-4 w-[min(34vw,410px)]" ref={railRef} />
        <p className="absolute bottom-4 left-5 font-mono-tech text-[0.66rem] text-muted-foreground tracking-[0.08em]">
          拖拽旋转 · 滚轮缩放 · 点击品级台定位 · 点名录官职展开同层详情
        </p>
      </div>

      {/* 左侧悬浮：朝代切换 + 操作菜单 */}
      <aside
        aria-label="朝代与操作菜单"
        className="relative z-20 mx-4 -mt-14 rounded-2xl border border-ink/15 bg-paper/85 p-4 shadow-[0_18px_48px_hsl(var(--ink)/0.14)] backdrop-blur-xl lg:absolute lg:top-5 lg:left-5 lg:mx-0 lg:mt-0 lg:w-[272px] lg:max-h-[calc(100%-2.5rem)] lg:overflow-y-auto"
      >
        <div className="flex flex-col gap-1">
          <span className="font-mono-tech text-[0.62rem] text-vermillion tracking-[0.26em]">
            全屏立体 · 官职体系
          </span>
          <h1 className="font-brush text-3xl text-ink">品秩全景</h1>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-brush text-xl text-vermillion">{dynasty.name}</span>
            <span className="font-mono-tech text-[0.66rem] text-muted-foreground">
              {dynasty.period}
            </span>
          </div>
          <span className="w-fit rounded-full border border-vermillion/30 bg-vermillion/10 px-2 py-0.5 font-body text-[0.68rem] text-vermillion">
            {dynasty.system}
          </span>
        </div>

        <p className="mt-2 text-[0.72rem] text-muted-foreground leading-relaxed">
          {dynasty.summary}
        </p>

        <div className="mt-3 flex flex-col gap-3 border-ink/10 border-t pt-3">
          <MenuRow label="朝代切换">
            <div className="grid w-full grid-cols-4 gap-1.5">
              {OFFICIALS_DYNASTIES.map((item) => (
                <button
                  aria-pressed={item.id === dynastyId}
                  className={cn(
                    "rounded-md border px-1 py-1.5 font-brush text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    item.id === dynastyId
                      ? "border-vermillion/45 bg-vermillion/15 text-vermillion"
                      : "border-ink/15 bg-card/60 text-ink hover:border-vermillion/30 hover:bg-vermillion/5",
                  )}
                  key={item.id}
                  onClick={() => {
                    chooseDynasty(item.id);
                  }}
                  type="button"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </MenuRow>

          <MenuRow label="视角">
            {PRESETS.map((item) => (
              <Choice
                active={preset === item.id}
                key={item.id}
                label={item.label}
                onClick={() => {
                  applyPreset(item.id);
                }}
              />
            ))}
          </MenuRow>

          <MenuRow label="层级间距">
            {SPACINGS.map((item) => (
              <Choice
                active={spacing === item.id}
                key={item.id}
                label={item.label}
                onClick={() => {
                  setSpacing(item.id);
                }}
              />
            ))}
          </MenuRow>

          <MenuRow label="名录筛选">
            {BRANCH_FILTERS.map((item) => (
              <Choice
                active={branchFilter === item.id}
                key={item.id}
                label={item.label}
                onClick={() => {
                  chooseBranch(item.id);
                }}
              />
            ))}
          </MenuRow>

          <MenuRow label="场景操作">
            <Choice
              active={autoRotate}
              label={autoRotate ? "停止旋转" : "自动旋转"}
              onClick={() => {
                setAutoRotate((previous) => !previous);
                setPreset(null);
              }}
            />
            <Choice
              active={false}
              label="重置视角"
              onClick={() => {
                setPreset("three-quarter");
                setAutoRotate(false);
                sceneRef.current?.resetView();
              }}
            />
          </MenuRow>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 border-ink/10 border-t pt-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.66rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-vermillion" />
              文官
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blueprint" />
              武官
            </span>
            <span>
              {dynasty.grades.length} 级 · {totalPosts} 官
            </span>
          </div>
          <p className="font-mono-tech text-[0.6rem] text-muted-foreground/80 leading-relaxed">
            出处 · {dynasty.source}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            <Link
              className="font-body text-[0.7rem] text-vermillion underline decoration-vermillion/40 underline-offset-4 hover:decoration-vermillion"
              to="/china/ranks"
            >
              品级纵横
            </Link>
            <Link
              className="font-body text-[0.7rem] text-muted-foreground underline decoration-ink/25 underline-offset-4 hover:text-ink"
              to="/"
            >
              返回全览
            </Link>
          </div>
        </div>
      </aside>

      {/* 品级名录：桌面端绝对定位随投影同高，移动端顺序铺开 */}
      <div className="pointer-events-none relative z-10 mt-4 flex flex-col gap-3 px-4 pb-8 lg:absolute lg:inset-y-0 lg:right-4 lg:mt-0 lg:w-[min(34vw,410px)] lg:overflow-visible lg:px-0 lg:pb-0">
        {dynasty.grades.map((grade) => (
          <GradeCard
            active={activeGradeId === grade.id || hoverGradeId === grade.id}
            branchFilter={branchFilter}
            grade={grade}
            key={grade.id}
            onPickPost={(title) => {
              openPost(grade.id, title);
            }}
            onRegister={registerCard}
            selectedTitle={selected?.gradeId === grade.id ? selected.title : null}
          />
        ))}
      </div>

      {/* 同层详情抽屉：始终跟随所选品级的高度，不切页、不新增立体节点 */}
      {selected && detail ? (
        <aside
          aria-label="官职详情"
          className="fixed inset-x-3 bottom-3 z-40 max-h-[72vh] overflow-y-auto rounded-2xl border border-vermillion/30 bg-paper p-5 shadow-[0_24px_64px_hsl(var(--ink)/0.24)] backdrop-blur-xl lg:absolute lg:inset-x-auto lg:right-5 lg:bottom-auto lg:top-[var(--hall-drawer-y)] lg:w-[min(33vw,400px)] lg:max-h-[min(56vh,420px)] lg:-translate-y-1/2"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.16em]">
              {dynasty.name} · {detail.grade.label} ·{" "}
              {detail.post.branch === "civil" ? "文官" : "武官"}
            </span>
            <button
              aria-label="关闭官职详情"
              className="shrink-0 rounded-full border border-ink/15 px-2 py-0.5 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/40 hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                setSelected(null);
              }}
              type="button"
            >
              收起
            </button>
          </div>

          <h2 className="mt-1 font-brush text-3xl text-ink">{detail.post.title}</h2>
          <p className="mt-1 font-mono-tech text-[0.78rem] text-vermillion tracking-[0.08em]">
            {detail.grade.label}
            {detail.grade.approx ? ` · ${detail.grade.approx}` : ""}
            {detail.post.rankNote ? ` · ${detail.post.rankNote}` : ""}
          </p>
          <p className="mt-3 text-foreground/90 text-sm leading-relaxed">{detail.post.intro}</p>
          <p className="mt-1 text-[0.75rem] text-muted-foreground leading-relaxed">
            {detail.grade.caption}
          </p>

          <div className="mt-4 border-ink/10 border-t pt-3">
            <h3 className="font-mono-tech text-[0.75rem] text-vermillion tracking-[0.2em]">
              相关名臣 · 名将
            </h3>
            {detail.post.figures && detail.post.figures.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-2">
                {detail.post.figures.map((figure) => (
                  <li
                    className="rounded-lg border border-ink/10 bg-card/70 px-3 py-2"
                    key={figure.name}
                  >
                    <span className="font-brush text-lg text-ink">{figure.name}</span>
                    <p className="text-[0.75rem] text-muted-foreground leading-relaxed">
                      {figure.note}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.75rem] text-muted-foreground">
                该职未附人物示例，职掌以正史职官志为准。
              </p>
            )}
          </div>

          <div className="mt-4 border-ink/10 border-t pt-3">
            <h3 className="font-mono-tech text-[0.75rem] text-vermillion tracking-[0.2em]">
              同层其他官职 · {detail.grade.label}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {detail.grade.posts.map((item) => (
                <button
                  aria-pressed={item.title === selected.title}
                  className={cn(
                    "rounded border px-2 py-1 font-body text-[0.78rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    item.title === selected.title
                      ? "border-vermillion/45 bg-vermillion/15 text-vermillion"
                      : "border-ink/15 bg-card/60 text-ink hover:border-vermillion/30",
                  )}
                  key={item.title}
                  onClick={() => {
                    setSelected({ gradeId: detail.grade.id, title: item.title });
                  }}
                  type="button"
                >
                  {item.title}
                </button>
              ))}
            </div>
            <button
              className="mt-3 rounded-md border border-ink/15 bg-card/60 px-2.5 py-1 font-body text-[0.78rem] text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                sceneRef.current?.focusGrade(detail.grade.id);
              }}
              type="button"
            >
              在立体场景中定位本级
            </button>
          </div>

          <p className="mt-4 font-mono-tech text-[0.68rem] text-muted-foreground/80 leading-relaxed">
            人物示例含实任、加衔、差遣与追赠，仅作参照，非严格同品对应。出处 · {dynasty.source}
          </p>
        </aside>
      ) : null}
    </article>
  );
}
