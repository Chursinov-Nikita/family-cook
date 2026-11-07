export type Kind = "breakfast" | "soup" | "main" | "snack";

export type Base =
  | "beef"
  | "pork"
  | "chicken"
  | "minced"
  | "fish"
  | "liver"
  | "smoked"
  | "turkey"
  | "veg"
  | "dairy"
  | "eggs"
  | "grain"
  | "sweet";

export type Recipe = {
  id: string;
  title: string;
  kind: Kind;
  time: number;
  serves: number;
  base: Base;
  items: [string, number][];
  steps: string[];
  tip: string;
  months?: number[];
};

export const KINDS: { id: Kind; name: string; plural: string }[] = [
  { id: "breakfast", name: "Завтрак", plural: "Завтраки" },
  { id: "soup", name: "Суп", plural: "Супы" },
  { id: "main", name: "Второе", plural: "Вторые блюда" },
  { id: "snack", name: "Перекус", plural: "Перекусы" },
];

export const recipeOf = (kind: Kind) => (data: Omit<Recipe, "kind" | "serves">): Recipe => ({
  ...data,
  kind,
  serves: 4,
});
