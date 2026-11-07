import { Suspense } from "react";
import RecipesView from "./RecipesView";

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <RecipesView />
    </Suspense>
  );
}
