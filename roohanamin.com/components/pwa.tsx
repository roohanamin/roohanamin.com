"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
export function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
export function Pwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* The core app still works without installation. */
      });
  }, []);
  return null;
}
export function InstallHelp() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setStandalone(
        query.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (standalone) return null;
  return (
    <details className="install-help">
      <summary>
        <span aria-hidden="true">▣</span> Add to your home screen{" "}
        <span aria-hidden="true">+</span>
      </summary>
      <p>
        On iPhone, open this page in Safari, tap <strong>Share</strong>, then{" "}
        <strong>Add to Home Screen</strong>. Turn on{" "}
        <strong>Open as Web App</strong> if shown, then tap <strong>Add</strong>
        .
      </p>
      <p>
        On Android, use your browser’s menu and choose{" "}
        <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </p>
    </details>
  );
}
