import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import { ArchiveSectionHead, SealBadge, TierPlane } from "./content-primitives";
import { type DynastyAtlas, getReadingGuide } from "./data";
import { getOfficeDuty } from "./office-duties";
import {
  branchRankSpans,
  filterOfficeTreeLayout,
  layoutOfficeTree,
  type OfficeTreeLayout,
  type OfficeTreeNode,
  parseRankLabels,
  visibleNodeIds,
} from "./office-tree-layout";
import type { OfficeTreeHover, OfficeTreePick } from "./office-tree-scene";
import { useOfficeTreeScene } from "./use-office-tree-scene";

type OfficeBranch = DynastyAtlas["branches"][number];

interface RelationFilterItem {
  caption: string;
  detail: string;
  id: string;
  mark?: string;
  /** 该分区 / 荣衔簇的品级跨度（如「正一品—正五品」）。 */
  span?: string;
  title: string;
}

type OfficeDetail =
  | { type: "node"; node: OfficeTreeNode }
  | { type: "filter"; item: RelationFilterItem };

const KIND_LABEL: Record<OfficeTreeNode["kind"], string> = {
  branch: "官署分区",
  honorary: "荣衔封号",
  office: "属官衙署",
  root: "权力本源",
};

/**
 * 把节点的品级括注对位到本朝品秩谱（九品十八级 / 秩石等）的数据行，
 * 取出顶戴、朝服、岁俸与同品职官——详情面板因此能看到「具体的东西」，
 * 而不是只复读节点自带的括注。对不上的加衔类文字返回空。
 */
function matchRankLevels(atlas: DynastyAtlas, rank?: string) {
  if (!rank) {
    return [];
  }
  return parseRankLabels(rank)
    .map((label) => atlas.levels.find((level) => level.label === label) ?? null)
    .filter((level): level is DynastyAtlas["levels"][number] => level !== null);
}

/** 收集根节点及其全部后代，作为从属筛选的高亮集合。 */
function subtreeIds(layout: OfficeTreeLayout, roots: readonly string[]): string[] {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const found = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (found.has(id)) {
      continue;
    }
    found.add(id);
    const node = byId.get(id);
    if (node) {
      stack.push(...node.children);
    }
  }
  return [...found];
}

/** 从属关系筛选：全树 / 权力本源 / 荣衔 / 各官署分区，均为从属树的顶层入口。 */
function buildRelationFilters(
  atlas: DynastyAtlas,
  layout: OfficeTreeLayout,
  rankSpans: ReadonlyMap<string, string>,
) {
  const honoraryRoots = layout.nodes
    .filter((node) => node.kind === "honorary" && node.parent === layout.rootId)
    .map((node) => node.id);

  const items: RelationFilterItem[] = [
    {
      caption: "完整从属树",
      detail: `${atlas.name}官制共 ${layout.nodes.length} 个节点、${atlas.branches.length} 类官署分区；聚焦任一入口即可只看它的从属链。`,
      id: "all",
      title: "全景",
    },
    {
      caption: "权力本源",
      detail: atlas.root.note,
      id: layout.rootId,
      title: layout.root.title,
    },
  ];
  if (honoraryRoots.length > 0) {
    items.push({
      caption: "荣衔 · 加官",
      detail: atlas.honorary.map((group) => group.title).join("、"),
      id: "honorary",
      span: rankSpans.get("honorary"),
      title: "荣衔封号",
    });
  }
  for (const branch of atlas.branches) {
    items.push({
      caption: "官署分区",
      detail: branch.summary,
      id: branch.id,
      mark: branch.mark,
      span: rankSpans.get(branch.id),
      title: branch.title,
    });
  }

  const highlight = new Map<string, string[]>();
  for (const item of items) {
    if (item.id === "all") {
      continue;
    }
    highlight.set(item.id, subtreeIds(layout, item.id === "honorary" ? honoraryRoots : [item.id]));
  }
  return { highlight, items };
}

