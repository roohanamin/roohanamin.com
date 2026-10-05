import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/weight",
    name: "Weight Log · Roohan Amin",
    short_name: "Weight Log",
    description: "Your private daily weight check-in.",
    start_url: "/weight",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#f6f7f2",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
