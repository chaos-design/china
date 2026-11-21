import { getOfficialsDynasty } from "../china-officials/officials-data";
import type { OfficeDetail } from "./office-detail-card";
import type { RankTreePick } from "./rank-tree-scene";

/**
 * 3D 树官职 pick → 共享详情卡视图模型（品序取 grade.label，秦汉补 approx）。
 * pick 找不到对应官职时返回 null，调用方据此清空详情。
 */
export function rankTreePickDetail(pick: RankTreePick): OfficeDetail | null {
  if (pick.kind !== "office") {
    return null;
  }
  const dynasty = getOfficialsDynasty(pick.dynastyId);
  const grade = dynasty?.grades[pick.gradeIndex];
  const post = grade?.posts.find((candidate) => candidate.title === pick.officeTitle);
  if (!dynasty || !grade || !post) {
    return null;
  }
  return {
    title: post.title,
    dynastyName: dynasty.name,
    rank: post.rank ?? (grade.approx ? `${grade.label} · ${grade.approx}` : grade.label),
    duty: post.intro,
    salary: post.salary,
    note: post.note,
    modern: post.modern,
    figures: post.figures,
  };
}
