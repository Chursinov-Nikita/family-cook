"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, Clock, Heart, Minus, Plus } from "lucide-react";
import Plate from "@/app/elements/Plate";
import Sheet from "@/app/elements/Sheet";
import { KINDS, recipe as findRecipe } from "@/app/lib/recipes";
import { formatAmount, product } from "@/app/lib/ingredients";
import { SLOTS } from "@/app/lib/types";
import { useCooksAround, useSpace, useToday } from "@/app/lib/hooks";
import { addCook, coverage, setDays, setRecipe } from "@/app/lib/planner";
import { addDays, diffDays, longDate, monthOf, weekday } from "@/app/lib/dates";
import { patchDoc } from "@/app/lib/store";
import { sound } from "@/app/lib/sound";

export default function RecipeView({ id }: { id: string }) {
  const r = findRecipe(id)!;
  const router = useRouter();
  const params = useSearchParams();
  const today = useToday();
  const { space } = useSpace();
  const [portions, setPortions] = useState<number | null>(null);
  const [planning, setPlanning] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const upcoming = today ? Array.from({ length: 14 }, (_, i) => addDays(today, i)) : [];
  const { cooks } = useCooksAround(upcoming);

  const slot = SLOTS.find((s) => s.kind === r.kind)!;
  const fromUrl = Math.round(Number(params.get("portions")));
  const count = portions ?? (fromUrl >= 1 && fromUrl <= 60 ? fromUrl : space.people);
  const factor = count / r.serves;
  const fav = !!space.favorites[r.id];
  const map = coverage(cooks);

  const plan = (day: string) => {
    const month = monthOf(day);
    const monthCooks = cooks.filter((c) => monthOf(c.start) === month);
    const entry = map.get(`${day}|${slot.id}`);
    if (entry && entry.cook.start === day) setRecipe(month, entry.cook, r.id);
    else {
      // день занят остатками прошлой готовки — укорачиваем её
      if (entry) setDays(month, entry.cook, diffDays(entry.cook.start, day), monthCooks);
      addCook(month, slot.id, day, r.id, monthCooks, space);
    }
    sound.create();
    setAdded(day);
    setPlanning(false);
  };

  return (
    <article className="mx-auto max-w-3xl animate-fade">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/recipes/"))}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-mute transition hover:text-cream"
      >
        <ArrowLeft size={17} /> Назад
      </button>

      <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Plate recipe={r} color={slot.color} size={64} />
        <div className="flex-1">
          <p className="eyebrow" style={{ color: slot.color }}>
            {KINDS.find((k) => k.id === r.kind)!.name}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{r.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-mute">
              <Clock size={14} /> {r.time} мин
            </span>
            <button
              aria-pressed={fav}
              onClick={() => {
                patchDoc("", { favorites: { [r.id]: fav ? undefined : true } });
                if (fav) sound.deselect();
                else sound.select();
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                fav ? "border-pink/40 bg-pink/10 text-pink" : "border-line text-mute hover:text-cream"
              }`}
            >
              <Heart size={14} className={fav ? "fill-pink" : ""} /> {fav ? "Любимое" : "В любимые"}
            </button>
            <button
              onClick={() => setPlanning(true)}
              className="flex items-center gap-1.5 rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink"
            >
              <CalendarPlus size={14} /> В план
            </button>
          </div>
          {added && <p className="mt-3 text-sm text-lime">Добавлено на {weekday(added)}, {longDate(added)}</p>}
        </div>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-[1fr_1.3fr]">
        <section className="card h-fit rounded-3xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl">Продукты</h2>
            <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1">
              <button
                aria-label="Меньше порций"
                onClick={() => setPortions(Math.max(1, count - 1))}
                className="grid size-8 place-items-center rounded-xl hover:bg-white/5"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-14 text-center text-sm font-bold tabular-nums">{count} порц.</span>
              <button
                aria-label="Больше порций"
                onClick={() => setPortions(Math.min(30, count + 1))}
                className="grid size-8 place-items-center rounded-xl hover:bg-white/5"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <ul className="divide-y divide-white/5">
            {r.items.map(([pid, amount]) => {
              const p = product(pid);
              return (
                <li key={pid} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className={p.staple ? "text-mute" : ""}>{p.name}</span>
                  <span className="shrink-0 text-sm text-mute tabular-nums">{formatAmount(amount * factor, p.unit)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl">Как готовить</h2>
          <ol className="space-y-3">
            {r.steps.map((step, i) => (
              <li key={i} className="card flex gap-4 rounded-2xl p-4">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full font-display text-lg"
                  style={{ background: `color-mix(in oklab, ${slot.color} 16%, transparent)`, color: slot.color }}
                >
                  {i + 1}
                </span>
                <p className="pt-1 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Sheet open={planning} onClose={() => setPlanning(false)} title={`${slot.name}: когда готовим?`}>
        <ul className="-mx-2 space-y-0.5">
          {upcoming.map((d) => {
            const current = findRecipe(map.get(`${d}|${slot.id}`)?.cook.recipe);
            return (
              <li key={d}>
                <button
                  onClick={() => plan(d)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-white/4"
                >
                  <span className="w-14 shrink-0">
                    <span className="block text-sm font-semibold text-dim first-letter:uppercase">{weekday(d)}</span>
                    <span className="font-display text-lg">{longDate(d).split(" ")[0]}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-mute">
                    {current ? `${current.title} → заменить` : "свободно"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </article>
  );
}
