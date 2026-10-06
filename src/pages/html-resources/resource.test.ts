import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import htmlResourcesPageResource, {
  buildHtmlResources,
  getHtmlResourceRoutePath,
  getHtmlResourceTitle,
  HTML_RESOURCES,
  inlineHtmlDataResources,
} from "./resource";

describe("html resource metadata", () => {
  it("builds kebab-case routes from html file names split by hyphen and underscore", () => {
    expect(getHtmlResourceRoutePath("ancient_china.html")).toBe("/ancient-china");
    expect(getHtmlResourceRoutePath("ancient-china_policies.html")).toBe("/ancient-china-policies");
  });

  it("keeps empty split segments out of generated route paths", () => {
    expect(getHtmlResourceRoutePath("ancient__china--timeline.html")).toBe(
      "/ancient-china-timeline",
    );
  });

  it("rejects empty html resource file names", () => {
    expect(() => getHtmlResourceRoutePath("__--.html")).toThrow("Invalid html resource file name");
  });

  it("extracts normalized titles from html and falls back when no title exists", () => {
    expect(getHtmlResourceTitle("<title> 朝代浮岛 \n 时间长河 </title>", "fallback")).toBe(
      "朝代浮岛 时间长河",
    );
    expect(getHtmlResourceTitle("<main>无标题</main>", "fallback")).toBe("fallback");
  });

  it("indexes html files and pairs them with JSON metadata without loading their payloads", () => {
    expect(HTML_RESOURCES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fileName: "ancient_china.html",
          loadDocument: expect.any(Function),
          path: "/ancient-china",
          resource: expect.objectContaining({
            homeEntries: [
              expect.objectContaining({
                title: "朝代浮岛旧版页",
              }),
            ],
          }),
        }),
        expect.objectContaining({
          fileName: "intangible-culture-heritage.html",
          path: "/intangible-culture-heritage",
          resource: expect.objectContaining({
            homeEntries: [
              expect.objectContaining({
                title: "中华非遗二十项瑰宝",
              }),
            ],
          }),
        }),
        expect.objectContaining({
          fileName: "silk-road.html",
          path: "/silk-road",
          resource: expect.objectContaining({
            homeEntries: [
              expect.objectContaining({
                title: "丝绸之路与海疆发展史",
              }),
            ],
          }),
        }),
        expect.objectContaining({
          fileName: "taiwan.html",
          path: "/taiwan",
          resource: expect.objectContaining({
            homeEntries: [
              expect.objectContaining({
                title: "台湾 · 山海之间",
              }),
            ],
          }),
        }),
      ]),
    );

    // The eager index must not carry the HTML text, otherwise it lands in the main chunk.
    for (const resource of HTML_RESOURCES) {
      expect(resource).not.toHaveProperty("html");
      expect(resource).not.toHaveProperty("title");
    }
  });

  it("loads html payloads and inlined JSON data on demand", async () => {
    const loadDocument = (path: string) => {
      const resource = HTML_RESOURCES.find((entry) => entry.path === path);

      if (!resource) {
        throw new Error(`Missing html resource route: ${path}`);
      }

      return resource.loadDocument();
    };

    await expect(loadDocument("/ancient-china")).resolves.toEqual(
      expect.objectContaining({
        html: expect.stringContaining("<!DOCTYPE html>"),
        title: "朝代浮岛 · 时间长河 · 中国朝代与少数民族 3D 编年图",
      }),
    );
    await expect(loadDocument("/intangible-culture-heritage")).resolves.toEqual(
      expect.objectContaining({ title: "中华非遗 · 二十项瑰宝" }),
    );

    const heritage = await loadDocument("/intangible-culture-heritage");
    expect(heritage.html).toContain('"name": "中国剪纸"');
    expect(heritage.html).not.toContain('data-resource="intangible-culture-heritage.json"');

    const silkRoad = await loadDocument("/silk-road");
    expect(silkRoad.title).toBe("中国各朝代丝绸之路与海疆发展史 · 世界地图版");
    expect(silkRoad.html).toContain('"ERAS": [');
    expect(silkRoad.html).not.toContain('data-resource="silk-road.json"');

    const taiwan = await loadDocument("/taiwan");
    expect(taiwan.title).toBe("台湾 · 山海之间的百年");
    expect(taiwan.html).toContain('"id": "humiliation"');
    expect(taiwan.html).not.toContain('data-resource="taiwan.json"');
    // 分页结构：五卷各自是 role=tabpanel，工具条是 role=tablist
    expect(taiwan.html).toContain('role="tablist"');
    expect(taiwan.html).toContain('role="tabpanel"');
    // 地图由数据里的经纬度投影生成，不是写死的 path
    expect(taiwan.html).toContain('"projection"');
    // 全文简体：繁体常见字形不应出现
    for (const traditional of ["臺灣", "歷史", "戰爭", "學習", "東西南北"]) {
      expect(taiwan.html).not.toContain(traditional);
    }

    // 真实影像块：内联 payload 里的每个 src 都必须指向真实存在的 public 文件，
    // 防止历史地图/照片死链（jsdom 不加载图片，只有这里能查）。
    const payload = /<script type="application\/json" id="ndata">\n([\s\S]*?)\n<\/script>/.exec(
      taiwan.html,
    )?.[1];
    expect(payload).toBeTruthy();
    const taiwanData = JSON.parse(payload ?? "{}") as {
      chapters: { blocks: { type: string; id?: string; src?: string }[] }[];
    };
    const blocks = taiwanData.chapters.flatMap((chapter) => chapter.blocks);

    const imageSrcs = blocks
      .filter((block) => block.type === "image")
      .map((block) => block.src)
      .filter((src): src is string => typeof src === "string");
    expect(imageSrcs.length).toBeGreaterThan(0);
    const publicRoot = join(process.cwd(), "public");
    for (const src of imageSrcs) {
      expect(src).toMatch(/^\/taiwan\//);
      expect(() => readFileSync(join(publicRoot, src.slice(1)))).not.toThrow();
    }

    // art 块按 id 去 ART_SVG 取画稿。id 拼错时 renderArt 返回空串，
    // 页面上是"标题还在、画没了"，jsdom 里也只有一句空字符串，必须在这里钉住。
    const artIds = blocks.filter((block) => block.type === "art").map((block) => block.id);
    expect(artIds.length).toBeGreaterThan(0);
    const registry = /var ART_SVG = \{([\s\S]*?)\n {2}\};/u.exec(taiwan.html)?.[1] ?? "";
    for (const id of artIds) {
      expect(typeof id).toBe("string");
      expect(registry).toContain(`\n    ${id}:`);
    }
  });

  it("reuses one document promise across calls so React use() stays stable", () => {
    const [resource] = HTML_RESOURCES;

    if (!resource) {
      throw new Error("Expected at least one html resource");
    }

    expect(resource.loadDocument()).toBe(resource.loadDocument());
  });

  it("loads only the JSON data referenced by the html document", async () => {
    const requested: string[] = [];
    const [resource] = buildHtmlResources(
      {
        "../../../resources/html/one_reference.html": async () =>
          '<title>One</title><script id="ndata" data-resource="one.json"></script>',
        "../../../resources/html/unreferenced.html": async () => "<title>Two</title>",
      },
      {
        "../../../resources/html-resource/one_reference.json": {},
        "../../../resources/html-resource/unreferenced.json": {},
      },
      (dataPath) => {
        requested.push(dataPath);
        return Promise.resolve(`[{"from":"${dataPath}"}]`);
      },
    );

    if (!resource) {
      throw new Error("Expected the referenced html resource to be indexed");
    }

    await expect(resource.loadDocument()).resolves.toEqual(
      expect.objectContaining({
        html: expect.stringContaining('[{"from":"../../../resources/html-data/one.json"}]'),
        title: "One",
      }),
    );
    expect(requested).toEqual(["../../../resources/html-data/one.json"]);
  });

  it("fails the document load when a referenced JSON payload is missing", async () => {
    const [resource] = buildHtmlResources(
      {
        "../../../resources/html/broken.html": async () =>
          '<title>Broken</title><script id="ndata" data-resource="missing.json"></script>',
      },
      { "../../../resources/html-resource/broken.json": {} },
    );

    if (!resource) {
      throw new Error("Expected the broken html resource to be indexed");
    }

    await expect(resource.loadDocument()).rejects.toThrow(
      "Missing html data resource: missing.json",
    );
  });

  it("inlines external JSON data placeholders into html resource documents", () => {
    const html = [
      '<script type="application/json" id="ndata" data-resource="sample.json"></script>',
      "<main>页面内容</main>",
    ].join("\n");

    expect(
      inlineHtmlDataResources(html, {
        "../../../resources/html-data/sample.json": '[{"name":"样例"}]',
      }),
    ).toBe(
      [
        '<script type="application/json" id="ndata">',
        '[{"name":"样例"}]',
        "</script>",
        "<main>页面内容</main>",
      ].join("\n"),
    );
  });

  it("throws when an html data placeholder has no matching JSON resource", () => {
    expect(() =>
      inlineHtmlDataResources(
        '<script type="application/json" id="ndata" data-resource="missing.json"></script>',
        {},
      ),
    ).toThrow("Missing html data resource: missing.json");
  });

  it("filters html files without matching JSON metadata instead of throwing", () => {
    const resources = buildHtmlResources(
      {
        "../../../resources/html/missing_resource.html": async () =>
          "<title>Missing Resource</title>",
        "../../../resources/html/visible_resource.html": async () =>
          "<title>Visible Resource</title>",
      },
      {
        "../../../resources/html-resource/visible_resource.json": {
          homeEntries: [
            {
              description: "可见资源说明",
              icon: "file-text",
              status: "available",
              title: "可见资源",
            },
          ],
        },
      },
    );

    expect(resources).toEqual([
      expect.objectContaining({
        fileName: "visible_resource.html",
        loadDocument: expect.any(Function),
        path: "/visible-resource",
      }),
    ]);
  });

  it("keeps hidden html resources out of home blocks while preserving visible resources and guides", () => {
    expect(htmlResourcesPageResource.homeEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/intangible-culture-heritage",
          status: "available",
          title: "中华非遗二十项瑰宝",
        }),
        expect.objectContaining({
          path: "/silk-road",
          status: "available",
          title: "丝绸之路与海疆发展史",
        }),
        expect.objectContaining({
          path: "/taiwan",
          status: "available",
          title: "台湾 · 山海之间",
        }),
      ]),
    );
    // `showInHome: false` keeps the legacy timeline HTML page out of the home blocks.
    expect(htmlResourcesPageResource.homeEntries).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "朝代浮岛旧版页",
        }),
      ]),
    );
    expect(htmlResourcesPageResource.aboutItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "非遗技艺图谱",
        }),
      ]),
    );
    expect(htmlResourcesPageResource.readingGuides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "对照旧版浮岛",
        }),
        expect.objectContaining({
          title: "浏览非遗瑰宝",
        }),
        expect.objectContaining({
          title: "对照丝路演变",
        }),
        expect.objectContaining({
          title: "先看剖面，再读近代",
        }),
      ]),
    );
  });
});
