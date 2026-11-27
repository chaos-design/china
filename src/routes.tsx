import { lazy, type ReactNode, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

import { RootLayout } from "./components/layout/root-layout";
import { RouteLoading } from "./components/route-loading";
import { HtmlResourcePage } from "./pages/html-resources/page";
import { HTML_RESOURCES } from "./pages/html-resources/resource";

const AncientChinaPoliciesReactPage = lazy(() =>
  import("./pages/ancient/china-policies").then((module) => ({
    default: module.AncientChinaPoliciesReactPage,
  })),
);
const AtlasExplorerPage = lazy(() =>
  import("./pages/ancient/china-atlas/atlas-explorer").then((module) => ({
    default: module.AtlasExplorer,
  })),
);
const FrontierAtlasPage = lazy(() =>
  import("./pages/ancient/china-atlas/frontier-page").then((module) => ({
    default: module.FrontierAtlasPage,
  })),
);
const MigrationAtlasPage = lazy(() =>
  import("./pages/ancient/china-atlas/migration-page").then((module) => ({
    default: module.MigrationAtlasPage,
  })),
);
const TerritoryAtlasPage = lazy(() =>
  import("./pages/ancient/china-atlas/territory-page").then((module) => ({
    default: module.TerritoryAtlasPage,
  })),
);
const OfficialsHubPage = lazy(() =>
  import("./pages/ancient/china-officials/hub-page").then((module) => ({
    default: module.OfficialsHubPage,
  })),
);
const RanksPage = lazy(() =>
  import("./pages/ancient/china-ranks").then((module) => ({
    default: module.RanksPage,
  })),
);
const QingOfficialsPage = lazy(() =>
  import("./pages/ancient/china-qing-officials").then((module) => ({
    default: module.QingOfficialsPage,
  })),
);
const InstitutionTopicPage = lazy(() =>
  import("./pages/ancient/china-institutions").then((module) => ({
    default: module.InstitutionTopicPage,
  })),
);
const ImperialExamPage = lazy(() =>
  import("./pages/ancient/china-imperial-exam/imperial-exam-page").then((module) => ({
    default: module.ImperialExamPage,
  })),
);
const AncientChinaReactPage = lazy(() =>
  import("./pages/ancient/china").then((module) => ({
    default: module.AncientChinaReactPage,
  })),
);
const HomePage = lazy(() =>
  import("./pages/home").then((module) => ({ default: module.HomePage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/not-found").then((module) => ({ default: module.NotFoundPage })),
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
}

const htmlResourceRoutes = HTML_RESOURCES.map((resource) => ({
  path: resource.path.slice(1),
  element: <HtmlResourcePage resource={resource} />,
}));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },

      { path: "china", element: <Navigate to="/china/timeline" replace /> },
      { path: "china/timeline", element: withSuspense(<AncientChinaReactPage />) },
      { path: "china/policies", element: withSuspense(<AncientChinaPoliciesReactPage />) },
      // 「历史地理图谱」已整合为一个功能页：/china/atlas 是「全部图谱」，
      // 三条旧路径保留为预设图层的兼容入口，页内切换图层不换路由、不重挂载地图。
      { path: "china/atlas", element: withSuspense(<AtlasExplorerPage />) },
      { path: "china/atlas/territory", element: withSuspense(<TerritoryAtlasPage />) },
      { path: "china/atlas/migration", element: withSuspense(<MigrationAtlasPage />) },
      { path: "china/atlas/frontier", element: withSuspense(<FrontierAtlasPage />) },
      // 职官制度：两个视图保留各自完整页面，收敛到一个总目入口下。
      // 官制的编年沿革不另开页面，仍由 /china/institutions/official-system 承载。
      // 旧路径 /china/ranks、/china/qing-officials 已删除。
      { path: "china/officials", element: withSuspense(<OfficialsHubPage />) },
      // 图谱：按朝代切换的立体官署树与品秩礼制信息图。
      { path: "china/officials/structure", element: withSuspense(<QingOfficialsPage />) },
      // 品级：单屏沉浸立体品级树 + 资料抽屉（树 / 族谱 / 阶梯 / 追踪 / 断面）。
      { path: "china/officials/grades", element: withSuspense(<RanksPage />) },
      // 制度沿革：本节没有总览页，落到第一个仍在节内的条目。
      {
        path: "china/institutions",
        element: <Navigate to="/china/institutions/official-system" replace />,
      },
      {
        path: "china/institutions/official-system",
        element: withSuspense(<InstitutionTopicPage topicId="official-system" />),
      },
      {
        path: "china/institutions/rites",
        element: withSuspense(<InstitutionTopicPage topicId="rites" />),
      },
      {
        path: "china/institutions/examinations",
        element: withSuspense(<InstitutionTopicPage topicId="examinations" />),
      },
      {
        path: "china/institutions/legal-code",
        element: withSuspense(<InstitutionTopicPage topicId="legal-code" />),
      },
      {
        path: "china/institutions/taxation",
        element: withSuspense(<InstitutionTopicPage topicId="taxation" />),
      },
      // 三个子页共用一版式：左侧条目目录 + 右侧内容；索引路径落到第一页
      {
        path: "china/imperial-exam",
        element: <Navigate to="/china/imperial-exam/stages" replace />,
      },
      {
        path: "china/imperial-exam/stages",
        element: withSuspense(<ImperialExamPage sectionId="stages" />),
      },
      {
        path: "china/imperial-exam/dynasties",
        element: withSuspense(<ImperialExamPage sectionId="dynasties" />),
      },
      {
        path: "china/imperial-exam/compare",
        element: withSuspense(<ImperialExamPage sectionId="compare" />),
      },
      ...htmlResourceRoutes,
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
];
