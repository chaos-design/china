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
const ChinaInstitutionsPage = lazy(() =>
  import("./pages/ancient/china-institutions").then((module) => ({
    default: module.ChinaInstitutionsPage,
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
      { path: "china/institutions", element: withSuspense(<ChinaInstitutionsPage />) },
      {
        path: "china/institutions/official-system",
        element: withSuspense(<InstitutionTopicPage topicId="official-system" />),
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
