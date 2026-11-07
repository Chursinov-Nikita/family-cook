import { PRODUCTS } from "../ingredients";
import type { Recipe } from "./model";
import { SOUPS } from "./soups";
import { MAINS } from "./mains";
import { BREAKFASTS } from "./breakfasts";
import { SNACKS } from "./snacks";

export { KINDS, type Base, type Kind, type Recipe } from "./model";
export { inSeason, seasonLabel } from "./season";

export const RECIPES: Recipe[] = [...SOUPS, ...MAINS, ...BREAKFASTS, ...SNACKS];

export const RECIPE_MAP: Record<string, Recipe> = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe]),
);

export const recipe = (id: string | undefined) => (id ? RECIPE_MAP[id] : undefined);

export const keyIngredients = (r: Recipe, count = 3) =>
  r.items
    .map(([id]) => PRODUCTS[id])
    .filter((p) => p && !p.staple)
    .slice(0, count)
    .map((p, i) => (i ? p.name.toLowerCase() : p.name))
    .join(", ");
