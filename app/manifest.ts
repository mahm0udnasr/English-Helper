import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "English Helper",
    short_name: "English Helper",
    description: "Daily Anki and immersion tracker",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Splash screen color. The manifest allows only one, so use the brand
    // indigo: it suits both light and dark mode (a light gray flashes white
    // for dark-mode users).
    background_color: "#4f46e5",
    theme_color: "#4f46e5",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Channels",
        url: "/channels",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Leaderboard",
        url: "/leaderboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
