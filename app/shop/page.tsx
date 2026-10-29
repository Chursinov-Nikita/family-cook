import { Suspense } from "react";
import ShopView from "./ShopView";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <ShopView />
    </Suspense>
  );
}
