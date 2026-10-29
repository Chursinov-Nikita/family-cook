import { RECIPES, recipe as findRecipe, type Recipe } from "./recipes";
import { addDays, diffDays, monthDays } from "./dates";
import { SLOTS, slotInfo, type Cook, type Slot, type Space } from "./types";
import { patchDoc, replaceDoc, uid } from "./store";

const allowed = (r: Recipe, space: Space) => !r.items.some(([id]) => space.dislikes[id]);

export const candidates = (slot: Slot, space: Space) => {
  const kind = slotInfo(slot).kind;
  const all = RECIPES.filter((r) => r.kind === kind);
  const ok = all.filter((r) => allowed(r, space));
  return ok.length ? ok : all;
};

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

type Context = {
  used: Map<string, string>; // рецепт → последний день в этом месяце
  recent: Set<string>; // было в прошлом месяце
  prevBase?: string;
  day: string;
};

const score = (r: Recipe, slot: Slot, space: Space, ctx: Context) => {
  let s = Math.random();
  if (space.favorites[r.id]) s += 0.7;
  const last = ctx.used.get(r.id);
  if (last) {
    const kind = slotInfo(slot).kind;
    const gap = diffDays(last, ctx.day);
    // супы и вторые в месяце не повторяем, завтраки и перекусы — не чаще раза в неделю
    s -= kind === "soup" || kind === "main" ? 6 : gap < 7 ? 6 : 1;
  }
  if (ctx.recent.has(r.id)) s -= 1.2;
  if (ctx.prevBase && r.base === ctx.prevBase) s -= 1.5;
  return s;
};

const pick = (slot: Slot, space: Space, ctx: Context, exclude?: string) => {
  const list = candidates(slot, space).filter((r) => r.id !== exclude);
  let best = list[0];
  let bestScore = -Infinity;
  list.forEach((r) => {
    const s = score(r, slot, space, ctx);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  });
  return best;
};

export const normalizeCook = (cook: Cook): Cook => ({
  id: cook.id,
  slot: cook.slot,
  recipe: cook.recipe,
  start: cook.start,
  days: cook.days,
  servings: cook.servings ?? undefined,
  locked: cook.locked ?? false,
});

const toDoc = (cooks: Cook[]) =>
  Object.fromEntries(
    cooks.map((c) => {
      const n = normalizeCook(c);
      return [c.id, { ...n, servings: n.servings ?? null }];
    }),
  );

// Собирает меню на месяц. Закреплённые блюда остаются на своих местах.
export const generateMonth = (
  month: string,
  space: Space,
  current: Cook[],
  previous: Cook[],
) => {
  const days = monthDays(month);
  const result: Cook[] = [];

  SLOTS.forEach(({ id: slot }) => {
    if (!space.slots[slot]) return;
    const locked = current
      .filter((c) => c.slot === slot && c.locked)
      .sort((a, b) => a.start.localeCompare(b.start));
    const ctx: Context = {
      used: new Map(locked.map((c) => [c.recipe, c.start])),
      recent: new Set(previous.filter((c) => c.slot === slot).map((c) => c.recipe)),
      day: days[0],
    };
    const [min, max] = space.durations[slot];
    let i = 0;
    while (i < days.length) {
      const day = days[i];
      const lockedHere = locked.find((c) => c.start <= day && addDays(c.start, c.days - 1) >= day);
      if (lockedHere) {
        result.push(lockedHere);
        ctx.prevBase = findRecipe(lockedHere.recipe)?.base;
        i = days.indexOf(addDays(lockedHere.start, lockedHere.days));
        if (i < 0) break;
        continue;
      }
      const nextLocked = locked.find((c) => c.start > day);
      const room = (nextLocked ? diffDays(day, nextLocked.start) : days.length - i);
      const length = Math.max(1, Math.min(randomInt(min, max), room));
      ctx.day = day;
      const chosen = pick(slot, space, ctx);
      ctx.used.set(chosen.id, day);
      ctx.prevBase = chosen.base;
      result.push({ id: uid(), slot, recipe: chosen.id, start: day, days: length });
      i += length;
    }
  });

  replaceDoc(`months/${month}`, { cooks: toDoc(result), generatedAt: new Date().toISOString() });
};

