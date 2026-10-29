import { createElement } from "react";
import type { Recipe } from "@/app/lib/recipes";
import { dishIcon } from "./DishIcon";

type Props = {
  recipe: Recipe;
  color: string;
  size?: number;
  dim?: boolean;
};

// Иконка блюда на плитке, подкрашенной цветом приёма пищи
export default function Plate({ recipe, color, size = 44, dim }: Props) {
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        color: dim ? "var(--color-dim)" : color,
        background: `color-mix(in oklab, ${color} ${dim ? 6 : 14}%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} ${dim ? 10 : 24}%, transparent)`,
      }}
    >
      {createElement(dishIcon(recipe), { size: size * 0.46, strokeWidth: 1.9, "aria-hidden": true })}
    </div>
  );
}
