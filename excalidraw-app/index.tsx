import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ObjectivePlusAppIndex from "../objective-app/objective-plus";
// import { registerSW } from "virtual:pwa-register"; // VBRN CONFLICT install

import "../excalidraw-app/sentry";
window.__EXCALIDRAW_SHA__ = import.meta.env.VITE_APP_GIT_SHA;
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
// registerSW();// VBRN CONFLICT install
root.render(
  <StrictMode>
    <ObjectivePlusAppIndex />
  </StrictMode>,
);
