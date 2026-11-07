import { Suspense } from "react";
import MonthView from "./MonthView";

export default function MonthPage() {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <MonthView />
    </Suspense>
  );
}
