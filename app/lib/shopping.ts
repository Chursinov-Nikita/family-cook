import { DEPTS, product, type Dept, type Unit } from "./ingredients";
import { recipe as findRecipe } from "./recipes";
import type { Cook, Space } from "./types";

export type ShopItem = {
  key: string;
  id: string;
  name: string;
  dept: Dept;
  amount: number;
  unit: Unit;
  uses: string[];
};

export const portions = (cook: Cook, space: Space) =>
  (cook.servings ?? space.people) * cook.days;

// Продукты для блюд, которые готовим на этой неделе (по дню начала готовки)
export const buildShopList = (cooks: Cook[], days: string[], space: Space) => {
  const items = new Map<string, ShopItem>();
  cooks
    .filter((c) => days.includes(c.start))
    .sort((a, b) => a.start.localeCompare(b.start))
    .forEach((cook) => {
      const r = findRecipe(cook.recipe);
      if (!r) return;
      const factor = portions(cook, space) / r.serves;
      r.items.forEach(([id, amount]) => {
        const p = product(id);
        const key = `i:${id}`;
        const item =
          items.get(key) ??
          { key, id, name: p.name, dept: p.dept, amount: 0, unit: p.unit, uses: [] };
        item.amount += amount * factor;
        if (!item.uses.includes(r.title)) item.uses.push(r.title);
        items.set(key, item);
      });
    });

  return DEPTS.map((dept) => ({
    dept,
    items: [...items.values()]
      .filter((item) => item.dept === dept.id)
      .sort((a, b) => a.name.localeCompare(b.name, "ru")),
  })).filter((group) => group.items.length);
};
