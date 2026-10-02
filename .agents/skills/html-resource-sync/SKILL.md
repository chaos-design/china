---
name: "html-resource-sync"
description: "Generates matching PageResource JSON metadata for new resources/html HTML files. Invoke when HTML files are added or metadata is missing."
---

# CRITICAL

language: zh-CN

# HTML Resource Sync

Use this skill when a new `.html` file is added under `resources/html` and the
matching JSON metadata file must be generated under `resources/html-resource`.

The JSON file is consumed as metadata equivalent to `PageResourceConfig` in
`src/pages/page-resources.ts`.

## Trigger Conditions

- A new file appears in `resources/html/*.html`.
- A file in `resources/html-resource/*.json` is missing for an existing HTML file.
- The user asks to sync, create, generate, or refresh resource metadata for legacy HTML pages.

## Required Output

For each HTML file:

1. Keep the basename unchanged.
2. Replace only the extension from `.html` to `.json`.
3. Write the file into `resources/html-resource`.

Example:

```text
resources/html/ancient_china.html
resources/html-resource/ancient_china.json
```

## JSON Shape

Generate JSON matching this TypeScript shape:

```ts
interface PageResourceConfig {
  aboutItems?: AboutContentItem[];
  homeEntries?: HomeEntryRoute[];
  readingGuides?: ReadingGuideItem[];
  showInHome?: boolean;
}

interface HomeEntryRoute {
  description: string;
  icon: HomeEntryIcon;
  path?: string;
  status: "available" | "preview";
  title: string;
}

interface AboutContentItem {
  text: string;
  title: string;
}

interface ReadingGuideItem {
  icon: HomeEntryIcon;
  text: string;
  title: string;
}
```

Use this default structure unless the HTML content clearly requires hiding the
page from the home page:

```json
{
  "homeEntries": [
    {
      "icon": "file-text",
      "status": "available",
      "title": "<content-specific title>",
      "description": "<one-sentence summary of the HTML page>"
    }
  ],
  "aboutItems": [
    {
      "title": "<short content topic>",
      "text": "<why this legacy HTML page is included>"
    }
  ],
  "readingGuides": [
    {
      "icon": "file-text",
      "title": "<action-oriented guide title>",
      "text": "<how users should use or compare this page>"
    }
  ]
}
```

## Content Extraction Rules

1. Read the HTML file directly before generating JSON.
2. Prefer semantic content from `<title>`, first `<h1>`, prominent headings, and visible introduction text.
3. Ignore implementation details such as script code, CSS class names, inline styles, and animation plumbing.
4. Keep titles concise and user-facing.
5. Generate all user-facing JSON content in Simplified Chinese, including `title`, `description`, and `text` fields.
6. Mention that the page is a legacy/original HTML page only when that matches the resource context.
7. Do not invent routes in JSON. The route is handled elsewhere by the HTML resource integration unless the user explicitly asks to include `path`.

## Icon Selection

Pick one icon from the allowed `HomeEntryIcon` union in
`src/pages/page-resources.ts`.

Recommended mappings:

| Content | Icon |
| --- | --- |
| dynasty, monument, ancient site | `landmark` |
| policy, document, governance | `scroll-text` |
| map, geography, region | `map` |
| art, color, visual culture | `palette` |
| war, military, conflict | `swords` |
| law, institutions, administration | `gavel` |
| general article or unclear topic | `file-text` |

Do not use an icon outside the TypeScript union.

## Quality Checklist

- JSON is valid and pretty-printed with two spaces.
- Output filename exactly matches the HTML basename.
- All generated text reflects actual HTML content.
- `status` is `"available"` for existing integrated HTML pages.
- `showInHome` is omitted by default; set it to `false` only when the page should not appear on the home page.
- No unrelated files are modified.

## Verification

After generation, run focused validation:

```bash
node -e "for (const f of require('node:fs').readdirSync('resources/html-resource')) JSON.parse(require('node:fs').readFileSync('resources/html-resource/' + f, 'utf8'))"
```

If project code was changed beyond JSON metadata, also run the normal project
checks required by `AGENTS.md`.
