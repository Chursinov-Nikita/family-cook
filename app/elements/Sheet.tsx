"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

// Снизу на телефоне, по центру на компьютере
export default function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card relative flex max-h-[90dvh] w-full animate-rise flex-col overflow-hidden rounded-t-[28px] sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-3 pb-1 sm:pt-5">
          <h2 className="font-display text-xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="grid size-11 place-items-center rounded-full text-mute transition hover:bg-white/5 hover:text-cream"
          >
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
