import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import ObjectivePlusWrapper from "./_objective_plus_";
import "./excalidraw-app/pwa";
import "./excalidraw-app/sentry";

window.__EXCALIDRAW_SHA__ = process.env.REACT_APP_GIT_SHA;
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <ObjectivePlusWrapper />
  </StrictMode>,
);
