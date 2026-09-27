// Client-side PWA helpers: service worker registration and install state.

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState = "installed" | "available" | "ios" | "unsupported";

let initialized = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Called once from <PwaSetup /> in the root layout.
export function initPwa() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button in Settings
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    justInstalled = true;
    emit();
  });

  // In dev the worker only handles push (no caching), so hot reload keeps working.
  if ("serviceWorker" in navigator) {
    const url =
      process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
    navigator.serviceWorker
      .register(url, { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }
}

export function subscribeInstall(onChange: () => void) {
  listeners.add(onChange);
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", onChange);
  };
}

export function getInstallState(): InstallState {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || justInstalled) return "installed";
  if (deferredPrompt) return "available";
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS ? "ios" : "unsupported";
}

export async function promptInstall() {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null; // a prompt can only be used once
  emit();
}

// VAPID public key (base64url) -> bytes for pushManager.subscribe().
export function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Resolves with the active service worker registration, or null if none
// becomes ready in time (e.g. registration failed).
export function serviceWorkerReady(timeoutMs = 10000) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}
