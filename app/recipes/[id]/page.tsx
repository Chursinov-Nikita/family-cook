import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RECIPES, recipe } from "@/app/lib/recipes";
import RecipeView from "./RecipeView";

export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${recipe(id)?.title ?? "Рецепт"} — Что готовим` };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!recipe(id)) notFound();
  return (
    <Suspense>
      <RecipeView id={id} />
    </Suspense>
  );
}
