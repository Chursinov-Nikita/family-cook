"use client";

import Link from "next/link";
import { useMounted, useSyncStatus } from "@/app/lib/hooks";

const LABELS = {
  local: { text: "На устройстве", color: "bg-dim" },
  offline: { text: "Без сети", color: "bg-lime" },
  syncing: { text: "Синхронизация", color: "bg-lime animate-pulse" },
  synced: { text: "Синхронизировано", color: "bg-lime" },
};

export default function SyncBadge() {
  const status = useSyncStatus();
  const mounted = useMounted();
  const { text, color } = LABELS[status];

  return (
    <Link
      href="/family/"
      className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-mute transition hover:text-cream"
      title="Синхронизация между устройствами"
    >
      <span className={`size-2 rounded-full ${mounted ? color : "bg-dim"}`} />
      <span className="hidden sm:inline">{mounted ? text : "…"}</span>
    </Link>
  );
}
