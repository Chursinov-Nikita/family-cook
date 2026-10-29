"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Heart, Search } from "lucide-react";
import Plate from "@/app/elements/Plate";
import { KINDS, RECIPES, type Kind } from "@/app/lib/recipes";
import { SLOTS } from "@/app/lib/types";
import { useSpace } from "@/app/lib/hooks";
import { formatTime } from "@/app/lib/dates";
import { patchDoc } from "@/app/lib/store";
import { sound } from "@/app/lib/sound";

const colorOf = (kind: Kind) => SLOTS.find((s) => s.kind === kind)!.color;

export default function RecipesPage() {
  const { space } = useSpace();
  const [kind, setKind] = useState<Kind | "all" | "fav">("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const list = RECIPES.filter(
    (r) =>
      (kind === "all" || (kind === "fav" ? space.favorites[r.id] : r.kind === kind)) &&
      r.title.toLowerCase().includes(q),
  );

  const tabs = [
    { id: "all" as const, name: "Все", count: RECIPES.length },
    ...KINDS.map((k) => ({ id: k.id, name: k.plural, count: RECIPES.filter((r) => r.kind === k.id).length })),
    { id: "fav" as const, name: "Любимые", count: Object.keys(space.favorites).length },
  ];

  return (
    <div className="animate-fade">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Домашняя кухня</p>
          <h1 className="font-display text-3xl sm:text-4xl">
            Рецепты <em className="text-lime">без изысков</em>
          </h1>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-line bg-white/3 px-4 py-2.5 focus-within:border-lime/50 sm:w-72">
          <Search size={17} className="text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Борщ, плов, сырники…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
          />
        </label>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setKind(t.id)}
            className={`rounded-full px-4 py-2 font-semibold transition ${
              kind === t.id ? "bg-cream text-ink" : "bg-white/4 text-mute hover:text-cream"
            }`}
          >
            {t.name} <span className="opacity-50">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((r) => {
          const fav = !!space.favorites[r.id];
          const color = colorOf(r.kind);
          return (
            <div key={r.id} className="card group relative min-w-0 rounded-2xl transition hover:border-white/25">
              <Link
                href={`/recipes/${r.id}/`}
                className="flex h-full items-center gap-4 p-4 pr-14 sm:flex-col sm:items-start sm:gap-0 sm:pr-4"
              >
                <Plate recipe={r} color={color} size={44} />
                <span className="flex min-w-0 flex-col sm:mt-4 sm:flex-1">
                  <span className="text-sm font-semibold" style={{ color }}>
                    {KINDS.find((k) => k.id === r.kind)!.name}
                  </span>
                  <span className="text-lg leading-snug font-semibold break-words">{r.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm text-mute sm:mt-auto sm:pt-2">
                    <Clock size={14} /> {formatTime(r.time)}
                  </span>
                </span>
              </Link>
              <button
                aria-label={fav ? "Убрать из любимых" : "В любимые"}
                aria-pressed={fav}
                onClick={() => {
                  patchDoc("", { favorites: { [r.id]: fav ? undefined : true } });
                  if (fav) sound.deselect();
                  else sound.select();
                }}
                className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full transition hover:bg-white/5 sm:top-2 sm:translate-y-0"
              >
                <Heart size={20} className={fav ? "animate-pop fill-pink text-pink" : "text-dim"} />
              </button>
            </div>
          );
        })}
      </div>
      {!list.length && (
        <p className="py-16 text-center text-mute">
          {kind === "fav" ? "Отмечай сердечком блюда, которые нравятся — они будут чаще попадать в меню." : "Ничего не нашлось"}
        </p>
      )}
    </div>
  );
}
