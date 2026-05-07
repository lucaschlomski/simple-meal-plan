import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ToastProvider } from "./components/Toast";
import "./styles.css";

// iOS Safari ignores `user-scalable=no`. Block pinch + double-tap zoom in JS.
const preventZoom = (e: Event) => e.preventDefault();
document.addEventListener("gesturestart", preventZoom);
document.addEventListener("gesturechange", preventZoom);
document.addEventListener("gestureend", preventZoom);

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

document.addEventListener(
  "wheel",
  (e) => {
    if ((e as WheelEvent).ctrlKey) e.preventDefault();
  },
  { passive: false }
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
