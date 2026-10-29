"use client";

import { Check, Clock, Flame, Lock, Plus, Users } from "lucide-react";
import { keyIngredients, recipe as findRecipe } from "@/app/lib/recipes";
import { slotInfo, type Cook, type Slot } from "@/app/lib/types";
import { addDays, formatTime, plural, weekday, weekdayAcc } from "@/app/lib/dates";
import { useToday } from "@/app/lib/hooks";

type Props = {
  slot: Slot;
  day: string;
  people: number;
  entry?: { cook: Cook; index: number };
  compact?: boolean;
  onOpen: () => void;
};

const SlotLabel = ({ slot, muted }: { slot: Slot; muted?: boolean }) => {
  const info = slotInfo(slot);
  return (
    <span className={`flex items-center gap-2 text-sm font-semibold ${muted ? "text-dim" : "text-mute"}`}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: muted ? "var(--color-dim)" : info.color }} />
      {info.name}
    </span>
  );
};

// Дни, на которые хватит готовки: «пн, вт, ср»
const coveredDays = (cook: Cook) =>
  Array.from({ length: cook.days }, (_, i) => weekday(addDays(cook.start, i))).join(", ");

export default function MealCard({ slot, day, people, entry, compact, onOpen }: Props) {
  const today = useToday();
  const r = findRecipe(entry?.cook.recipe);

  if (!entry || !r) {
    return (
      <button
        onClick={onOpen}
        className={`flex h-full w-full rounded-2xl border border-dashed border-white/15 text-left transition hover:border-white/30 ${
          compact ? "flex-col items-start gap-2 p-3" : "items-center justify-between gap-3 p-4"
        }`}
      >
        <span className="flex flex-col gap-1">
          <SlotLabel slot={slot} />
          <span className="text-mute">Не выбрано</span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-lime">
          <Plus size={18} /> Добавить
        </span>
      </button>
    );
  }

  const { cook, index } = entry;
  const leftover = index > 0;
  const servings = cook.servings ?? people;
  const cookWhen = day === today ? "Готовить сегодня" : "Готовить в этот день";

  if (compact) {
    return (
      <button
        onClick={onOpen}
        className={`relative flex h-full w-full flex-col items-start gap-1.5 rounded-2xl p-3 text-left transition hover:border-white/25 ${
          leftover ? "border border-line" : "card"
        }`}
      >
        <SlotLabel slot={slot} muted={leftover} />
        <span className={`text-[15px] leading-snug font-semibold ${leftover ? "text-mute" : ""}`}>{r.title}</span>
        <span className="mt-auto pt-1 text-sm">
          {leftover ? (
            <span className="text-dim">Готово с {weekday(cook.start)}</span>
          ) : (
            <span className="font-semibold text-lime">Готовить · {formatTime(r.time)}</span>
          )}
        </span>
        {cook.locked && <Lock size={13} className="absolute top-3.5 right-3 text-mute" />}
      </button>
    );
  }

  if (leftover) {
    return (
      <button
        onClick={onOpen}
        className="flex w-full flex-col gap-1 rounded-2xl border border-line p-4 text-left transition hover:border-white/25"
      >
        <SlotLabel slot={slot} muted />
        <span className="text-lg leading-snug font-semibold text-mute">{r.title}</span>
        <span className="flex items-center gap-1.5 text-dim">
          <Check size={16} className="shrink-0" /> Уже готово — сварено в {weekdayAcc(cook.start)}, только разогреть
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="card flex w-full flex-col gap-2 rounded-2xl p-4 text-left transition hover:border-white/25"
    >
      <span className="flex items-center justify-between gap-3">
        <SlotLabel slot={slot} />
        {cook.locked && (
          <span className="flex items-center gap-1 text-sm text-mute">
            <Lock size={14} /> закреплено
          </span>
        )}
      </span>
      <span className="text-xl leading-snug font-semibold">{r.title}</span>
      <span className="text-mute">{keyIngredients(r)}</span>
      <span className="mt-1 flex flex-wrap items-center gap-2 text-[15px]">
        <span className="flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 font-semibold text-ink">
          <Flame size={16} /> {cookWhen}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/6 px-3 py-1">
          <Clock size={16} className="text-mute" /> {formatTime(r.time)}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/6 px-3 py-1">
          <Users size={16} className="text-mute" /> на {servings} {plural(servings, "человека", "человека", "человек")}
        </span>
      </span>
      {cook.days > 1 && (
        <span className="text-mute">
          Хватит на {cook.days} {plural(cook.days, "день", "дня", "дней")}: {coveredDays(cook)}
        </span>
      )}
    </button>
  );
}
