import type { Recipe } from "./model";

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

export const inSeason = (r: Recipe, day: string) => !r.months || r.months.includes(Number(day.slice(5, 7)));

export const seasonLabel = (r: Recipe) =>
  r.months?.length ? `${MONTHS[Math.min(...r.months) - 1]}–${MONTHS[Math.max(...r.months) - 1]}` : null;