// Подбирает другое блюдо на место готовки
export const suggestFor = (cook: Cook, monthCooks: Cook[], space: Space) => {
  const ctx: Context = {
    used: new Map(monthCooks.filter((c) => c.id !== cook.id).map((c) => [c.recipe, c.start])),
    recent: new Set(),
    day: cook.start,
    prevBase: findRecipe(
      monthCooks.find((c) => c.slot === cook.slot && addDays(c.start, c.days) === cook.start)?.recipe,
    )?.base,
  };
  return pick(cook.slot, space, ctx, cook.recipe);
};

const writeCook = (month: string, cook: Cook) =>
  patchDoc(`months/${month}`, { cooks: toDoc([cook]) });

const removeCook = (month: string, id: string) =>
  patchDoc(`months/${month}`, { cooks: { [id]: undefined } });

export const setRecipe = (month: string, cook: Cook, recipeId: string) =>
  writeCook(month, { ...cook, recipe: recipeId });

export const toggleLock = (month: string, cook: Cook) =>
  writeCook(month, { ...cook, locked: !cook.locked });

export const setServings = (month: string, cook: Cook, servings: number | undefined) =>
  writeCook(month, { ...cook, servings });

export const deleteCook = (month: string, cook: Cook) => removeCook(month, cook.id);

// Все блюда месяца снова считаются на число людей из настроек семьи
export const resetServings = (month: string, monthCooks: Cook[]) => {
  const custom = monthCooks.filter((c) => c.servings);
  if (!custom.length) return;
  patchDoc(`months/${month}`, { cooks: toDoc(custom.map((c) => ({ ...c, servings: undefined }))) });
};

// Добавить блюдо в пустой слот: занимает дни до следующей готовки
export const addCook = (
  month: string,
  slot: Slot,
  day: string,
  recipeId: string,
  monthCooks: Cook[],
  space: Space,
) => {
  const next = monthCooks
    .filter((c) => c.slot === slot && c.start > day)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const lastDay = monthDays(month).at(-1)!;
  const room = (next ? diffDays(day, next.start) : diffDays(day, lastDay) + 1);
  const wanted = space.durations[slot][0];
  writeCook(month, {
    id: uid(),
    slot,
    recipe: recipeId,
    start: day,
    days: Math.max(1, Math.min(wanted, room)),
  });
};

// Изменить, на сколько дней готовим: соседнее блюдо сдвигается или исчезает
export const setDays = (month: string, cook: Cook, days: number, monthCooks: Cook[]) => {
  const lastDay = monthDays(month).at(-1)!;
  const maxDays = diffDays(cook.start, lastDay) + 1;
  const length = Math.max(1, Math.min(days, maxDays));
  const end = addDays(cook.start, length - 1);
  const changes: Record<string, unknown> = {};
  monthCooks
    .filter((c) => c.slot === cook.slot && c.id !== cook.id && c.start > cook.start)
    .forEach((c) => {
      if (c.start > end) return;
      const cEnd = addDays(c.start, c.days - 1);
      if (cEnd <= end) changes[c.id] = undefined;
      else {
        const start = addDays(end, 1);
        changes[c.id] = toDoc([{ ...c, start, days: diffDays(start, cEnd) + 1 }])[c.id];
      }
    });
  changes[cook.id] = toDoc([{ ...cook, days: length }])[cook.id];
  patchDoc(`months/${month}`, { cooks: changes });
};

// Какая готовка покрывает день в слоте и какой это по счёту день
export const coverage = (cooks: Cook[]) => {
  const map = new Map<string, { cook: Cook; index: number }>();
  cooks.forEach((cook) => {
    for (let i = 0; i < cook.days; i++) {
      map.set(`${addDays(cook.start, i)}|${cook.slot}`, { cook, index: i });
    }
  });
  return map;
};
