import { AtlasPlaceholderPage } from "./atlas-placeholder-page";
import { getAtlasTopic } from "./topics";

/** 民族迁徙占位页。正式图谱落地时替换本文件的实现，路由与导航不动。 */
export function MigrationAtlasPage() {
  return <AtlasPlaceholderPage topic={getAtlasTopic("migration")} />;
}
