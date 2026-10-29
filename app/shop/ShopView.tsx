"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Apple,
  Beef,
  Carrot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Croissant,
  EyeOff,
  Fish,
  Milk,
  MoreHorizontal,
  Package,
  PencilLine,
  Plus,
  Repeat,
  Share2,
  Snowflake,
  Soup,
  Trash2,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import Sheet from "@/app/elements/Sheet";
import PeopleChip from "@/app/elements/People";
import { useCooksAround, useSpace, useToday, useWeek } from "@/app/lib/hooks";
import { addDays, parse, weekDays, weekRange, weekStart } from "@/app/lib/dates";
import { DEPTS, formatAmount } from "@/app/lib/ingredients";
import { buildShopList } from "@/app/lib/shopping";
import { recipe as findRecipe } from "@/app/lib/recipes";
import { patchDoc, uid } from "@/app/lib/store";
import { sound } from "@/app/lib/sound";

const ICONS: Record<string, LucideIcon> = {
  Apple, Beef, Carrot, Croissant, Fish, Milk, Package, PencilLine, Repeat, Snowflake, Soup, Wheat,
};

type Row = {
  key: string;
  name: string;
  amount?: string;
  note?: string;
  kind: "basic" | "dish" | "extra";
};

const defaultWeek = (today: string) => {
  // в выходные обычно закупаются на следующую неделю
  const weekdayIndex = (parse(today).getDay() + 6) % 7;
  return weekStart(weekdayIndex >= 5 ? addDays(today, 7) : today);
};

