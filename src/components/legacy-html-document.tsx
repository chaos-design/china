import { memo } from "react";

interface LegacyHtmlDocumentProps {
  html: string;
  title: string;
}

export const LegacyHtmlDocument = memo(({ html, title }: LegacyHtmlDocumentProps) => {
  return (
    <iframe
      className="block h-full w-full border-0"
      data-testid="legacy-html-document"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      srcDoc={html}
      title={title}
    />
  );
});

LegacyHtmlDocument.displayName = "LegacyHtmlDocument";
