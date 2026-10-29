import { Suspense } from "react";
import WeekView from "./_week/WeekView";

export default function Home() {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <WeekView />
    </Suspense>
  );
}
