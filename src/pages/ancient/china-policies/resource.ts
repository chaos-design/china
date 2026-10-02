import type { PageResourceConfig } from "../../page-resources";

const qinPoliciesResource = {
  homeEntries: [
    {
      path: "/china/policies",
      icon: "scroll-text",
      status: "available",
      title: "朝代政策全览",
      description: "集中查看权谋、科技、军事与制度政策，梳理不同朝代的治国取向。",
    },
  ],
  aboutItems: [
    {
      title: "朝代政策全览",
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
