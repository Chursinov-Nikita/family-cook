import { Suspense } from "react";
import FamilyView from "./FamilyView";

export default function FamilyPage() {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <FamilyView />
    </Suspense>
  );
}