export default function ShopView() {
  const params = useSearchParams();
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const [menu, setMenu] = useState<Row | null>(null);
  const [swap, setSwap] = useState("");
  const [draft, setDraft] = useState("");
  const [showPantry, setShowPantry] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const start = picked ?? params.get("week") ?? (today ? defaultWeek(today) : null);
  const days = start ? weekDays(start) : [];
  const { space } = useSpace();
  const { cooks } = useCooksAround(days);
  const { week } = useWeek(start);

  if (!start || !today) return <div className="h-[70vh]" />;

  const path = `weeks/${start}`;
  const checked = week.checked ?? {};
  const swaps = week.swaps ?? {};
  const hidden = week.hidden ?? {};
  const groups = buildShopList(cooks, days, space);
  const dishes = cooks
    .filter((c) => days.includes(c.start))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((c) => findRecipe(c.recipe))
    .filter((r) => r !== undefined);

  const basics: Row[] = Object.values(space.basics)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map((b) => ({ key: `b:${b.id}`, name: b.name, note: b.note, kind: "basic" }));
  const extras: Row[] = Object.values(week.extra ?? {})
    .sort((a, b) => a.at - b.at)
    .map((x) => ({ key: `x:${x.id}`, name: x.name, note: x.note, kind: "extra" }));
  const dishGroups = groups.map((g) => ({
    dept: g.dept,
    rows: g.items.map<Row>((item) => ({
      key: item.key,
      name: item.name,
      amount: formatAmount(item.amount, item.unit),
      note: item.uses.join(", "),
      kind: "dish",
    })),
  }));
  const shopGroups = dishGroups.filter((g) => g.dept.id !== "pantry");
  const pantry = dishGroups.find((g) => g.dept.id === "pantry")?.rows ?? [];

  const visible = (rows: Row[]) => rows.filter((r) => !hidden[r.key]);
  const ordered = (rows: Row[]) =>
    visible(rows).sort((a, b) => Number(!!checked[a.key]) - Number(!!checked[b.key]));
  const counted = [...basics, ...extras, ...shopGroups.flatMap((g) => g.rows)].filter((r) => !hidden[r.key]);
  const done = counted.filter((r) => checked[r.key]).length;
  const hiddenRows = [...basics, ...extras, ...dishGroups.flatMap((g) => g.rows)].filter((r) => hidden[r.key]);
  const progress = counted.length ? done / counted.length : 0;

  const toggle = (row: Row) => {
    const next = !checked[row.key];
    patchDoc(path, { checked: { [row.key]: next || undefined } });
    if (next && done + 1 === counted.length) sound.celebrate();
    else if (next) sound.select();
    else sound.deselect();
  };

  const addExtra = () => {
    const names = draft
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.length) return;
    const now = Date.now();
    patchDoc(path, {
      extra: Object.fromEntries(
        names.map((name, i) => {
          const id = uid();
          return [id, { id, name: name.slice(0, 60), at: now + i }];
        }),
      ),
    });
    setDraft("");
    sound.create();
  };

  const share = async () => {
    const lines = [
      `Покупки на ${weekRange(start)}`,
      ...[...basics, ...shopGroups.flatMap((g) => g.rows), ...extras]
        .filter((r) => !hidden[r.key] && !checked[r.key])
        .map((r) => `— ${swaps[r.key] ?? r.name}${r.amount ? ` (${r.amount})` : r.note && r.kind !== "dish" ? ` (${r.note})` : ""}`),
    ];
    const text = lines.join("\n");
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  };

  const openMenu = (row: Row) => {
    setMenu(row);
    setSwap(swaps[row.key] ?? "");
  };

  const renderRow = (row: Row) => {
    const isChecked = !!checked[row.key];
    const swapped = swaps[row.key];
    return (
      <li key={row.key} className="flex items-center gap-3 py-3">
        <button
          aria-label={isChecked ? "Вернуть в список" : "Куплено"}
          aria-pressed={isChecked}
          onClick={() => toggle(row)}
          className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${
            isChecked ? "border-lime bg-lime text-ink" : "border-white/20 hover:border-lime/70"
          }`}
        >
          {isChecked && <Check size={18} strokeWidth={3} className="animate-pop" />}
        </button>
        <button onClick={() => toggle(row)} className="min-w-0 flex-1 text-left">
          <span className={`block truncate font-medium transition ${isChecked ? "text-dim line-through" : ""}`}>
            {swapped ?? row.name}
          </span>
          {(swapped || row.note) && (
            <span className="block truncate text-sm text-dim">
              {swapped ? `вместо: ${row.name}` : row.kind === "dish" ? `для: ${row.note}` : row.note}
            </span>
          )}
        </button>
        {row.amount && (
          <span className={`shrink-0 text-sm tabular-nums ${isChecked ? "text-dim" : "text-mute"}`}>{row.amount}</span>
        )}
        <button
          aria-label="Ещё"
          onClick={() => openMenu(row)}
          className="grid size-8 shrink-0 place-items-center rounded-full text-dim transition hover:bg-white/5 hover:text-cream"
        >
          <MoreHorizontal size={17} />
        </button>
      </li>
    );
  };

  const section = (title: string, rows: Row[], icon?: string, color = "text-mute") => {
    const list = ordered(rows);
    if (!list.length) return null;
    const Icon = icon ? ICONS[icon] : null;
    return (
      <section key={title} className="card rounded-3xl px-4 pt-4 pb-2 sm:px-5">
        <h3 className={`flex items-center gap-2 text-sm font-bold ${color}`}>
          {Icon && <Icon size={16} />} {title}
          <span className="ml-auto text-sm font-semibold text-dim tabular-nums">
            {list.filter((r) => checked[r.key]).length}/{list.length}
          </span>
        </h3>
        <ul className="divide-y divide-white/5">{list.map(renderRow)}</ul>
      </section>
    );
  };

  const isCurrent = start === weekStart(today);
  const isNext = start === weekStart(addDays(today, 7));

  return (
    <div className="mx-auto max-w-3xl animate-fade">
      <section className="mb-6">
        <p className="eyebrow mb-3">Список покупок</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Предыдущая неделя"
              onClick={() => setPicked(addDays(start, -7))}
              className="grid size-10 place-items-center rounded-full border border-line text-mute transition hover:text-cream"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-36 text-center">
              <h1 className="font-display text-2xl sm:text-3xl">{weekRange(start)}</h1>
              <p className="text-sm text-dim">{isCurrent ? "эта неделя" : isNext ? "следующая неделя" : " "}</p>
            </div>
            <button
              aria-label="Следующая неделя"
              onClick={() => setPicked(addDays(start, 7))}
              className="grid size-10 place-items-center rounded-full border border-line text-mute transition hover:text-cream"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <PeopleChip />
          <button
            onClick={share}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-mute transition hover:text-cream"
          >
            <Share2 size={16} /> Отправить
          </button>
          </div>
        </div>
      </section>

      <div className="card mb-4 rounded-3xl p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-xl">
            {done === counted.length && counted.length ? "Всё куплено 🎉" : `Куплено ${done} из ${counted.length}`}
          </p>
          <p className="text-sm text-mute tabular-nums">{Math.round(progress * 100)}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/6">
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {dishes.length > 0 && (
          <p className="mt-4 text-sm leading-relaxed text-mute">
            <span className="text-dim">Готовим: </span>
            {dishes.map((r) => r.title).join(" · ")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {section("Каждую неделю", basics, "Repeat", "text-lime")}

        {shopGroups.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-mute">
            На эту неделю блюд в плане нет — собери меню на вкладке «Неделя» или «Месяц».
          </div>
        )}
        {shopGroups.map((g) => section(g.dept.name, g.rows, g.dept.icon))}

        {extras.length > 0 && section("Своё", extras, "PencilLine", "text-pink")}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addExtra();
          }}
          className="flex items-center gap-2 rounded-2xl border border-line bg-white/2 p-1.5 pl-4 focus-within:border-lime/40"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Добавить своё: хлеб, порошок…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-dim"
          />
          <button
            type="submit"
            aria-label="Добавить"
            className="grid size-10 place-items-center rounded-2xl bg-cream text-ink disabled:opacity-30"
            disabled={!draft.trim()}
          >
            <Plus size={18} />
          </button>
        </form>

        {visible(pantry).length > 0 && (
          <section className="rounded-3xl border border-line px-4 py-3 sm:px-5">
            <button onClick={() => setShowPantry(!showPantry)} className="flex w-full items-center gap-2 text-sm font-bold text-mute">
              <Package size={16} /> {DEPTS.find((d) => d.id === "pantry")!.name}
              <span className="font-normal text-dim">— соль, масло, специи</span>
              <ChevronDown size={16} className={`ml-auto transition ${showPantry ? "rotate-180" : ""}`} />
            </button>
            {showPantry && <ul className="mt-1 divide-y divide-white/5">{ordered(pantry).map(renderRow)}</ul>}
          </section>
        )}

        {hiddenRows.length > 0 && (
          <div className="pt-2 text-center">
            <button onClick={() => setShowHidden(!showHidden)} className="text-sm font-semibold text-dim hover:text-mute">
              Убрано из списка: {hiddenRows.length} {showHidden ? "▲" : "▼"}
            </button>
            {showHidden && (
              <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
                {hiddenRows.map((r) => (
                  <li key={r.key}>
                    <button
                      onClick={() => patchDoc(path, { hidden: { [r.key]: undefined } })}
                      className="rounded-full border border-line px-3 py-1 text-sm text-mute hover:text-cream"
                    >
                      ↺ {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        {menu && (
          <div className="space-y-4">
            {menu.kind === "dish" && menu.note && (
              <p className="text-sm text-mute">
                Нужно {menu.amount} для: {menu.note}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = swap.trim();
                patchDoc(path, { swaps: { [menu.key]: value ? value.slice(0, 60) : undefined } });
                sound.select();
                setMenu(null);
              }}
            >
              <label className="eyebrow mb-2 block">Заменить на</label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={swap}
                  onChange={(e) => setSwap(e.target.value)}
                  placeholder={menu.kind === "dish" ? "например, свинина вместо говядины" : "что купить вместо"}
                  className="min-w-0 flex-1 rounded-2xl border border-line bg-white/3 px-4 py-3 text-sm outline-none focus:border-lime/50"
                />
                <button type="submit" className="rounded-2xl bg-cream px-4 font-bold text-ink">
                  <Repeat size={17} />
                </button>
              </div>
              {swaps[menu.key] && (
                <button
                  type="button"
                  onClick={() => {
                    patchDoc(path, { swaps: { [menu.key]: undefined } });
                    setMenu(null);
                  }}
                  className="mt-2 text-sm font-semibold text-mute hover:text-cream"
                >
                  Вернуть «{menu.name}»
                </button>
              )}
            </form>
            {menu.kind === "extra" ? (
              <button
                onClick={() => {
                  patchDoc(path, {
                    extra: { [menu.key.slice(2)]: undefined },
                    checked: { [menu.key]: undefined },
                  });
                  sound.remove();
                  setMenu(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-semibold text-mute hover:text-danger"
              >
                <Trash2 size={16} /> Удалить
              </button>
            ) : (
              <button
                onClick={() => {
                  patchDoc(path, { hidden: { [menu.key]: true } });
                  sound.deselect();
                  setMenu(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-semibold text-mute hover:text-cream"
              >
                <EyeOff size={16} /> Уже есть дома — убрать на этой неделе
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
