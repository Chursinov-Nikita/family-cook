import type { Dept } from "./ingredients";
import type { Kind } from "./recipes";

export type Slot = "breakfast" | "lunch" | "dinner" | "snack";

export const SLOTS: { id: Slot; name: string; kind: Kind; color: string }[] = [
  { id: "breakfast", name: "Завтрак", kind: "breakfast", color: "var(--color-lime)" },
  { id: "lunch", name: "Обед", kind: "soup", color: "var(--color-mint)" },
  { id: "dinner", name: "Ужин", kind: "main", color: "var(--color-sky)" },
  { id: "snack", name: "Перекус", kind: "snack", color: "var(--color-pink)" },
];

export const slotInfo = (slot: Slot) => SLOTS.find((s) => s.id === slot)!;

// Одна готовка: блюдо, которое варят в день start и едят days дней подряд
export type Cook = {
  id: string;
  slot: Slot;
  recipe: string;
  start: string;
  days: number;
  servings?: number;
  locked?: boolean;
};

export type MonthDoc = {
  cooks?: Record<string, Cook>;
  generatedAt?: string;
};

export type Basic = { id: string; name: string; dept: Dept; note?: string };

export type Extra = { id: string; name: string; note?: string; at: number };

export type WeekDoc = {
  checked?: Record<string, boolean>;
  swaps?: Record<string, string>;
  hidden?: Record<string, boolean>;
  extra?: Record<string, Extra>;
};

export type Space = {
  name: string;
  people: number;
  slots: Record<Slot, boolean>;
  durations: Record<Slot, [number, number]>;
  basics: Record<string, Basic>;
  dislikes: Record<string, boolean>;
  favorites: Record<string, boolean>;
};

const basic = (id: string, name: string, dept: Dept, note?: string): [string, Basic] => [
  id,
  { id, name, dept, note },
];

export const DEFAULT_SPACE: Space = {
  name: "Наша семья",
  people: 3,
  slots: { breakfast: true, lunch: true, dinner: true, snack: true },
  durations: {
    breakfast: [1, 1],
    lunch: [2, 3],
    dinner: [1, 2],
    snack: [1, 2],
  },
  basics: Object.fromEntries([
    basic("b-milk", "Молоко", "dairy", "2 л"),
    basic("b-eggs", "Яйца", "dairy", "2 десятка"),
    basic("b-bread", "Хлеб", "bakery", "2 буханки"),
    basic("b-kefir", "Кефир", "dairy", "1 л"),
    basic("b-cheese", "Сыр к завтраку", "dairy"),
    basic("b-butter", "Масло сливочное", "dairy"),
    basic("b-fruit", "Фрукты", "fruit", "яблоки, бананы"),
    basic("b-tea", "Чай / кофе", "grocery"),
  ]),
  dislikes: {},
  favorites: {},
};

export const withDefaults = (space: Partial<Space> | undefined): Space => ({
  ...DEFAULT_SPACE,
  ...space,
  slots: { ...DEFAULT_SPACE.slots, ...space?.slots },
  durations: { ...DEFAULT_SPACE.durations, ...space?.durations },
  basics: space?.basics ?? DEFAULT_SPACE.basics,
  dislikes: space?.dislikes ?? {},
  favorites: space?.favorites ?? {},
});
