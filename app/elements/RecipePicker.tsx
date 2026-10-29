"use client";

import { useState } from "react";
import { Clock, Heart, Search } from "lucide-react";
import { RECIPES, type Kind } from "@/app/lib/recipes";
import { SLOTS, type Space } from "@/app/lib/types";
import Plate from "./Plate";

type Props = {
  kind: Kind;
  space: Space;
  current?: string;
  used?: Set<string>;
  onPick: (id: string) => void;
};

export default function RecipePicker({ kind, space, current, used, onPick }: Props) {
  const [query, setQuery] = useState("");
  const color = SLOTS.find((s) => s.kind === kind)!.color;
  const q = query.trim().toLowerCase();
  const list = RECIPES.filter((r) => r.kind === kind && r.title.toLowerCase().includes(q)).sort(
    (a, b) =>
      Number(!!space.favorites[b.id]) - Number(!!space.favorites[a.id]) ||
      Number(!!used?.has(a.id)) - Number(!!used?.has(b.id)) ||
      a.title.localeCompare(b.title, "ru"),
  );

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 rounded-2xl border border-line bg-white/3 px-3.5 py-3 focus-within:border-lime/50">
        <Search size={17} className="text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти блюдо"
          className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
        />
      </label>
      <ul className="-mx-2 space-y-0.5">
        {list.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onPick(r.id)}
              disabled={r.id === current}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/4 disabled:opacity-40"
            >
              <Plate recipe={r} color={color} size={38} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.title}</span>
                <span className="flex items-center gap-3 text-sm text-mute">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {r.time} мин
                  </span>
                  {used?.has(r.id) && <span>уже в этом месяце</span>}
                  {r.id === current && <span>сейчас в плане</span>}
                </span>
              </span>
              {space.favorites[r.id] && <Heart size={15} className="fill-pink text-pink" />}
            </button>
          </li>
        ))}
        {!list.length && <li className="px-2 py-6 text-center text-sm text-mute">Ничего не нашлось</li>}
      </ul>
    </div>
  );
}
