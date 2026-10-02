import type { HomeEntryRoute, PageResourceConfig } from "../page-resources";

export interface HtmlResourceDocument {
  html: string;
  title: string;
}

export interface HtmlResource {
  fileName: string;
  loadDocument: () => Promise<HtmlResourceDocument>;
  path: string;
  resource: PageResourceConfig;
}

type HtmlModuleLoaders = Record<string, () => Promise<string>>;
type HtmlDataModuleMap = Record<string, string | undefined>;
type HtmlDataLoader = (dataPath: string) => Promise<string> | undefined;
type HtmlResourceDataModuleMap = Record<string, PageResourceConfig>;

// Only the glob keys and the small PageResourceConfig metadata are resolved eagerly,
// because building the route table and the home entries needs nothing else. The HTML and
// JSON payloads stay as code-split chunks and are fetched when a resource page opens.
const htmlModules = import.meta.glob<string>("../../../resources/html/*.html", {
  import: "default",
  query: "?raw",
});

const htmlDataModules = import.meta.glob<string>("../../../resources/html-data/*.json", {
  import: "default",
  query: "?raw",
});

const htmlResourceDataModules = import.meta.glob<PageResourceConfig>(
  "../../../resources/html-resource/*.json",
  {
    eager: true,
    import: "default",
  },
);

function getHtmlResourceFileName(filePath: string) {
  const fileName = filePath.split("/").pop();

  if (!fileName) {
    throw new Error(`Invalid html resource path: ${filePath}`);
  }

  return fileName;
}

export function getHtmlResourceRoutePath(fileName: string) {
  const stem = fileName.replace(/\.html$/i, "");
  const slug = stem.split(/[-_]+/).filter(Boolean).join("-");

  if (!slug) {
    throw new Error(`Invalid html resource file name: ${fileName}`);
  }

  return `/${slug}`;
}

function getHtmlResourceDataPath(fileName: string) {
  return `../../../resources/html-resource/${fileName.replace(/\.html$/i, ".json")}`;
}

function getHtmlDataPath(fileName: string) {
  return `../../../resources/html-data/${fileName}`;
}

function getAttributeValue(attributes: string, attributeName: string) {
  const match = attributes.match(new RegExp(`\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2];
}

export function inlineHtmlDataResources(html: string, htmlDataModuleMap: HtmlDataModuleMap) {
  return html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (scriptTag, attributes: string) => {
    if (getAttributeValue(attributes, "id") !== "ndata") {
      return scriptTag;
    }

    const dataResource = getAttributeValue(attributes, "data-resource");

    if (!dataResource) {
      return scriptTag;
    }

    const data = htmlDataModuleMap[getHtmlDataPath(dataResource)];

    if (!data) {
      throw new Error(`Missing html data resource: ${dataResource}`);
    }

    return `<script type="application/json" id="ndata">\n${data}\n</script>`;
  });
}

function collectHtmlDataResources(html: string) {
  const dataResources: string[] = [];

  for (const match of html.matchAll(/<script\b([^>]*)>\s*<\/script>/gi)) {
    if (getAttributeValue(match[1] ?? "", "id") !== "ndata") {
      continue;
    }

    const dataResource = getAttributeValue(match[1] ?? "", "data-resource");

    if (dataResource && !dataResources.includes(dataResource)) {
      dataResources.push(dataResource);
    }
  }

  return dataResources;
}

export function getHtmlResourceTitle(html: string, fallbackTitle: string) {
  const title = html
    .match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  return title || fallbackTitle;
}

// React's `use()` requires a stable promise identity across renders, so the in-flight
// document is cached on first access and every later caller gets the same promise.
function createDocumentLoader(
  loadHtml: () => Promise<string>,
  loadData: HtmlDataLoader,
  fallbackTitle: string,
) {
  let pending: Promise<HtmlResourceDocument> | null = null;

  return () => {
    if (pending) {
      return pending;
    }

    pending = (async () => {
      const html = await loadHtml();
      const dataPaths = collectHtmlDataResources(html).map(getHtmlDataPath);
      const entries = await Promise.all(
        dataPaths.map(async (dataPath) => [dataPath, await loadData(dataPath)] as const),
      );

      return {
        html: inlineHtmlDataResources(html, Object.fromEntries(entries)),
        title: getHtmlResourceTitle(html, fallbackTitle),
      };
    })();

    return pending;
  };
}

function withGeneratedHomeEntryPaths(
  homeEntries: HomeEntryRoute[] | undefined,
  path: string,
): HomeEntryRoute[] | undefined {
  return homeEntries?.map((entry) => ({
    ...entry,
    path: entry.path ?? path,
  }));
}

function collectHomeItems<T>(
  resources: HtmlResource[],
  selectItems: (resource: PageResourceConfig, htmlResource: HtmlResource) => T[] | undefined,
) {
  return resources.flatMap((resource) => {
    const config = resource.resource;
    return config.showInHome === false ? [] : (selectItems(config, resource) ?? []);
  });
}

export function buildHtmlResources(
  htmlModuleLoaders: HtmlModuleLoaders,
  htmlResourceDataModuleMap: HtmlResourceDataModuleMap,
  loadData: HtmlDataLoader = () => undefined,
) {
  return Object.entries(htmlModuleLoaders)
    .flatMap<HtmlResource>(([filePath, loadHtml]) => {
      const fileName = getHtmlResourceFileName(filePath);
      const resourceDataPath = getHtmlResourceDataPath(fileName);
      const resource = htmlResourceDataModuleMap[resourceDataPath];

      if (!resource) {
        return [];
      }

      return [
        {
          fileName,
          loadDocument: createDocumentLoader(loadHtml, loadData, fileName.replace(/\.html$/i, "")),
          path: getHtmlResourceRoutePath(fileName),
          resource,
        },
      ];
    })
    .sort((first, second) => first.path.localeCompare(second.path, "zh-CN", { numeric: true }));
}

export const HTML_RESOURCES = buildHtmlResources(htmlModules, htmlResourceDataModules, (dataPath) =>
  htmlDataModules[dataPath]?.(),
);

const htmlResourcesPageResource = {
  aboutItems: collectHomeItems(HTML_RESOURCES, (resource) => resource.aboutItems),
  homeEntries: collectHomeItems(HTML_RESOURCES, (resource, htmlResource) =>
    withGeneratedHomeEntryPaths(resource.homeEntries, htmlResource.path),
  ),
  readingGuides: HTML_RESOURCES.flatMap((resource) => resource.resource.readingGuides ?? []),
} satisfies PageResourceConfig;

export default htmlResourcesPageResource;
