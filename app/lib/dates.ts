// Все даты — строки YYYY-MM-DD в локальном времени
const pad = (n: number) => String(n).padStart(2, "0");

export const iso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parse = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};

export const today = () => iso(new Date());

export const addDays = (day: string, n: number) => {
  const date = parse(day);
  date.setDate(date.getDate() + n);
  return iso(date);
};

export const diffDays = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000);

export const monthOf = (day: string) => day.slice(0, 7);

export const addMonths = (month: string, n: number) => {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + n, 1, 12);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

export const monthDays = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${month}-${pad(i + 1)}`);
};

// Неделя начинается с понедельника
export const weekStart = (day: string) => {
  const weekday = (parse(day).getDay() + 6) % 7;
  return addDays(day, -weekday);
};

export const weekDays = (start: string) =>
  Array.from({ length: 7 }, (_, i) => addDays(start, i));

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
export const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WEEKDAYS_FULL = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];

export const weekday = (day: string) => WEEKDAYS[(parse(day).getDay() + 6) % 7];
export const weekdayFull = (day: string) => WEEKDAYS_FULL[(parse(day).getDay() + 6) % 7];

export const dayNum = (day: string) => Number(day.slice(8));

export const monthName = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return { name: MONTHS[m - 1], year: y };
};

export const longDate = (day: string) =>
  `${dayNum(day)} ${MONTHS_GEN[Number(day.slice(5, 7)) - 1]}`;

export const shortDate = (day: string) =>
  `${dayNum(day)} ${MONTHS_SHORT[Number(day.slice(5, 7)) - 1]}`;

export const weekRange = (start: string) => {
  const end = addDays(start, 6);
  return start.slice(5, 7) === end.slice(5, 7)
    ? `${dayNum(start)}–${shortDate(end)}`
    : `${shortDate(start)} – ${shortDate(end)}`;
};

export const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};

// «сварено в понедельник», «в среду»
const WEEKDAYS_ACC = ["понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье"];
export const weekdayAcc = (day: string) => WEEKDAYS_ACC[(parse(day).getDay() + 6) % 7];

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
};
