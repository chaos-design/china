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
const RanksPage = lazy(() =>
  import("./pages/ancient/china-ranks").then((module) => ({
    default: module.RanksPage,
  })),
);
const InstitutionTopicPage = lazy(() =>
  import("./pages/ancient/china-institutions").then((module) => ({
    default: module.InstitutionTopicPage,
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
      // 品级纵横：单屏沉浸立体品级树 + 资料抽屉（树 / 族谱 / 阶梯 / 追踪 / 断面）。
      // 原「品秩全景」页已下线，/china/officials 不再保留。
      { path: "china/ranks", element: withSuspense(<RanksPage />) },
      // 本节没有总览页：/china/institutions 直接落到第一个条目
      {
        path: "china/institutions",
        element: <Navigate to="/china/institutions/official-system" replace />,
      },
      {
        path: "china/institutions/rites",
        element: withSuspense(<InstitutionTopicPage topicId="rites" />),
      },
      {
        path: "china/institutions/official-system",
        element: withSuspense(<InstitutionTopicPage topicId="official-system" />),
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
      ...htmlResourceRoutes,
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
];
