"use client";

import { useEffect } from "react";
import { asset } from "@/app/lib/asset";

export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js")).catch(() => {});
  }, []);

  return null;
}
