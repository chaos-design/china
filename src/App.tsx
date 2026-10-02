import { Analytics } from "@vercel/analytics/react";
import { useRoutes } from "react-router-dom";

import { routes } from "./routes";

function shouldRenderAnalytics() {
  if (!import.meta.env.PROD || typeof window === "undefined") return false;
  return !["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export default function App() {
  const element = useRoutes(routes);

  return (
    <>
      {element}
      {shouldRenderAnalytics() ? <Analytics mode="production" /> : null}
    </>
  );
}
