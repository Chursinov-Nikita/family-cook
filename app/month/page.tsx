"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import Sheet from "@/app/elements/Sheet";
import DishIcon from "@/app/elements/DishIcon";
import PeopleChip from "@/app/elements/People";
import { useMonth, useSpace, useToday } from "@/app/lib/hooks";
import { addMonths, dayNum, monthDays, monthName, monthOf, parse, plural, WEEKDAYS, weekRange, weekStart, weekday } from "@/app/lib/dates";
import { coverage, generateMonth } from "@/app/lib/planner";
import { recipe as findRecipe } from "@/app/lib/recipes";
import { SLOTS, slotInfo } from "@/app/lib/types";
import { sound } from "@/app/lib/sound";

export default function MonthPage() {
  const today = useToday();
  const router = useRouter();
  const [shift, setShift] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const month = today ? addMonths(monthOf(today), shift) : null;
  const { space } = useSpace();
  const { cooks: cookMap, ready } = useMonth(month);
  const previous = useMonth(month ? addMonths(month, -1) : null);

  if (!month) return <div className="h-[70vh]" />;

  const cooks = Object.values(cookMap);
  const map = coverage(cooks);
  const days = monthDays(month);
  const lead = (parse(days[0]).getDay() + 6) % 7;
  const slots = SLOTS.filter((s) => space.slots[s.id]);
  const weeks = days.reduce<string[][]>((acc, d) => {
    const last = acc.at(-1);
    if (last && weekStart(last[0]) === weekStart(d)) last.push(d);
    else acc.push([d]);
    return acc;
  }, []);
  const { name, year } = monthName(month);
  const locked = cooks.filter((c) => c.locked).length;

  const build = () => {
    generateMonth(month, space, cooks, Object.values(previous.cooks));
    setConfirm(false);
    sound.success();
  };

  const listOf = (slot: (typeof SLOTS)[number]["id"]) =>
    cooks
      .filter((c) => c.slot === slot)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((c) => findRecipe(c.recipe))
      .filter((r) => r !== undefined);

  const soups = listOf("lunch");
  const mains = listOf("dinner");
  const unique = (list: { id: string }[]) => new Set(list.map((r) => r.id)).size;

  return (
    <div className="animate-fade">
      <section className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Меню на месяц</p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Предыдущий месяц"
              onClick={() => setShift(shift - 1)}
              className="grid size-10 place-items-center rounded-full border border-line text-mute transition hover:text-cream"
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="min-w-40 text-center font-display text-3xl capitalize sm:text-4xl">
              {name} <span className="text-dim">{year}</span>
            </h1>
            <button
              aria-label="Следующий месяц"
              onClick={() => setShift(shift + 1)}
              className="grid size-10 place-items-center rounded-full border border-line text-mute transition hover:text-cream"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <PeopleChip />
        {ready && (
          <button
            onClick={() => (cooks.length ? setConfirm(true) : build())}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-bold transition ${
              cooks.length
                ? "border border-line bg-white/4 text-cream hover:bg-white/7"
                : "bg-lime text-ink"
            }`}
          >
            {cooks.length ? <RefreshCw size={17} /> : <Sparkles size={17} />}
            {cooks.length ? "Пересобрать меню" : "Собрать меню на месяц"}
          </button>
        )}
        </div>
      </section>

      {cooks.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            { value: unique(soups), label: plural(unique(soups), "суп", "супа", "супов"), color: "text-mint" },
            { value: unique(mains), label: plural(unique(mains), "второе", "вторых", "вторых"), color: "text-sky" },
            { value: locked, label: plural(locked, "закреплено", "закреплено", "закреплено"), color: "text-lime" },
          ].map((s) => (
            <div key={s.label} className="card rounded-2xl px-4 py-3">
              <p className={`font-display text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-sm text-mute">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Телефон: список по дням — читается легче, чем тесная сетка */}
      <div className="space-y-6 lg:hidden">
        {weeks.map((week) => (
          <section key={week[0]}>
            <h2 className="mb-2 text-lg font-semibold">Неделя {weekRange(weekStart(week[0]))}</h2>
            <div className="card divide-y divide-white/8 rounded-2xl">
              {week.map((d) => (
                <button
                  key={d}
                  onClick={() => router.push(`/?day=${d}`)}
                  className={`flex w-full gap-4 px-4 py-3 text-left transition hover:bg-white/3 ${d === today ? "bg-lime/8" : ""}`}
                >
                  <span className="w-11 shrink-0">
                    <span className={`block text-sm font-semibold first-letter:uppercase ${d === today ? "text-lime" : "text-mute"}`}>
                      {weekday(d)}
                    </span>
                    <span className="text-xl font-bold">{dayNum(d)}</span>
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    {slots.map((s) => {
                      const entry = map.get(`${d}|${s.id}`);
                      const r = findRecipe(entry?.cook.recipe);
                      if (!r) return null;
                      const first = entry!.index === 0;
                      return (
                        <span key={s.id} className="flex items-baseline gap-2">
                          <span className="size-2 shrink-0 translate-y-[-1px] rounded-full" style={{ background: first ? slotInfo(s.id).color : "var(--color-dim)" }} />
                          <span className={first ? "" : "text-dim"}>
                            {r.title}
                            {!first && " — уже готово"}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="card hidden overflow-hidden rounded-3xl p-3 lg:block">
        <div className="grid grid-cols-7 gap-1 pb-1">
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1.5 text-center text-sm font-bold text-dim">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${i}`} />
          ))}
          {days.map((d) => (
            <button
              key={d}
              onClick={() => router.push(`/?day=${d}`)}
              className={`group flex min-h-32 flex-col gap-1 rounded-2xl p-2 text-left transition hover:bg-white/5 ${
                d === today ? "bg-lime/8 ring-1 ring-lime/40" : "bg-white/2"
              }`}
            >
              <span className={`font-semibold ${d === today ? "text-lime" : "text-mute"}`}>
                {dayNum(d)}
              </span>
              <span className="flex flex-col gap-1">
                {slots.map((s) => {
                  const entry = map.get(`${d}|${s.id}`);
                  const r = findRecipe(entry?.cook.recipe);
                  if (!r) return null;
                  const first = entry!.index === 0;
                  return (
                    <span key={s.id} className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: first ? slotInfo(s.id).color : "var(--color-dim)" }}
                      />
                      <span className={`truncate text-sm ${first ? "" : "text-dim"}`}>{r.title}</span>
                    </span>
                  );
                })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {cooks.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            { title: "Супы месяца", list: soups, color: "var(--color-mint)" },
            { title: "Вторые блюда", list: mains, color: "var(--color-sky)" },
          ].map((group) => (
            <section key={group.title} className="card rounded-3xl p-5">
              <h2 className="mb-3 font-display text-lg">{group.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                {group.list.map((r, i) => (
                  <span
                    key={`${r.id}-${i}`}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                    style={{ borderColor: `color-mix(in oklab, ${group.color} 30%, transparent)` }}
                  >
                    <DishIcon recipe={r} size={13} style={{ color: group.color }} />
                    {r.title}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Собрать заново?">
        <p className="text-mute">
          Меню на {name} соберётся с нуля.{" "}
          {locked > 0
            ? `${locked} ${plural(locked, "закреплённое блюдо останется", "закреплённых блюда останутся", "закреплённых блюд останутся")} на своих местах.`
            : "Закреплённых блюд нет — поменяется всё."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => setConfirm(false)} className="rounded-2xl bg-white/6 py-3 font-semibold">
            Отмена
          </button>
          <button onClick={build} className="rounded-2xl bg-lime py-3 font-bold text-ink">
            Собрать
          </button>
        </div>
      </Sheet>
    </div>
  );
}
