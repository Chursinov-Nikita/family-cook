"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Lock, LockOpen, Minus, Plus, Shuffle, Sparkles, Trash2, Utensils } from "lucide-react";
import Sheet from "./Sheet";
import Plate from "./Plate";
import RecipePicker from "./RecipePicker";
import { peopleLabel } from "./People";
import { recipe as findRecipe } from "@/app/lib/recipes";
import { slotInfo, type Cook, type Slot, type Space } from "@/app/lib/types";
import { addCook, deleteCook, setDays, setRecipe, setServings, suggestFor, toggleLock, candidates } from "@/app/lib/planner";
import { longDate, monthOf, plural, weekdayFull } from "@/app/lib/dates";
import { sound } from "@/app/lib/sound";

export type Target = { slot: Slot; day: string; cook?: Cook; index?: number };

type Props = {
  target: Target | null;
  onClose: () => void;
  monthCooks: Cook[];
  space: Space;
};

export default function DishSheet({ target, onClose, monthCooks, space }: Props) {
  const [picking, setPicking] = useState(false);
  const close = () => {
    setPicking(false);
    onClose();
  };

  if (!target) return <Sheet open={false} onClose={close}>{null}</Sheet>;

  const { slot, day } = target;
  // берём свежую версию из плана — после «закрепить» или смены дней
  const cook = target.cook && (monthCooks.find((c) => c.id === target.cook!.id) ?? target.cook);
  const info = slotInfo(slot);
  const month = monthOf(cook?.start ?? day);
  const cooksOfMonth = monthCooks.filter((c) => monthOf(c.start) === month);
  const used = new Set(cooksOfMonth.map((c) => c.recipe));
  const r = findRecipe(cook?.recipe);
  const title = `${info.name} · ${weekdayFull(day)}, ${longDate(day)}`;

  const pickRecipe = (id: string) => {
    if (cook) setRecipe(month, cook, id);
    else addCook(month, slot, day, id, cooksOfMonth, space);
    sound.select();
    close();
  };

  if (!cook || !r || picking) {
    return (
      <Sheet open onClose={close} title={cook ? "Выбрать другое" : title}>
        {!cook && (
          <button
            onClick={() => {
              const list = candidates(slot, space).filter((x) => !used.has(x.id));
              const pool = list.length ? list : candidates(slot, space);
              pickRecipe(pool[Math.floor(Math.random() * pool.length)].id);
            }}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3 font-bold text-ink"
          >
            <Sparkles size={17} /> Подобрать за меня
          </button>
        )}
        <RecipePicker kind={info.kind} space={space} current={cook?.recipe} used={used} onPick={pickRecipe} />
      </Sheet>
    );
  }

  const servings = cook.servings ?? space.people;
  // совпало с общим числом — блюдо снова следует за настройкой семьи
  const changeServings = (n: number) => {
    const next = Math.min(20, Math.max(1, n));
    setServings(month, cook, next === space.people ? undefined : next);
    sound.tap();
  };
  const [, maxDays] = space.durations[slot];

  return (
    <Sheet open onClose={close} title={title}>
      <div className="flex items-center gap-3.5 pb-4">
        <Plate recipe={r} color={info.color} size={56} />
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight">{r.title}</p>
          <p className="mt-1 text-sm text-mute">
            {target.index
              ? `Доедаем — день ${target.index + 1} из ${cook.days}`
              : `Готовим ${longDate(cook.start)} · ${r.time} мин`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setRecipe(month, cook, suggestFor(cook, cooksOfMonth, space).id);
            sound.select();
            close();
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-lime py-3 font-bold text-ink"
        >
          <Shuffle size={17} /> Другое
        </button>
        <button
          onClick={() => setPicking(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/6 py-3 font-semibold"
        >
          <Utensils size={17} /> Выбрать
        </button>
        <Link
          href={`/recipes/${r.id}/?portions=${servings * cook.days}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/6 py-3 font-semibold"
        >
          <BookOpen size={17} /> Рецепт
        </Link>
        <button
          onClick={() => {
            toggleLock(month, cook);
            sound.tap();
          }}
          className={`flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold transition ${
            cook.locked ? "bg-lime/15 text-lime" : "bg-white/6"
          }`}
        >
          {cook.locked ? <Lock size={17} /> : <LockOpen size={17} />}
          {cook.locked ? "Закреплено" : "Закрепить"}
        </button>
      </div>
      <p className="mt-2 text-sm text-dim">Закреплённое блюдо останется на месте, когда меню соберётся заново.</p>

      <div className="mt-6 space-y-4">
        <div>
          <p className="eyebrow mb-2">Готовим на</p>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.max(maxDays, 3) + 1 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => {
                  setDays(month, cook, n, cooksOfMonth);
                  sound.tap();
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                  cook.days === n ? "bg-lime text-ink" : "bg-white/5 text-mute hover:text-cream"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-sm text-dim">
            {cook.days} {plural(cook.days, "день", "дня", "дней")} — продукты в списке покупок считаются на всё это время
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Порций в день</p>
            {cook.servings ? (
              <button
                onClick={() => setServings(month, cook, undefined)}
                className="text-sm font-semibold text-lime hover:underline"
              >
                Сбросить — как у всех ({space.people})
              </button>
            ) : (
              <p className="text-sm text-dim">как у всех — {peopleLabel(space.people)}</p>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1">
            <button
              aria-label="Меньше"
              onClick={() => changeServings(servings - 1)}
              className="grid size-9 place-items-center rounded-xl hover:bg-white/5"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-bold tabular-nums">{servings}</span>
            <button
              aria-label="Больше"
              onClick={() => changeServings(servings + 1)}
              className="grid size-9 place-items-center rounded-xl hover:bg-white/5"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          deleteCook(month, cook);
          sound.remove();
          close();
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-mute transition hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={16} /> Убрать из плана
      </button>
    </Sheet>
  );
}
