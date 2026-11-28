import { describe, expect, it } from "vitest";

import { pageTitleForPath, SITE_TITLE, setDocumentTitle } from "./page-title";

describe("pageTitleForPath", () => {
  it("首页与主要路由各有独立标题", () => {
    expect(pageTitleForPath("/")).toContain("水墨编年");
    expect(pageTitleForPath("/china/timeline")).toContain("时间长河");
    expect(pageTitleForPath("/china/policies")).toContain("政策全览");
    expect(pageTitleForPath("/china/sunzi-bingfa")).toContain("孙子兵法沙盘");
    for (const title of [
      pageTitleForPath("/"),
      pageTitleForPath("/china/timeline"),
      pageTitleForPath("/china/sunzi-bingfa"),
    ]) {
      expect(title).toContain(SITE_TITLE);
    }
  });

  it("同系列子路由归并到一个专题标题", () => {
    expect(pageTitleForPath("/china/institutions/rites")).toBe(
      pageTitleForPath("/china/institutions/taxation"),
    );
    expect(pageTitleForPath("/china/imperial-exam/dynasties")).toContain("科举与仕途");
    expect(pageTitleForPath("/china/atlas/migration")).toContain("民族迁徙");
  });

  it("HTML 资源用 metadata 标题，未知路径落到 404", () => {
    expect(pageTitleForPath("/taiwan", "台湾五十年")).toContain("台湾五十年");
    expect(pageTitleForPath("/not-a-page")).toContain("页面未找到");
  });
});

describe("setDocumentTitle", () => {
  it("写入标签标题", () => {
    setDocumentTitle("测试标题 · 中国古代全览");
    expect(document.title).toBe("测试标题 · 中国古代全览");
  });
});
