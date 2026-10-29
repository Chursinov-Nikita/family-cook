"use client";

import { useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import Sheet from "./Sheet";
import { useMonth, useSpace, useToday } from "@/app/lib/hooks";
import { patchDoc } from "@/app/lib/store";
import { resetServings } from "@/app/lib/planner";
import { addMonths, monthOf, plural } from "@/app/lib/dates";
import { sound } from "@/app/lib/sound";

export const peopleLabel = (n: number) => `${n} ${plural(n, "человек", "человека", "человек")}`;

// Число людей — значение по умолчанию для порций всех блюд и списка покупок
export function PeopleStepper({ size = "md" }: { size?: "md" | "lg" }) {
  const { space } = useSpace();
  const set = (n: number) => {
    patchDoc("", { people: Math.min(12, Math.max(1, n)) });
    sound.tap();
  };
  const big = size === "lg";
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1">
      <button
        aria-label="Меньше людей"
        onClick={() => set(space.people - 1)}
        disabled={space.people <= 1}
        className={`grid place-items-center rounded-xl transition hover:bg-white/5 disabled:opacity-30 ${big ? "size-12" : "size-9"}`}
      >
        <Minus size={big ? 20 : 16} />
      </button>
      <span className={`text-center font-display tabular-nums ${big ? "w-14 text-3xl" : "w-8 text-xl"}`}>
        {space.people}
      </span>
      <button
        aria-label="Больше людей"
        onClick={() => set(space.people + 1)}
        disabled={space.people >= 12}
        className={`grid place-items-center rounded-xl transition hover:bg-white/5 disabled:opacity-30 ${big ? "size-12" : "size-9"}`}
      >
        <Plus size={big ? 20 : 16} />
      </button>
    </div>
  );
}

export default function PeopleChip() {
  const { space, ready } = useSpace();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const current = today ? monthOf(today) : null;
  const next = current ? addMonths(current, 1) : null;
  const a = useMonth(current);
  const b = useMonth(next);
  const custom = [...Object.values(a.cooks), ...Object.values(b.cooks)].filter((c) => c.servings).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-white/3 px-3.5 py-2 text-sm font-semibold transition hover:border-white/20"
      >
        <Users size={16} className="text-lime" />
        {ready ? peopleLabel(space.people) : "…"}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="На сколько человек готовим">
        <div className="flex flex-col items-center gap-4 py-2">
          <PeopleStepper size="lg" />
          <p className="max-w-xs text-center text-sm text-mute">
            Это число по умолчанию для всех блюд: на него считаются порции в рецептах и продукты в списке покупок.
          </p>
        </div>
        {custom > 0 && current && next && (
          <div className="mt-4 rounded-2xl bg-white/3 p-4">
            <p className="text-sm">
              У {custom} {plural(custom, "блюда", "блюд", "блюд")} вручную задано своё число порций.
            </p>
            <button
              onClick={() => {
                resetServings(current, Object.values(a.cooks));
                resetServings(next, Object.values(b.cooks));
                sound.select();
              }}
              className="mt-3 w-full rounded-xl bg-white/6 py-2.5 text-sm font-semibold transition hover:bg-white/10"
            >
              Сбросить — всем по {space.people}
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-2xl bg-lime py-3 font-bold text-ink"
        >
          Готово
        </button>
      </Sheet>
    </>
  );
}
