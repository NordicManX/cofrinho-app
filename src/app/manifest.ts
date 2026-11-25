import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cofrinho — Metas Financeiras",
    short_name: "Cofrinho",
    description:
      "Planejamento de metas financeiras com acompanhamento de ritmo e simulador.",
    start_url: "/",
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
