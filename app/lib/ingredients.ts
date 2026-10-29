export type Dept =
  | "veg"
  | "fruit"
  | "meat"
  | "fish"
  | "dairy"
  | "grocery"
  | "canned"
  | "bakery"
  | "frozen"
  | "pantry";

export type Unit = "г" | "мл" | "шт" | "зуб." | "пучок";

export type Product = {
  name: string;
  dept: Dept;
  unit: Unit;
  // есть почти всегда дома: соль, масло, мука — показываем отдельно
  staple?: boolean;
};

export const DEPTS: { id: Dept; name: string; icon: string }[] = [
  { id: "veg", name: "Овощи и зелень", icon: "Carrot" },
  { id: "fruit", name: "Фрукты и ягоды", icon: "Apple" },
  { id: "meat", name: "Мясо и птица", icon: "Beef" },
  { id: "fish", name: "Рыба", icon: "Fish" },
  { id: "dairy", name: "Молочное и яйца", icon: "Milk" },
  { id: "grocery", name: "Крупы и макароны", icon: "Wheat" },
  { id: "canned", name: "Консервы и соусы", icon: "Soup" },
  { id: "bakery", name: "Хлеб", icon: "Croissant" },
  { id: "frozen", name: "Заморозка", icon: "Snowflake" },
  { id: "pantry", name: "Проверить дома", icon: "Package" },
];

