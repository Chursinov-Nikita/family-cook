import type { MetadataRoute } from "next";
import { asset } from "@/app/lib/asset";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Что готовим — меню семьи",
    short_name: "Что готовим",
    description: "Домашнее меню на месяц и список покупок на неделю для всей семьи.",
    lang: "ru",
    // Новый id: Chrome считает это другим приложением и не натыкается
    // на сломанную запись от первой неудачной установки на Android
    id: asset("/?app=menu-v2"),
    start_url: asset("/?app=menu-v2"),
    scope: asset("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
      {
        src: asset("/icons/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
