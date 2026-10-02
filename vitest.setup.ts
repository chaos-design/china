import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Every route is loaded through React.lazy, so each `findBy*` assertion first waits on a
// dynamic import that Vitest has not transformed yet. The 1000ms default leaves no
// headroom for that on a loaded machine.
configure({ asyncUtilTimeout: 10000 });

afterEach(() => {
  cleanup();
});
