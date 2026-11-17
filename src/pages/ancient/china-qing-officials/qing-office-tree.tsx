import { useState } from "react";

import { cn } from "../../../lib/utils";
import type { AtlasOfficeBranch, AtlasOfficeNode, DynastyAtlas } from "./data";

function OfficeLeaf({ node, depth }: { node: AtlasOfficeNode; depth: number }) {
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
              "mt-[0.4em] inline-block h-2 w-2 shrink-0 border-r border-b border-vermillion/60 transition-transform",
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
            <span className="font-mono-tech text-[0.7rem] tracking-[0.08em] text-vermillion">
              {node.rank}
            </span>
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

function BranchCard({ entry, dynastyName }: { entry: AtlasOfficeBranch; dynastyName: string }) {
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

/** 图一：官制层级。皇权居顶，荣衔与机构分区在下方并陈，衙署可就地展开属官。 */
export function QingOfficeTree({ atlas }: { atlas: DynastyAtlas }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 rounded-xl border border-ochre/30 bg-paper/75 px-5 py-4 text-center shadow-[0_8px_24px_hsl(var(--ink)/0.06)]">
        <span className="font-mono-tech text-[0.7rem] tracking-[0.3em] text-ochre uppercase">
          权力本源
        </span>
        <span className="font-brush text-3xl text-ink sm:text-4xl">{atlas.root.title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{atlas.root.note}</span>
      </div>

      <section aria-label="历代荣衔" className="flex flex-col gap-2">
        <h3 className="font-brush text-xl text-ink">荣衔 · 三公三孤与东宫官</h3>
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

      <p className="text-xs leading-relaxed text-muted-foreground">{atlas.hierarchyNote}</p>
    </div>
  );
}
