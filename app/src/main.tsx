import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import { checkForUpdatesInBackground } from "./lib/updater";
import AppBootstrap from "./app/app-bootstrap";

const savedTheme =
  localStorage.getItem("theme") || "dark";

document.documentElement.setAttribute(
  "data-theme",
  savedTheme,
);

void checkForUpdatesInBackground();

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
).render(
    <AppBootstrap />
);