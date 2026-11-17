import { useState } from "react";

import { cn } from "../../../lib/utils";
import {
  QING_HONORARY_RANKS,
  QING_OFFICE_BRANCHES,
  type QingOfficeBranch,
  type QingOfficeCategory,
  type QingOfficeNode,
} from "./qing-officials-data";

const CATEGORY_HINT: Record<QingOfficeCategory, string> = {
  assistant: "佐",
  central: "中",
  frontier: "藩",
  household: "帝",
  imperial: "皇",
  local: "地",
  province: "省",
};

function OfficeLeaf({ node, depth }: { node: QingOfficeNode; depth: number }) {
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

function BranchCard({ branch }: { branch: QingOfficeBranch }) {
  return (
    <section
      aria-label={`清代官制·${branch.title}`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink/15 bg-card/70 p-4 shadow-[0_8px_24px_hsl(var(--ink)/0.06)]"
    >
      <header className="flex items-start gap-3 border-ink/10 border-b pb-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-vermillion/30 bg-vermillion/10 font-brush text-lg text-vermillion"
        >
          {CATEGORY_HINT[branch.category]}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-brush text-2xl text-ink">{branch.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{branch.summary}</p>
        </div>
      </header>
      <ul className="flex flex-col">
        {branch.nodes.map((node) => (
          <OfficeLeaf depth={0} key={node.id} node={node} />
        ))}
      </ul>
    </section>
  );
}

/**
 * 图一：清朝官职制度。皇权居顶，荣衔与六大分区在下方并陈；
 * 每个衙署可就地展开到属官，键盘可达（树节点均为 button + aria-expanded）。
 */
export function QingOfficeTree() {
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 rounded-xl border border-ochre/30 bg-paper/75 px-5 py-4 text-center shadow-[0_8px_24px_hsl(var(--ink)/0.06)]">
        <span className="font-mono-tech text-[0.7rem] tracking-[0.3em] text-ochre uppercase">
          权力本源
        </span>
        <span className="font-brush text-3xl text-ink sm:text-4xl">皇帝</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          总揽军政大权，以下诸衙署分职而治
        </span>
      </div>

      <section aria-label="清代荣衔" className="flex flex-col gap-2">
        <h3 className="font-brush text-xl text-ink">荣衔 · 三公三孤与东宫官</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QING_HONORARY_RANKS.map((node) => (
            <section
              aria-label={`清代荣衔·${node.title}`}
              className="flex flex-col gap-1 rounded-xl border border-ink/15 bg-card/70 p-3"
              key={node.id}
            >
              <div className="flex items-baseline gap-2">
                <h4 className="font-brush text-lg text-ink">{node.title}</h4>
                {node.rank ? (
                  <span className="font-mono-tech text-[0.7rem] text-vermillion">{node.rank}</span>
                ) : null}
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {node.children?.map((child) => (
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
        {QING_OFFICE_BRANCHES.map((branch) => (
          <BranchCard branch={branch} key={branch.id} />
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        读图口径：此树复现《清朝官职制度》一图的分区与从属关系，品级括注为图中所标；
        荣衔多为封赠虚衔，实权以中枢部与行省衙署为准。点击带箭头的衙署可展开属官。
      </p>
    </div>
  );
}
