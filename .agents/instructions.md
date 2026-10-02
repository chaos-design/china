# Unified AI Agent Instructions

This repository uses a unified configuration for all AI coding agents.

Please refer to the following files and directories via relative paths:

- **Rules and Conventions**: See [`../AGENTS.md`](../AGENTS.md) for project-specific instructions, setup commands, and architectural rules.
- **Project README**: See [`../README.md`](../README.md) for public route, resource, and deployment documentation.
- **Skills**: AI agent skills are located in the [`skills/`](./skills/) directory. Please load or reference these skills as needed.
- **Resource Sync**: When adding files under [`../resources/html/`](../resources/html/), keep matching metadata under [`../resources/html-resource/`](../resources/html-resource/) unless the resource should be intentionally hidden.
- **Source Location**: Vite JSX source-location behavior is configured through [`../vite.config.ts`](../vite.config.ts) and [`../scripts/babel-plugin-jsx-source-location.cjs`](../scripts/babel-plugin-jsx-source-location.cjs).
