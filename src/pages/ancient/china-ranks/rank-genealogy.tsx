import { useState } from "react";

import { cn } from "../../../lib/utils";
import type {
  OfficialPost,
  OfficialsDynasty,
  OfficialsDynastyId,
} from "../china-officials/officials-data";
import { countPosts, getOfficialsDynasty } from "../china-officials/officials-data";
import type { OfficeDetail } from "./office-detail-card";
import { OfficeDetailCard } from "./office-detail-card";

/**
 * 品级族谱面板（资料抽屉 tab）：把一朝官制画成「族谱」——
 * 主干是品级，每级分文武两支，官职是叶；点品级展开分支，点官职展开五维详情。
 * 与立体品级树同源（officials-data 完整名录），是无 WebGL / 键盘可达的 2D 镜像。
 * 同一时刻只展开一级品级，整朝制度一屏读完。
 * 朝代由页面统一的「对照 · 视图」左侧菜单驱动；展开状态挂在按朝代 key 的重挂组件上，
 * 换朝即自然重置（不写 effect）。
 */
export function RankGenealogyPanel({ dynastyId }: { dynastyId: OfficialsDynastyId }) {
  const dynasty = getOfficialsDynasty(dynastyId) ?? getOfficialsDynasty("qin")!;

  return (
    <section aria-label="品级族谱" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="eyebrow">谱 · 品级族谱</span>
        <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em]">
          {dynasty.name} · {dynasty.grades.length} 级 · {countPosts(dynasty)} 官
        </span>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        像读族谱：主干是一级级品秩，往下分文武两支，官职落在枝头；点品级展开分支，点官职看职能、秩俸、沿革与名臣名将。一次只展开一级。
      </p>

      <RankGenealogyList key={dynastyId} dynasty={dynasty} />

      <p className="text-xs leading-relaxed text-muted-foreground">
        族谱只读不写：同一级品秩上的文武官职并列展示，点谁展开谁的详情；与立体品级树同源（officials
        完整名录），「约当」标注仅作对照参考。
      </p>
    </section>
  );
}

/** 展开状态（一级品级 + 一个官职详情）随 `key={dynastyId}` 重挂而重置。 */
function RankGenealogyList({ dynasty }: { dynasty: OfficialsDynasty }) {
  const [openGradeIndex, setOpenGradeIndex] = useState<number | null>(0);
  const [openOffice, setOpenOffice] = useState<string | null>(null);

  const officeDetail = (office: OfficialPost): OfficeDetail => ({
    title: office.title,
    dynastyName: dynasty.name,
    duty: office.intro,
    salary: office.salary,
    note: office.note,
    modern: office.modern,
    figures: office.figures,
  });

  return (
    <ol className="relative flex flex-col">
      <span aria-hidden="true" className="absolute bottom-4 left-2 top-4 w-px bg-ink/15" />
      {dynasty.grades.map((grade, index) => {
        const civil = grade.posts.filter((office) => office.branch === "civil");
        const military = grade.posts.filter((office) => office.branch === "military");
        const open = openGradeIndex === index;

        return (
          <li className="relative py-1.5 pl-8" key={grade.id}>
            <span aria-hidden="true" className="absolute left-2 top-[22px] h-px w-6 bg-ink/15" />
            <button
              aria-expanded={open}
              className={cn(
                "flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                open
                  ? "border-vermillion/25 bg-vermillion/5"
                  : "border-ink/12 bg-card/80 hover:border-vermillion/30",
              )}
              onClick={() => {
                setOpenGradeIndex(open ? null : index);
                setOpenOffice(null);
              }}
              type="button"
            >
              <span className="font-brush text-lg text-ink">{grade.label}</span>
              {grade.approx ? (
                <span className="rounded border border-dashed border-ochre px-1.5 font-body text-[0.7rem] text-ochre">
                  {grade.approx}
                </span>
              ) : null}
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground">
                {grade.posts.length} 官 · 文 {civil.length} / 武 {military.length}
              </span>
              <span aria-hidden="true" className="ml-auto text-[0.7rem] text-muted-foreground">
                {open ? "▾" : "▸"}
              </span>
            </button>

            {open ? (
              <div className="ml-2 mt-2 flex flex-col gap-4 border-l-2 border-ink/10 pl-5">
                {(
                  [
                    { key: "civil", label: "文官", offices: civil },
                    { key: "military", label: "武官", offices: military },
                  ] as const
                ).map((group) => (
                  <div className="flex flex-col gap-1.5" key={group.key}>
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          group.key === "civil" ? "bg-vermillion" : "bg-blueprint",
                        )}
                      />
                      <span
                        className={cn(
                          "font-body text-xs",
                          group.key === "civil" ? "text-vermillion" : "text-blueprint",
                        )}
                      >
                        {group.label} · {group.offices.length}
                      </span>
                    </div>
                    {group.offices.length === 0 ? (
                      <span className="text-xs text-muted-foreground">本级无</span>
                    ) : (
                      <ol className="flex flex-col gap-1.5">
                        {group.offices.map((office) => {
                          const officeKey = `${grade.id}:${office.title}`;
                          const officeOpen = openOffice === officeKey;
                          return (
                            <li className="relative" key={office.title}>
                              <span
                                aria-hidden="true"
                                className="absolute -left-5 top-[19px] h-px w-5 bg-ink/15"
                              />
                              <button
                                aria-expanded={officeOpen}
                                className={cn(
                                  "flex w-full flex-col gap-0.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                  officeOpen
                                    ? "border-vermillion/30 bg-vermillion/5"
                                    : "border-transparent hover:bg-vermillion/5",
                                )}
                                onClick={() => {
                                  setOpenOffice(officeOpen ? null : officeKey);
                                }}
                                type="button"
                              >
                                <span className="flex flex-wrap items-baseline gap-x-2">
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full",
                                      office.branch === "civil" ? "bg-vermillion" : "bg-blueprint",
                                    )}
                                  />
                                  <span className="font-brush text-lg leading-snug text-ink">
                                    {office.title}
                                  </span>
                                  {(office.rank ?? grade.approx) ? (
                                    <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em]">
                                      {office.rank ?? grade.approx}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="line-clamp-1 text-sm leading-relaxed text-muted-foreground">
                                  {office.intro}
                                </span>
                              </button>
                              {officeOpen ? (
                                <div className="mt-1.5">
                                  <OfficeDetailCard
                                    ariaLabel={`${office.title}官职详情`}
                                    selection={officeDetail(office)}
                                  />
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