export const PRODUCTS: Record<string, Product> = {
  potato: { name: "Картофель", dept: "veg", unit: "г" },
  carrot: { name: "Морковь", dept: "veg", unit: "г" },
  onion: { name: "Лук репчатый", dept: "veg", unit: "г" },
  garlic: { name: "Чеснок", dept: "veg", unit: "зуб." },
  cabbage: { name: "Капуста белокочанная", dept: "veg", unit: "г" },
  beet: { name: "Свёкла", dept: "veg", unit: "г" },
  tomato: { name: "Помидоры", dept: "veg", unit: "г" },
  cucumber: { name: "Огурцы", dept: "veg", unit: "г" },
  pepper: { name: "Перец болгарский", dept: "veg", unit: "г" },
  zucchini: { name: "Кабачки", dept: "veg", unit: "г" },
  pumpkin: { name: "Тыква", dept: "veg", unit: "г" },
  mushrooms: { name: "Шампиньоны", dept: "veg", unit: "г" },
  greens: { name: "Зелень (укроп, петрушка)", dept: "veg", unit: "пучок" },
  green_onion: { name: "Зелёный лук", dept: "veg", unit: "пучок" },
  pickles: { name: "Огурцы солёные", dept: "veg", unit: "г" },
  sauerkraut: { name: "Капуста квашеная", dept: "veg", unit: "г" },

  apple: { name: "Яблоки", dept: "fruit", unit: "г" },
  banana: { name: "Бананы", dept: "fruit", unit: "шт" },
  lemon: { name: "Лимон", dept: "fruit", unit: "шт" },

  beef: { name: "Говядина", dept: "meat", unit: "г" },
  pork: { name: "Свинина", dept: "meat", unit: "г" },
  chicken_breast: { name: "Куриное филе", dept: "meat", unit: "г" },
  chicken_thigh: { name: "Куриные бёдра", dept: "meat", unit: "г" },
  chicken_soup: { name: "Курица для бульона", dept: "meat", unit: "г" },
  mince: { name: "Фарш домашний", dept: "meat", unit: "г" },
  chicken_mince: { name: "Фарш куриный", dept: "meat", unit: "г" },
  turkey: { name: "Филе индейки", dept: "meat", unit: "г" },
  liver: { name: "Печень куриная", dept: "meat", unit: "г" },
  smoked: { name: "Копчёные рёбрышки", dept: "meat", unit: "г" },
  sausages: { name: "Колбаски / сосиски", dept: "meat", unit: "г" },
  ham: { name: "Ветчина", dept: "meat", unit: "г" },

  fish_white: { name: "Филе минтая или трески", dept: "fish", unit: "г" },
  salmon: { name: "Горбуша", dept: "fish", unit: "г" },

  milk: { name: "Молоко", dept: "dairy", unit: "мл" },
  kefir: { name: "Кефир", dept: "dairy", unit: "мл" },
  cream: { name: "Сливки 20%", dept: "dairy", unit: "мл" },
  sour_cream: { name: "Сметана", dept: "dairy", unit: "г" },
  cottage: { name: "Творог", dept: "dairy", unit: "г" },
  cheese: { name: "Сыр твёрдый", dept: "dairy", unit: "г" },
  cheese_processed: { name: "Сыр плавленый", dept: "dairy", unit: "г" },
  butter: { name: "Масло сливочное", dept: "dairy", unit: "г" },
  eggs: { name: "Яйца", dept: "dairy", unit: "шт" },

  rice: { name: "Рис", dept: "grocery", unit: "г" },
  buckwheat: { name: "Гречка", dept: "grocery", unit: "г" },
  oats: { name: "Овсяные хлопья", dept: "grocery", unit: "г" },
  semolina: { name: "Манка", dept: "grocery", unit: "г" },
  millet: { name: "Пшено", dept: "grocery", unit: "г" },
  barley: { name: "Перловка", dept: "grocery", unit: "г" },
  pasta: { name: "Макароны", dept: "grocery", unit: "г" },
  noodles: { name: "Лапша яичная", dept: "grocery", unit: "г" },
  lentils: { name: "Чечевица красная", dept: "grocery", unit: "г" },
  peas: { name: "Горох колотый", dept: "grocery", unit: "г" },
  raisins: { name: "Изюм", dept: "grocery", unit: "г" },
  honey: { name: "Мёд", dept: "grocery", unit: "г" },

  tomato_paste: { name: "Томатная паста", dept: "canned", unit: "г" },
  tomato_canned: { name: "Томаты в собственном соку", dept: "canned", unit: "г" },
  beans_canned: { name: "Фасоль консервированная", dept: "canned", unit: "г" },
  peas_green: { name: "Горошек зелёный", dept: "canned", unit: "г" },
  olives: { name: "Маслины", dept: "canned", unit: "г" },

  bread: { name: "Хлеб", dept: "bakery", unit: "г" },

  berries: { name: "Ягоды замороженные", dept: "frozen", unit: "г" },
  broccoli: { name: "Брокколи замороженная", dept: "frozen", unit: "г" },

  salt: { name: "Соль", dept: "pantry", unit: "г", staple: true },
  black_pepper: { name: "Перец чёрный молотый", dept: "pantry", unit: "г", staple: true },
  bay: { name: "Лавровый лист", dept: "pantry", unit: "шт", staple: true },
  oil: { name: "Масло растительное", dept: "pantry", unit: "мл", staple: true },
  sugar: { name: "Сахар", dept: "pantry", unit: "г", staple: true },
  flour: { name: "Мука", dept: "pantry", unit: "г", staple: true },
  paprika: { name: "Паприка", dept: "pantry", unit: "г", staple: true },
  cumin: { name: "Зира", dept: "pantry", unit: "г", staple: true },
  khmeli: { name: "Хмели-сунели", dept: "pantry", unit: "г", staple: true },
  cinnamon: { name: "Корица", dept: "pantry", unit: "г", staple: true },
  soda: { name: "Сода", dept: "pantry", unit: "г", staple: true },
  baking_powder: { name: "Разрыхлитель", dept: "pantry", unit: "г", staple: true },
  soy_sauce: { name: "Соевый соус", dept: "pantry", unit: "мл", staple: true },
};

export const product = (id: string): Product =>
  PRODUCTS[id] ?? { name: id, dept: "grocery", unit: "г" };

const trim = (n: number) =>
  n.toFixed(1).replace(/\.0$/, "").replace(".", ",");

const nice = (n: number) => {
  if (n <= 0) return 0;
  if (n < 50) return Math.ceil(n / 5) * 5;
  if (n < 300) return Math.ceil(n / 10) * 10;
  return Math.ceil(n / 50) * 50;
};

// Количество для человека: «1,2 кг», «750 мл», «3 шт». 0 — «по вкусу».
export const formatAmount = (amount: number, unit: Unit) => {
  if (!amount) return "по вкусу";
  if (unit === "г" || unit === "мл") {
    const value = nice(amount);
    if (value >= 1000) return `${trim(value / 1000)} ${unit === "г" ? "кг" : "л"}`;
    return `${value} ${unit}`;
  }
  return `${Math.ceil(amount)} ${unit}`;
};
