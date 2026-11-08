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
const ChinaInstitutionsPage = lazy(() =>
  import("./pages/ancient/china-institutions").then((module) => ({
    default: module.ChinaInstitutionsPage,
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
      { path: "china/institutions", element: withSuspense(<ChinaInstitutionsPage />) },
      ...htmlResourceRoutes,
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
];
