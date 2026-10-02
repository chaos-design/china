import dynastiesJson from "./data/dynasties.json";
import glossaryJson from "./data/glossary.json";
import type { Dynasty, Glossary } from "./types";

export const GLOSSARY = glossaryJson as unknown as Glossary;
export const DYNASTIES = dynastiesJson as unknown as Dynasty[];
