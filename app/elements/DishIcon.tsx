import { createElement } from "react";
import {
  Apple,
  Beef,
  CakeSlice,
  Carrot,
  Cherry,
  CookingPot,
  Croissant,
  Drumstick,
  EggFried,
  Fish,
  Ham,
  Milk,
  Salad,
  Sandwich,
  Cookie,
  Soup,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { Base, Recipe } from "@/app/lib/recipes";

const BY_ID: Record<string, LucideIcon> = {
  syrniki: Croissant,
  bliny: Croissant,
  oladyi: Croissant,
  "cottage-casserole": CakeSlice,
  "lazy-vareniki": CookingPot,
  "hot-sandwiches": Sandwich,
  "chicken-sandwich": Sandwich,
  "carrot-salad": Carrot,
  "zucchini-fritters": Salad,
  "baked-apples": Apple,
  "cottage-berries": Cherry,
  charlotte: CakeSlice,
  "banana-muffins": CakeSlice,
  "oat-cookies": Cookie,
  draniki: Croissant,
};

const BY_BASE: Record<Base, LucideIcon> = {
  beef: Beef,
  pork: Ham,
  smoked: Ham,
  chicken: Drumstick,
  turkey: Drumstick,
  minced: CookingPot,
  fish: Fish,
  liver: Beef,
  veg: Salad,
  dairy: Milk,
  eggs: EggFried,
  grain: Wheat,
  sweet: CakeSlice,
};

export const dishIcon = (r: Recipe): LucideIcon =>
  r.kind === "soup" ? (r.base === "fish" ? Fish : Soup) : (BY_ID[r.id] ?? BY_BASE[r.base]);

type Props = { recipe: Recipe; size?: number; className?: string; style?: React.CSSProperties };

// Маленькая иконка блюда для строк и календаря
export default function DishIcon({ recipe, size = 14, className, style }: Props) {
  return createElement(dishIcon(recipe), { size, strokeWidth: 2, className, style, "aria-hidden": true });
}