function OfficeLeaf({ node, depth }: { node: OfficeBranch["nodes"][number]; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(node.children?.length);

  return (
    <li className="relative flex flex-col">
      <button
        aria-expanded={hasChildren ? open : undefined}
        className={cn(
          "group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          hasChildren ? "hover:bg-vermillion/5" : "cursor-default",
        )}
        onClick={() => {
          if (hasChildren) {
            setOpen((previous) => !previous);
          }
        }}
        type="button"
      >
        {hasChildren ? (
          <span
            aria-hidden="true"
            className={cn(
              "mt-[0.4em] inline-block h-2 w-2 shrink-0 border-r border-b border-vermillion/60 transition-transform motion-reduce:transition-none",
              open ? "rotate-45" : "-rotate-45",
            )}
          />
        ) : (
          <span
            aria-hidden="true"
            className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/35"
          />
        )}
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-sm leading-snug",
              depth === 0 ? "font-brush text-base text-ink" : "text-foreground/90",
            )}
          >
            {node.title}
          </span>
          {node.rank ? (
            <span className="font-mono-tech text-[0.7rem] text-vermillion">{node.rank}</span>
          ) : null}
        </span>
      </button>
      {node.note ? (
        <p className="ml-6 max-w-prose pb-1.5 text-xs leading-relaxed text-muted-foreground">
          {node.note}
        </p>
      ) : null}
      {hasChildren && open ? (
        <ul className="ml-4 flex flex-col border-ink/10 border-l pl-2">
          {node.children?.map((child) => (
            <OfficeLeaf depth={depth + 1} key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function BranchCard({ entry, dynastyName }: { entry: OfficeBranch; dynastyName: string }) {
  return (
    <section
      aria-label={`${dynastyName}官制·${entry.title}`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink/15 bg-card/70 p-4 shadow-[0_8px_24px_hsl(var(--ink)/0.06)]"
    >
      <header className="flex items-start gap-3 border-ink/10 border-b pb-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-vermillion/30 bg-vermillion/10 font-brush text-lg text-vermillion"
        >
          {entry.mark}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-brush text-2xl text-ink">{entry.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>
        </div>
      </header>
      <ul className="flex flex-col">
        {entry.nodes.map((node) => (
          <OfficeLeaf depth={0} key={node.id} node={node} />
        ))}
      </ul>
    </section>
  );
}

/** 2D 卡片镜像：仅当 WebGL 不可用时兜底展示完整层级内容。 */
function OfficeTree2DFallback({ atlas }: { atlas: DynastyAtlas }) {
  return (
    <section aria-label="官制层级镜像" className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 rounded-xl border border-ochre/30 bg-paper/75 px-5 py-4 text-center shadow-[0_8px_24px_hsl(var(--ink)/0.06)]">
        <span className="font-mono-tech text-[0.7rem] text-ochre">权力本源</span>
        <span className="font-brush text-3xl text-ink sm:text-4xl">{atlas.root.title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{atlas.root.note}</span>
      </div>

      <section aria-label="历代荣衔" className="flex flex-col gap-3">
        <ArchiveSectionHead mark="荣" title="荣衔 · 三公三孤与东宫官" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {atlas.honorary.map((group) => (
            <section
              aria-label={`${atlas.name}荣衔·${group.title}`}
              className="flex flex-col gap-1 rounded-xl border border-ink/15 bg-card/70 p-3"
              key={group.id}
            >
              <div className="flex items-baseline gap-2">
                <h4 className="font-brush text-lg text-ink">{group.title}</h4>
                {group.rank ? (
                  <span className="font-mono-tech text-[0.7rem] text-vermillion">{group.rank}</span>
                ) : null}
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {group.children?.map((child) => (
                  <li
                    className="rounded-full border border-ink/10 bg-paper/70 px-2 py-0.5 font-body text-xs text-foreground/85"
                    key={child.id}
                  >
                    {child.title}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {atlas.branches.map((entry) => (
          <BranchCard entry={entry} dynastyName={atlas.name} key={entry.id} />
        ))}
      </div>
    </section>
  );
}

function HoverReadout({
  hover,
  dynastyName,
}: {
  hover: OfficeTreeHover | null;
  dynastyName: string;
}) {
  return (
    <div className="pointer-events-none flex justify-center">
      {hover ? (
        <div className="relative max-w-[min(460px,calc(100%-1.5rem))] overflow-hidden rounded-lg border border-ink/12 bg-paper/95 px-4 py-2.5 text-left shadow-[0_12px_32px_hsl(var(--ink)/0.14)]">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-vermillion/85" />
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pl-1.5">
            <span className="font-brush text-lg text-ink">{hover.title}</span>
            <span className="font-mono-tech text-[0.7rem] text-vermillion">{hover.subtitle}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 pl-1.5 text-muted-foreground text-xs leading-relaxed">
            {hover.detail}
          </p>
        </div>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-paper/90 px-4 py-1.5 font-mono-tech text-[0.7rem] text-muted-foreground">
          <SealBadge mark="阅" className="h-5 w-5 text-[0.6rem]" />
          {dynastyName} · 拖拽旋转 滚轮缩放 点选节点或标签展开详情
        </span>
      )}
    </div>
  );
}

/**
 * 舞台左下的「读图」气泡：默认只留一枚小 chip，点开浮出一份有层次的解说——
 * 透视口诀、三步读法、本朝制度口径、可回查的文献依据、具体从属示例。
 * 层级刻度的那句口诀收在这里作主句；点外部 / Escape / 关闭键均可收起。
 * 详情抽屉展开时自动收起并让位：移动端抬到底部抽屉之上（仍居左），
 * 桌面端本就居左、不与右侧抽屉相撞。
 */
function NoteChip({ atlas, drawerOpen }: { atlas: DynastyAtlas; drawerOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const guide = useMemo(() => getReadingGuide(atlas), [atlas]);

  useEffect(() => {
    if (drawerOpen) {
      setOpen(false);
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const eyebrow = "font-mono-tech text-[0.6rem] text-ochre";
  const readingSteps = [
    {
      mark: "壹",
      title: "看面片",
      body: "近大远小、近厚远薄：越靠近观众的层片越大，越深的层片越收敛。",
      depth: 0,
    },
    {
      mark: "贰",
      title: "循层级",
      body: "从权力本源出发，逐层读官署分区、属官衙署与分属机构；右侧刻度列出每层名称。",
      depth: 1,
    },
    {
      mark: "叁",
      title: "点细节",
      body: "点节点或标签展开从属与职掌，左上按分区筛选、视角与自转控制取景。",
      depth: 2,
    },
  ];

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-40 flex flex-col items-start",
        drawerOpen ? "bottom-[calc(58%+1.25rem)] left-3 lg:bottom-9" : "bottom-9 left-3",
      )}
      ref={containerRef}
    >
      {open ? (
        <section
          aria-label="读图说明"
          className="pointer-events-auto mb-2 flex max-h-[min(68vh,440px)] w-[min(430px,calc(100vw-3rem))] flex-col overflow-hidden rounded-xl border border-ink/12 bg-paper/95 shadow-[0_12px_32px_hsl(var(--ink)/0.16)]"
        >
          <header className="flex shrink-0 items-center gap-2 border-ink/10 border-b bg-paper/80 px-3 py-2">
            <SealBadge mark="读" className="h-6 w-6 text-xs" />
            <span className={eyebrow}>读图法 · HOW TO READ</span>
            <button
              aria-label="收起读图说明"
              className="ml-auto rounded-full border border-ink/15 bg-card/70 px-2 py-0.5 font-body text-[0.65rem] text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setOpen(false)}
              type="button"
            >
              收起
            </button>
          </header>
          <div className="min-h-0 overflow-y-auto px-3.5 py-3">
            <p className="font-brush text-lg leading-snug text-ink">
              面片由近及远 · 层级越深越收敛
            </p>
            <p className="mt-0.5 font-mono-tech text-[0.65rem] text-muted-foreground">
              {atlas.name} · {atlas.system} · {atlas.period}
            </p>

            <ol className="mt-3 flex flex-col gap-2">
              {readingSteps.map((step) => (
                <li className="flex items-start gap-2" key={step.mark}>
                  <span aria-hidden="true" className="mt-0.5 w-9 shrink-0 text-center">
                    <TierPlane count={3} depth={step.depth} className="mx-auto h-4 w-9" />
                    <span className="mt-0.5 block font-brush text-[0.65rem] leading-none text-vermillion">
                      {step.mark}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-body text-xs text-ink">{step.title}</span>
                    <span className="block text-[0.7rem] leading-relaxed text-muted-foreground">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <section aria-label="本朝制度口径" className="mt-3 border-ink/10 border-t pt-2.5">
              <p className={eyebrow}>本朝制度口径</p>
              <h4 className="mt-1 font-brush text-base text-ink">{guide.institution.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                {guide.institution.body}
              </p>
            </section>

            <section aria-label="文献依据" className="mt-3 border-ink/10 border-t pt-2.5">
              <p className={eyebrow}>文献依据 · 可回查</p>
              <ul className="mt-1.5 flex flex-col gap-2">
                {guide.citations.map((citation) => (
                  <li
                    className="border-l border-vermillion/25 pl-2 text-[0.7rem] leading-relaxed text-muted-foreground"
                    key={citation.source}
                  >
                    <span className="font-brush text-xs text-vermillion">{citation.source}</span>
                    {citation.quote ? (
                      <span className="mt-0.5 block text-foreground/85">「{citation.quote}」</span>
                    ) : null}
                    <span className="mt-0.5 block">{citation.note}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="读图示例" className="mt-3 border-ink/10 border-t pt-2.5">
              <p className={eyebrow}>读图示例</p>
              <p className="mt-1 font-mono-tech text-[0.7rem] text-vermillion">
                {guide.example.path}
              </p>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                {guide.example.body}
              </p>
            </section>
          </div>
          <footer className="shrink-0 border-ink/10 border-t bg-paper/80 px-3 py-1.5 font-mono-tech text-[0.6rem] text-muted-foreground">
            {atlas.name} · {atlas.source}
          </footer>
        </section>
      ) : null}
      <button
        aria-expanded={open}
        className={cn(
          "pointer-events-auto rounded-full border bg-paper/90 px-3 py-1 font-mono-tech text-[0.65rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open
            ? "border-vermillion/40 text-vermillion"
            : "border-ink/12 text-muted-foreground hover:border-vermillion/30 hover:text-ink",
        )}
        onClick={() => setOpen((previous) => !previous)}
        type="button"
      >
        读图
      </button>
    </div>
  );
}

/**
 * 舞台左上的合并菜单：从属入口（每行标注品级跨度）+ 属官展开控制 + 视角预设与自转。
 * 容器透传指针，只有控件本身可点，不挡画布拖拽；max-h 钳高 + 内部滚动防吞画布中部。
 */
function StageMenu({
  activeId,
  autoRotate,
  canCollapseAll,
  canExpandAll,
  items,
  onClear,
  onCollapseAll,
  onExpandAll,
  onPreset,
  onReset,
  onSelect,
  onToggleRotate,
}: {
  activeId: string;
  autoRotate: boolean;
  canCollapseAll: boolean;
  canExpandAll: boolean;
  items: readonly RelationFilterItem[];
  onClear: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onPreset: (preset: "three-quarter" | "front") => void;
  onReset: () => void;
  onSelect: (item: RelationFilterItem) => void;
  onToggleRotate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const eyebrow = "font-mono-tech text-[0.65rem] text-ochre";
  const tool =
    "rounded-full border border-ink/15 bg-card/70 px-2.5 py-1 font-body text-[0.7rem] text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";

  return (
    <section
      aria-label="舞台菜单"
      className="pointer-events-none absolute left-3 top-3 z-20 flex max-h-[calc(100%-1.5rem)] max-w-[min(280px,calc(100%-1.5rem))]"
    >
      <div className="pointer-events-auto flex min-h-0 w-full flex-col gap-2 overflow-y-auto rounded-2xl border border-ink/12 bg-paper/95 p-2.5 shadow-[0_12px_32px_hsl(var(--ink)/0.12)] ">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={eyebrow}>从属 · 视角</span>
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "收起从属筛选" : "展开从属筛选"}
            className="rounded-full border border-ink/15 bg-card/70 px-2 py-0.5 font-body text-[0.65rem] text-muted-foreground transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setExpanded((previous) => !previous)}
            type="button"
          >
            {expanded ? "收起" : "展开"}
          </button>
          {activeId !== "all" ? (
            <button
              className="rounded-full px-1 font-body text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-vermillion hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={onClear}
              type="button"
            >
              清除
            </button>
          ) : null}
        </div>
        {expanded ? (
          <>
            <section aria-label="从属关系筛选" className="flex flex-col gap-1">
              {items.map((item) => {
                const active = item.id === activeId;
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active
                        ? "border-vermillion/45 bg-vermillion/10"
                        : "border-transparent hover:border-vermillion/25 hover:bg-vermillion/5",
                    )}
                    key={item.id}
                    onClick={(event) => {
                      // 菜单自身可滚动：选中项先滚到可视区，再驱动镜头。
                      event.currentTarget.scrollIntoView?.({ block: "nearest" });
                      onSelect(item);
                    }}
                    type="button"
                  >
                    {item.mark ? (
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-vermillion/30 bg-vermillion/10 font-brush text-xs text-vermillion"
                      >
                        {item.mark}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "font-body text-xs",
                        active ? "text-vermillion" : "text-foreground/85",
                      )}
                    >
                      {item.title}
                    </span>
                    {item.span ? (
                      <span className="ml-auto shrink-0 font-mono-tech text-[0.65rem] text-muted-foreground">
                        {item.span}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </section>
            <section aria-label="属官展开" className="flex flex-col gap-1">
              <span className={eyebrow}>属官展开</span>
              <div className="flex gap-1">
                <button
                  className={cn(tool, "flex-1")}
                  disabled={!canExpandAll}
                  onClick={onExpandAll}
                  type="button"
                >
                  展开全部
                </button>
                <button
                  className={cn(tool, "flex-1")}
                  disabled={!canCollapseAll}
                  onClick={onCollapseAll}
                  type="button"
                >
                  收起全部
                </button>
              </div>
            </section>
            <section aria-label="视角控制" className="flex flex-col gap-1">
              <span className={eyebrow}>视角</span>
              <div className="flex gap-1">
                <button
                  className={cn(tool, "flex-1")}
                  onClick={() => onPreset("three-quarter")}
                  type="button"
                >
                  斜视
                </button>
                <button
                  className={cn(tool, "flex-1")}
                  onClick={() => onPreset("front")}
                  type="button"
                >
                  正视
                </button>
                <button
                  aria-pressed={autoRotate}
                  className={cn(
                    tool,
                    "flex-1",
                    autoRotate ? "border-vermillion/40 text-vermillion" : null,
                  )}
                  onClick={onToggleRotate}
                  type="button"
                >
                  旋转
                </button>
                <button className={cn(tool, "flex-1")} onClick={onReset} type="button">
                  复位
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-1 border-l border-vermillion/20 pl-3">
      <span
        aria-hidden="true"
        className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-sm bg-vermillion/60"
      />
      <dt className="font-mono-tech text-[0.65rem] text-ochre">{label}</dt>
      <dd className="text-xs leading-relaxed text-foreground/90">{children}</dd>
    </div>
  );
}

function OfficeNodeDetail({
  atlas,
  dynastyName,
  layout,
  node,
}: {
  atlas: DynastyAtlas;
  dynastyName: string;
  layout: OfficeTreeLayout;
  node: OfficeTreeNode;
}) {
  const byId = useMemo(() => new Map(layout.nodes.map((item) => [item.id, item])), [layout]);
  const path: string[] = [];
  let cursor: OfficeTreeNode | undefined = node;
  while (cursor) {
    path.unshift(cursor.title);
    cursor = cursor.parent ? byId.get(cursor.parent) : undefined;
  }
  const children = node.children
    .map((id) => byId.get(id)?.title)
    .filter((title): title is string => Boolean(title));
  const siblingTitles =
    node.parent === null
      ? []
      : (byId.get(node.parent)?.children ?? [])
          .filter((id) => id !== node.id)
          .map((id) => byId.get(id)?.title)
          .filter((title): title is string => Boolean(title));
  const countDescendants = (id: string): number =>
    (byId.get(id)?.children ?? []).reduce((sum, child) => sum + 1 + countDescendants(child), 0);
  const descendantCount = countDescendants(node.id);
  const rankLevels = matchRankLevels(atlas, node.rank);
  const duty = getOfficeDuty(node);
  let ancestor = node.parent ? byId.get(node.parent) : undefined;
  while (ancestor && ancestor.depth > 1) {
    ancestor = ancestor.parent ? byId.get(ancestor.parent) : undefined;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-brush text-2xl text-ink">{node.title}</h3>
        {node.rank ? (
          <span className="font-mono-tech text-xs text-vermillion">{node.rank}</span>
        ) : null}
        <span className="rounded-full border border-ink/15 bg-paper/70 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {KIND_LABEL[node.kind]}
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        <DetailRow label="从属路径">{path.join(" / ")}</DetailRow>
        <DetailRow label="职权范围">{duty.scope}</DetailRow>
        <DetailRow label="职能">{duty.function}</DetailRow>
        {duty.detail ? <DetailRow label="职掌详述">{duty.detail}</DetailRow> : null}
        {duty.evolution ? <DetailRow label="沿革与权变">{duty.evolution}</DetailRow> : null}
        {duty.source ? <DetailRow label="史料出处">{duty.source}</DetailRow> : null}
        {rankLevels.length > 0 ? (
          <DetailRow label="品级实档（据本朝品秩谱）">
            <div className="flex flex-col gap-2">
              {rankLevels.map((level) => (
                <div
                  className="flex flex-col gap-1 rounded-lg border border-ink/10 bg-paper/60 px-2.5 py-2"
                  key={level.label}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono-tech text-xs text-vermillion">{level.label}</span>
                    <span className="text-[0.7rem] leading-snug text-muted-foreground">
                      {level.offices}
                    </span>
                  </div>
                  {level.hat || level.robe || level.salaryLabel ? (
                    <p className="text-xs leading-relaxed text-foreground/85">
                      {level.hat ? `顶戴 ${level.hat}` : "顶戴 —"}
                      {level.hatBeads ? `（${level.hatBeads}）` : ""}
                      {level.robe ? ` · 朝服 ${level.robe}` : ""}
                      {level.salaryLabel ? ` · 岁俸 ${level.salaryLabel}` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </DetailRow>
        ) : null}
        {node.note ? <DetailRow label="职掌说明">{node.note}</DetailRow> : null}
        {node.annotation ? <DetailRow label="注释">{node.annotation}</DetailRow> : null}
        {children.length > 0 ? (
          <DetailRow label="直属下属">
            {children.join("、")}
            {descendantCount > children.length ? `（含下级共 ${descendantCount} 署）` : ""}
          </DetailRow>
        ) : null}
        {siblingTitles.length > 0 ? (
          <DetailRow label="同级衙署">{siblingTitles.join("、")}</DetailRow>
        ) : null}
        {ancestor && node.depth > 1 && ancestor.depth === 1 ? (
          <DetailRow label="所在分区">
            {ancestor.title}
            {ancestor.note ? ` — ${ancestor.note}` : ""}
          </DetailRow>
        ) : null}
        <DetailRow label="所属朝代">{dynastyName}</DetailRow>
      </dl>
      <p className="border-ink/10 border-t pt-3 font-mono-tech text-[0.65rem] text-muted-foreground">
        {atlas.name} · {atlas.system} ｜ 据 {atlas.source}
      </p>
    </div>
  );
}

function RelationDetail({
  atlas,
  highlight,
  item,
  layout,
}: {
  atlas: DynastyAtlas;
  highlight: ReadonlyMap<string, readonly string[]>;
  item: RelationFilterItem;
  layout: OfficeTreeLayout;
}) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const ids = highlight.get(item.id) ?? [];
  const mainStem =
    item.id === "all"
      ? layout.nodes.filter((node) => node.parent === layout.rootId).map((node) => node.title)
      : item.id === "honorary"
        ? atlas.honorary.map((group) => group.title)
        : (byId.get(item.id)?.children ?? [])
            .map((id) => byId.get(id)?.title)
            .filter((title): title is string => Boolean(title));
  // 名录取自布局本体（含品级括注）：左菜单聚焦哪个分区，右面板就把这个分区的
  // 衙署与品级一条条列出来——「看得到具体的东西」，而不是只给一句规模数字。
  const roster: { rank?: string; title: string }[] =
    item.id === "honorary"
      ? atlas.honorary.flatMap((group) => [
          { rank: group.rank, title: group.title },
          ...(group.children ?? []).map((child) => ({ rank: child.rank, title: child.title })),
        ])
      : item.id === "all"
        ? []
        : (byId.get(item.id)?.children ?? []).flatMap((id) => {
            const child = byId.get(id);
            return child ? [{ rank: child.rank, title: child.title }] : [];
          });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {item.mark ? (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-vermillion/30 bg-vermillion/10 font-brush text-lg text-vermillion"
          >
            {item.mark}
          </span>
        ) : null}
        <h3 className="font-brush text-2xl text-ink">{item.title}</h3>
        <span className="rounded-full border border-ink/15 bg-paper/70 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {item.caption}
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        <DetailRow label="说明">{item.detail}</DetailRow>
        <DetailRow label="聚焦规模">{ids.length > 0 ? `${ids.length} 个节点` : "完整树"}</DetailRow>
        {item.id === "all" ? (
          <DetailRow label="分区概览">
            <ul className="flex flex-col gap-1.5">
              {atlas.branches.map((entry) => (
                <li className="flex items-baseline gap-2" key={entry.id}>
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-vermillion/25 bg-vermillion/10 font-brush text-[0.7rem] text-vermillion"
                  >
                    {entry.mark}
                  </span>
                  <span className="text-foreground/90">{entry.title}</span>
                  <span className="ml-auto shrink-0 font-mono-tech text-[0.65rem] text-muted-foreground">
                    {subtreeIds(layout, [entry.id]).length - 1} 署
                  </span>
                </li>
              ))}
            </ul>
          </DetailRow>
        ) : roster.length > 0 ? (
          <DetailRow label="衙署名录">
            <ul className="flex flex-col gap-1">
              {roster.map((entry) => (
                <li
                  className="flex items-baseline justify-between gap-2 border-ink/10 border-b pb-1 text-xs last:border-b-0"
                  key={`${entry.title}·${entry.rank ?? ""}`}
                >
                  <span className="text-foreground/90">{entry.title}</span>
                  {entry.rank ? (
                    <span className="shrink-0 font-mono-tech text-[0.65rem] text-vermillion">
                      {entry.rank}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </DetailRow>
        ) : null}
        {mainStem.length > 0 ? <DetailRow label="主干">{mainStem.join("、")}</DetailRow> : null}
        {item.id === "all" ? <DetailRow label="读图提示">{atlas.hierarchyNote}</DetailRow> : null}
      </dl>
      <p className="border-ink/10 border-t pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
        已在左侧舞台高亮这条从属链；点选树中任一节点可继续查看它的职掌与上下级。
      </p>
    </div>
  );
}

/** 右侧详情面板：点选 3D 节点或任一从属筛选项时从舞台右缘滑入。 */
function OfficeDetailDrawer({
  atlas,
  detail,
  highlight,
  layout,
  onClose,
}: {
  atlas: DynastyAtlas;
  detail: OfficeDetail | null;
  highlight: ReadonlyMap<string, readonly string[]>;
  layout: OfficeTreeLayout;
  onClose: () => void;
}) {
  const open = Boolean(detail);
  return (
    <aside
      aria-hidden={open ? undefined : true}
      aria-label="官制详情"
      className={cn(
        "absolute z-30 flex flex-col overflow-hidden border-ink/15 bg-paper/90 shadow-[0_18px_48px_hsl(var(--ink)/0.16)] transition-transform duration-300",
        "inset-x-0 bottom-0 max-h-[58%] rounded-t-2xl border-t",
        "lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:max-h-none lg:w-[360px] lg:rounded-l-2xl lg:border-l lg:border-t-0",
        open
          ? "translate-y-0 lg:translate-x-0"
          : "translate-y-full lg:translate-x-[105%] lg:translate-y-0",
      )}
      inert={!open || undefined}
    >
      <header className="flex items-center gap-3 border-ink/10 border-b bg-paper/60 px-4 py-3">
        <SealBadge mark="详" className="h-6 w-6 text-xs" />
        <span className="font-mono-tech text-[0.65rem] text-ochre">从属详解</span>
        <button
          aria-label="关闭详情"
          className="ml-auto rounded-full border border-ink/15 bg-card/70 px-2.5 py-1 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onClose}
          type="button"
        >
          关闭
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {detail?.type === "node" ? (
          <OfficeNodeDetail
            atlas={atlas}
            dynastyName={atlas.name}
            layout={layout}
            node={detail.node}
          />
        ) : detail?.type === "filter" ? (
          <RelationDetail atlas={atlas} highlight={highlight} item={detail.item} layout={layout} />
        ) : null}
      </div>
    </aside>
  );
}

/** 舞台纵深参考：向消失点收束的经线与逐层缩小的纬圈，给立体树一层可读的透视底稿。 */
function StagePerspectiveGuides() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 1000 600"
    >
      <g className="stroke-ink/[0.055]" fill="none" strokeWidth="1">
        <path d="M80 600 L468 252 M920 600 L532 252 M300 600 L482 252 M700 600 L518 252" />
        <ellipse cx="500" cy="556" rx="352" ry="34" />
        <ellipse cx="500" cy="486" rx="278" ry="27" />
        <ellipse cx="500" cy="416" rx="208" ry="20" />
        <ellipse cx="500" cy="346" rx="142" ry="14" />
      </g>
      <g className="stroke-vermillion/[0.09]" fill="none" strokeWidth="1">
        <path d="M500 556 L500 346" strokeDasharray="4 7" />
        <path d="M148 556 C320 520 680 520 852 556" />
        <path d="M222 486 C340 458 660 458 778 486" />
        <path d="M292 416 C380 396 620 396 708 416" />
      </g>
    </svg>
  );
}

const LEVEL_LABELS = ["权力本源", "官署分区 · 荣衔", "属官衙署", "分属机构", "分支属官"] as const;
const LEVEL_NUMERALS = ["壹", "贰", "叁", "肆", "伍"] as const;

/**
 * 舞台右上的层级刻度：把「从属树分几层、每层是什么」从 3D 场景里抽出来显式呈现。
 * 默认折叠到分区时画布只有两层，第三层以「点分区展开」占位——观众落地即知
 * 这是一棵三层树，而不是把下面还有层级这件事藏在交互背后。
 */
function LevelScale({ layout, hidden }: { layout: OfficeTreeLayout; hidden: boolean }) {
  const rows = useMemo(() => {
    const counts = new Map<number, number>();
    for (const node of layout.nodes) {
      counts.set(node.depth, (counts.get(node.depth) ?? 0) + 1);
    }
    const maxDepth = Math.max(2, ...counts.keys());
    return Array.from({ length: maxDepth + 1 }, (_, depth) => ({
      depth,
      label: LEVEL_LABELS[depth] ?? `第 ${depth + 1} 层`,
      numeral: LEVEL_NUMERALS[depth] ?? String(depth + 1),
    }));
  }, [layout]);

  return (
    <section
      aria-label="层级刻度"
      className={cn(
        "pointer-events-none absolute right-3 top-3 z-20 hidden w-[228px] rounded-xl border border-ink/12 bg-paper/95 px-3 py-2.5 shadow-[0_12px_32px_hsl(var(--ink)/0.12)] transition-opacity lg:block",
        hidden ? "lg:opacity-0" : null,
      )}
    >
      <div className="flex items-center gap-2">
        <SealBadge mark="层" className="h-5 w-5 text-[0.6rem]" />
        <p className="font-mono-tech text-[0.65rem] text-ochre">层级刻度</p>
      </div>
      {/*
       * 竖线与面片朱点共用 x=20：li 因 pl-8 右移 32px，面片用 -32px 抵消，
       * 否则朱点会落在竖线右侧；节点数量不进刻度，只保留层级名称。
       */}
      <ol className="relative mt-2 flex flex-col gap-1.5 pl-8">
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-[19.5px] top-2 w-px bg-[linear-gradient(180deg,hsl(var(--vermillion)/0.08),hsl(var(--vermillion)/0.4)_50%,hsl(var(--vermillion)/0.08))]"
        />
        {rows.map((row) => (
          <li className="relative flex min-h-[1.6rem] items-baseline" key={row.depth}>
            <span aria-hidden="true" className="absolute -left-8 top-1/2 -translate-y-1/2">
              <TierPlane count={rows.length} depth={row.depth} />
            </span>
            <span className="flex min-w-0 items-baseline gap-1.5 pl-1.5">
              <span className="font-brush text-[0.8rem] leading-none text-vermillion">
                {row.numeral}
              </span>
              <span className="truncate font-body text-xs text-ink/80">{row.label}</span>
            </span>
          </li>
        ))}
      </ol>
      {/* 透视口诀已移入左下「读图」气泡作主句，刻度只保留层级名称。 */}
    </section>
  );
}

/** 图一：官制层级，呈现为一棵可旋转缩放的三维从属立体树；WebGL 不可用时回落到 2D 卡片镜像。 */
export function QingOfficeTree({ atlas }: { atlas: DynastyAtlas }) {
  const fullLayout = useMemo(() => layoutOfficeTree(atlas), [atlas]);
  const relation = useMemo(
    () => buildRelationFilters(atlas, fullLayout, branchRankSpans(atlas)),
    [atlas, fullLayout],
  );
  const [filterId, setFilterId] = useState("all");
  const [detail, setDetail] = useState<OfficeDetail | null>(null);
  const [hover, setHover] = useState<OfficeTreeHover | null>(null);
  const expandableIds = useMemo(
    () =>
      new Set(
        fullLayout.nodes
          .filter((node) => node.children.length > 0 && node.id !== fullLayout.rootId)
          .map((node) => node.id),
      ),
    [fullLayout],
  );
  // 默认全展开：落地即见完整从属树与每一枚属官；重叠标注由场景的屏幕避让处理。
  // 用户仍可用舞台菜单「收起全部」回到分区总览。
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(expandableIds));
  // 慢速自转默认开（reduce-motion 时关）；拖拽画布或 hover 原子会让场景自动关掉并回调同步。
  const [autoRotate, setAutoRotateUi] = useState(
    () =>
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // 折叠视图 = 全量布局的可见子图：坐标稳定，展开 / 折叠不重排，只改取景。
  const clippedLayout = useMemo(
    () => filterOfficeTreeLayout(fullLayout, visibleNodeIds(fullLayout, expanded)),
    [fullLayout, expanded],
  );

  const callbacks = useMemo(
    () => ({
      onHover: (next: OfficeTreeHover | null) => setHover(next),
      onPick: (pick: OfficeTreePick | null) => {
        const node = pick ? (fullLayout.nodes.find((item) => item.id === pick.id) ?? null) : null;
        if (node && expandableIds.has(node.id)) {
          setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(node.id)) {
              next.delete(node.id);
            } else {
              next.add(node.id);
            }
            return next;
          });
        }
        setDetail(node ? { type: "node", node } : null);
      },
      // 用户拖拽画布或 hover 原子时场景自行停转，这里同步按钮状态。
      onAutoRotateChange: (on: boolean) => setAutoRotateUi(on),
      onUnavailable: () => undefined,
    }),
    [expandableIds, fullLayout],
  );

  const scene = useOfficeTreeScene(atlas, clippedLayout, callbacks);

  // 筛选只改变场景的高亮集合，不重建 WebGL 场景。
  useEffect(() => {
    scene.setFilter(relation.highlight.get(filterId) ?? null);
  }, [filterId, relation, scene]);

  // 自转开关同步到场景（retry 重建场景后也会重新落上）。
  useEffect(() => {
    scene.setAutoRotate(autoRotate);
  }, [autoRotate, scene]);

  // 切朝代时清掉上一朝的点选、hover、筛选与展开状态，避免残留。
  const [prevAtlas, setPrevAtlas] = useState(atlas);
  if (prevAtlas !== atlas) {
    setPrevAtlas(atlas);
    setDetail(null);
    setHover(null);
    setFilterId("all");
    setExpanded(new Set(expandableIds));
  }

  if (scene.failed) {
    return (
      // 页面本体不滚动，2D 镜像在自身列内滚动。
      <div className="h-full min-h-0 overflow-y-auto pr-1 lg:pr-2">
        <div className="flex flex-col gap-6 pb-2">
          <div className="flex flex-col gap-3 rounded-lg border border-ochre/30 bg-paper/70 px-4 py-3">
            <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">
              当前浏览器未能启用 WebGL，立体树无法绘制，已显示 2D 层级镜像。
            </p>
            <button
              className="w-fit rounded-full border border-ink/15 bg-card/70 px-3 py-1 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={scene.retry}
              type="button"
            >
              重试立体树
            </button>
          </div>
          <OfficeTree2DFallback atlas={atlas} />
          <p className="text-xs leading-relaxed text-muted-foreground">{atlas.hierarchyNote}</p>
        </div>
      </div>
    );
  }

  const canvasLabel = `${atlas.name}官制立体树：可见 ${clippedLayout.nodes.length} 个节点（全树 ${
    fullLayout.nodes.length
  } 个）、${atlas.branches.length} 类官署分区与${atlas.honorary.length} 组荣衔。拖拽旋转、滚轮缩放、点选节点或标签展开属官并查看详情。`;

  return (
    <figure
      aria-label="官制立体树"
      className="relative isolate h-full w-full overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_42%,hsl(var(--ink)/0.06),transparent_70%),radial-gradient(ellipse_at_50%_100%,hsl(var(--vermillion)/0.045),transparent_60%)] shadow-[0_18px_48px_hsl(var(--ink)/0.06)]"
    >
      {/* 四角套准标记 + 经纬淡格：仿舆图绢本的装裱感，纯装饰不拦截指针。 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-ink/15"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-ink/15"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-ink/15"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-ink/15"
      />
      <div
        aria-label={canvasLabel}
        className={cn(
          "absolute inset-0 h-full w-full cursor-grab",
          // 桌面端抽屉展开时让画布让出右侧一列，3D 树不会被面板盖住。
          detail ? "lg:right-[360px] lg:w-[calc(100%-360px)]" : null,
        )}
        ref={scene.hostRef}
        role="img"
      />

      <StagePerspectiveGuides />

      <div className="pointer-events-none absolute inset-0 z-10">
        {!scene.ready ? (
          <div
            aria-live="polite"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
            role="status"
          >
            <span
              aria-hidden="true"
              className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-vermillion"
            />
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground">
              正在展开官制立体树
            </span>
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-9">
          <HoverReadout dynastyName={atlas.name} hover={hover} />
        </div>
      </div>

      <LevelScale layout={clippedLayout} hidden={Boolean(detail)} />
      <NoteChip atlas={atlas} drawerOpen={Boolean(detail)} />

      <StageMenu
        activeId={filterId}
        autoRotate={autoRotate}
        canCollapseAll={expanded.size > 0}
        canExpandAll={expandableIds.size > expanded.size}
        items={relation.items}
        onClear={() => {
          setFilterId("all");
          setDetail(null);
        }}
        onCollapseAll={() => setExpanded(new Set())}
        onExpandAll={() => setExpanded(expandableIds)}
        onPreset={scene.applyPreset}
        onReset={scene.resetView}
        onSelect={(item) => {
          setFilterId(item.id);
          setDetail({ type: "filter", item });
          if (item.id !== "all") {
            // 从属菜单选中即入镜并转正，正对观众；画布点选仍保留原视角。
            scene.focusNode(item.id, { faceFront: true });
          }
        }}
        onToggleRotate={() => setAutoRotateUi((previous) => !previous)}
      />

      <OfficeDetailDrawer
        atlas={atlas}
        detail={detail}
        highlight={relation.highlight}
        layout={fullLayout}
        onClose={() => setDetail(null)}
      />
    </figure>
  );
}
