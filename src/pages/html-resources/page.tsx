import { lazy, Suspense, useMemo } from "react";

import { LegacyHtmlDocument } from "../../components/legacy-html-document";
import { RouteLoading } from "../../components/route-loading";
import type { HtmlResource } from "./resource";

interface HtmlResourcePageProps {
  resource: HtmlResource;
}

export function HtmlResourcePage({ resource }: HtmlResourcePageProps) {
  // The HTML and JSON payloads are multi-megabyte code-split chunks, so the document is
  // resolved through React.lazy — the same mechanism the route table uses — instead of
  // being inlined into the eagerly evaluated resource index.
  const Document = useMemo(
    () =>
      lazy(async () => {
        const { html, title } = await resource.loadDocument();
        return { default: () => <LegacyHtmlDocument html={html} title={title} /> };
      }),
    [resource],
  );

  return (
    <div className="h-full min-h-[calc(100vh-81px)] w-full bg-black">
      <Suspense fallback={<RouteLoading />}>
        <Document />
      </Suspense>
    </div>
  );
}
