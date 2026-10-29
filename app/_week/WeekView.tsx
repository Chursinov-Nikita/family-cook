"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingBasket, Sparkles } from "lucide-react";
import MealCard from "@/app/elements/MealCard";
import DishSheet, { type Target } from "@/app/elements/DishSheet";
import PeopleChip, { PeopleStepper } from "@/app/elements/People";
import { useCooksAround, useMonth, useSpace, useToday } from "@/app/lib/hooks";
import {
  addDays,
  addMonths,
  dayNum,
  longDate,
  monthName,
  monthOf,
  weekDays,
  weekRange,
  weekStart,
  weekday,
  weekdayFull,
} from "@/app/lib/dates";
import { coverage, generateMonth } from "@/app/lib/planner";
import { recipe as findRecipe } from "@/app/lib/recipes";
import { SLOTS } from "@/app/lib/types";
import { buildShopList } from "@/app/lib/shopping";
import { sound } from "@/app/lib/sound";

export default function WeekView() {
  const params = useSearchParams();
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const day = picked ?? params.get("day") ?? today;
  const days = day ? weekDays(weekStart(day)) : [];
  const { space } = useSpace();
  const { cooks, ready } = useCooksAround(days);
  const firstMonth = days.length ? monthOf(days[0]) : null;
  const previous = useMonth(firstMonth ? addMonths(firstMonth, -1) : null);

  if (!day) return <div className="h-[70vh]" />;

  const map = coverage(cooks);
  const slots = SLOTS.filter((s) => space.slots[s.id]);
  const months = [...new Set(days.map(monthOf))];
  const emptyMonths = ready ? months.filter((m) => !cooks.some((c) => monthOf(c.start) === m)) : [];
  const hasPlan = cooks.length > 0;
  const shopCount = buildShopList(cooks, days, space).reduce((n, g) => n + g.items.length, 0);

  const cookingToday = cooks.filter((c) => c.start === day);

  const plan = (month: string) => {
    generateMonth(
      month,
      space,
      cooks.filter((c) => monthOf(c.start) === month),
      month === firstMonth ? Object.values(previous.cooks) : cooks.filter((c) => monthOf(c.start) !== month),
    );
    sound.success();
  };

  const go = (d: string) => {
    setPicked(d);
    sound.tap();
  };

  return (
    <div className="animate-fade">
      <section className="mb-6">
        <h1 className="font-display text-2xl first-letter:uppercase sm:text-3xl">
          {day === today ? "Сегодня" : weekdayFull(day)}, {longDate(day)}
        </h1>
        {hasPlan && (
          <p className="mt-1.5 text-lg text-mute">
            {cookingToday.length
              ? `Готовить: ${cookingToday.map((c) => findRecipe(c.recipe)?.title.toLowerCase()).join(", ")}`
              : "Готовить ничего не нужно — всё уже приготовлено"}
          </p>
        )}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            aria-label="Предыдущая неделя"
            onClick={() => go(addDays(day, -7))}
            className="grid size-11 place-items-center rounded-full border border-line text-mute transition hover:text-cream"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-32 px-2 text-center text-lg font-semibold">{weekRange(days[0])}</span>
          <button
            aria-label="Следующая неделя"
            onClick={() => go(addDays(day, 7))}
            className="grid size-11 place-items-center rounded-full border border-line text-mute transition hover:text-cream"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {today && !days.includes(today) && (
            <button onClick={() => go(today)} className="rounded-full bg-white/6 px-4 py-2 font-semibold">
              Сегодня
            </button>
          )}
          <PeopleChip />
        </div>
      </div>

      {ready && emptyMonths.length > 0 && (
        <div className="card mb-5 flex flex-col items-start gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl">
              {hasPlan ? "Меню продолжается в новом месяце" : "Меню ещё не собрано"}
            </p>
            <p className="mt-1 max-w-md text-mute">
              Соберу домашнее меню на {emptyMonths.map((m) => monthName(m).name).join(" и ")}: супы на 2–3 дня, вторые без
              повторов, всё можно поменять.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-mute">Готовим на</span>
              <PeopleStepper />
              <span className="text-mute">чел.</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            {emptyMonths.map((m) => (
              <button
                key={m}
                onClick={() => plan(m)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-lg font-bold text-ink sm:w-auto sm:text-base"
              >
                <Sparkles size={17} /> Собрать {monthName(m).name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Телефон: полоска дней и подробный день */}
      <div className="lg:hidden">
        <div className="mb-5 flex gap-1">
          {days.map((d) => {
            const active = d === day;
            return (
              <button
                key={d}
                onClick={() => go(d)}
                aria-current={active ? "date" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl py-2 transition ${
                  active ? "bg-lime text-ink" : d === today ? "bg-white/8 text-cream ring-1 ring-lime/50" : "bg-white/4 text-mute"
                }`}
              >
                <span className="text-sm font-semibold first-letter:uppercase">{weekday(d)}</span>
                <span className="text-lg font-bold">{dayNum(d)}</span>
              </button>
            );
          })}
        </div>
        <div key={day} className="animate-rise space-y-3">
          {slots.map((s) => (
            <MealCard
              key={s.id}
              slot={s.id}
              day={day}
              people={space.people}
              entry={map.get(`${day}|${s.id}`)}
              onOpen={() => setTarget({ slot: s.id, day, ...map.get(`${day}|${s.id}`) })}
            />
          ))}
        </div>
      </div>

      {/* Компьютер: вся неделя доской */}
      {/* ряд на каждый приём пищи — карточки одной строки выровнены по высоте */}
      <div className="hidden grid-cols-7 gap-2 lg:grid">
        {days.map((d) => (
          <div
            key={d}
            className={`flex items-baseline justify-between rounded-2xl px-3 py-2 ${
              d === today ? "bg-lime text-ink" : "text-mute"
            }`}
          >
            <span className="font-semibold first-letter:uppercase">
              {weekday(d)}
              {d === today && " · сегодня"}
            </span>
            <span className="text-lg font-bold">{dayNum(d)}</span>
          </div>
        ))}
        {slots.map((s) =>
          days.map((d) => (
            <MealCard
              key={`${s.id}-${d}`}
              compact
              slot={s.id}
              day={d}
              people={space.people}
              entry={map.get(`${d}|${s.id}`)}
              onOpen={() => setTarget({ slot: s.id, day: d, ...map.get(`${d}|${s.id}`) })}
            />
          )),
        )}
      </div>

      {hasPlan && (
        <Link
          href={`/shop/?week=${days[0]}`}
          className="card mt-6 flex items-center gap-3 rounded-2xl p-4 transition hover:border-white/25"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-lime/15 text-lime">
            <ShoppingBasket size={19} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Покупки на неделю</span>
            <span className="text-mute">
              {shopCount} продуктов для блюд + обязательные покупки
            </span>
          </span>
          <ChevronRight size={18} className="text-dim" />
        </Link>
      )}

      <DishSheet target={target} onClose={() => setTarget(null)} monthCooks={cooks} space={space} />
    </div>
  );
}
