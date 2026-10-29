// Одно едва заметное свечение сверху — без зерна и лишних пятен
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-64 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(200_245_96/0.06),transparent)]" />
    </div>
  );
}
