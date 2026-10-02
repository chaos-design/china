/**
 * Babel plugin to inject data-source attributes into JSX elements.
 * This helps AI agents locate source code from DOM elements.
 *
 * Only native HTML/SVG elements are processed to avoid conflicts with custom
 * React components and libraries such as React Three Fiber.
 */
module.exports = function babelPluginJsxSourceLocation({ types: t }) {
  const htmlTags = new Set([
    "a",
    "abbr",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "math",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "nav",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "pre",
    "progress",
    "q",
    "rb",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "script",
    "search",
    "section",
    "select",
    "slot",
    "small",
    "source",
    "span",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul",
    "var",
    "video",
    "wbr",
  ]);

  const svgTags = new Set([
    "svg",
    "a",
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "foreignObject",
    "g",
    "glyph",
    "glyphRef",
    "hkern",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "missing-glyph",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "set",
    "stop",
    "switch",
    "symbol",
    "text",
    "textPath",
    "tref",
    "tspan",
    "use",
    "view",
    "vkern",
  ]);

  const nativeTags = new Set([...htmlTags, ...svgTags]);

  function shouldSkipFile(filename) {
    return !filename || filename.includes("node_modules");
  }

  function getRelativePath(filename, cwd) {
    if (!filename || !cwd) {
      return filename;
    }

    if (filename.startsWith(cwd)) {
      return filename.slice(cwd.length + 1);
    }

    return filename;
  }

  function hasDataSourceAttr(attributes) {
    return attributes.some(
      (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: "data-source" }),
    );
  }

  function shouldSkipElement(name) {
    if (t.isJSXMemberExpression(name)) {
      return true;
    }

    if (!t.isJSXIdentifier(name)) {
      return false;
    }

    const tagName = name.name;
    const skipList = ["Fragment", "Suspense", "StrictMode"];

    return skipList.includes(tagName) || !nativeTags.has(tagName);
  }

  return {
    name: "jsx-source-location",
    visitor: {
      JSXOpeningElement(path, state) {
        const { filename } = state;

        if (shouldSkipFile(filename) || shouldSkipElement(path.node.name)) {
          return;
        }

        if (hasDataSourceAttr(path.node.attributes)) {
          return;
        }

        const { line, column } = path.node.loc?.start || {};

        if (!line) {
          return;
        }

        const cwd = state.cwd || process.cwd();
        const relativePath = getRelativePath(filename, cwd);
        const col = column !== undefined ? column + 1 : 1;
        const sourceValue = `${relativePath}:${line}:${col}`;
        const dataSourceAttr = t.jsxAttribute(
          t.jsxIdentifier("data-source"),
          t.stringLiteral(sourceValue),
        );

        path.node.attributes.push(dataSourceAttr);
      },
    },
  };
};
