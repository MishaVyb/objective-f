import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { registerSW } from "virtual:pwa-register"; // VBRN CONFLICT install

import "../excalidraw-app/sentry";
import ObjectivePlusWrapper from "./../src/_objective_plus_";
import "./excalidraw-app/pwa";
import "./excalidraw-app/sentry";
window.__EXCALIDRAW_SHA__ = import.meta.env.VITE_APP_GIT_SHA;

// window.__EXCALIDRAW_SHA__ = process.env.REACT_APP_GIT_SHA; // VBRN CONFLICT ?

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
// registerSW();// VBRN CONFLICT install
root.render(
  <StrictMode>
    <ObjectivePlusWrapper />
  </StrictMode>,
);
