import type { PageResourceConfig } from "../../page-resources";

const qinPoliciesResource = {
  homeEntries: [
    {
      path: "/china/policies",
      dimensions: ["历史", "军事"],
      icon: "scroll-text",
      status: "available",
      title: "朝代政策",
      description: "集中查看权谋、科技、军事与制度政策，梳理不同朝代的治国取向。",
      screenshot: "policies.jpg",
      note: "截图为朝代筛选后的政策条目视图；先看该朝治国取向，再按权谋、科技、军事与制度分类对照。",
    },
  ],
  aboutItems: [
    {
      title: "朝代政策",
      text: "集中查看权谋、科技、军事与制度政策，梳理不同朝代的治国取向。",
    },
  ],
  readingGuides: [
    {
      icon: "scroll-text",
      title: "再看治国取向",
      text: "从权谋、科技、军事与制度切入，对照同一朝代在不同治理维度上的选择。",
    },
  ],
} satisfies PageResourceConfig;

export default qinPoliciesResource;
