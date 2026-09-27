"use client";

import { useSyncExternalStore } from "react";
import {
  FaArrowUpFromBracket,
  FaCircleCheck,
  FaDownload,
} from "react-icons/fa6";
import { getInstallState, promptInstall, subscribeInstall } from "@/lib/pwa";

export default function InstallApp() {
  // null on the server; the real state is only known in the browser.
  const state = useSyncExternalStore(
    subscribeInstall,
    getInstallState,
    () => null,
  );

  if (state === "installed") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-done">
        <FaCircleCheck /> Installed
      </p>
    );
  }
  if (state === "available") {
    return (
      <button type="button" onClick={promptInstall} className="btn-primary">
        <FaDownload /> Install app
      </button>
    );
  }
  if (state === "ios") {
    return (
      <p className="max-w-xs text-sm text-muted">
        In Safari, tap Share{" "}
        <FaArrowUpFromBracket className="inline align-[-2px]" /> then{" "}
        <strong className="text-foreground">Add to Home Screen</strong>.
      </p>
    );
  }
  if (state === "unsupported") {
    return (
      <p className="max-w-xs text-sm text-muted">
        Use your browser menu →{" "}
        <strong className="text-foreground">Install app</strong> or{" "}
        <strong className="text-foreground">Add to Home screen</strong>.
      </p>
    );
  }
  return null;
}
