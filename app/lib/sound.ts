const KEY = "menu:sound";

let context: AudioContext | null = null;

export const isSoundOn = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};

const listeners = new Set<() => void>();

export const subscribeSound = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setSoundOn = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
};

const audio = () => {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
};

type Note = {
  freq: number;
  at?: number;
  length?: number;
  volume?: number;
  type?: OscillatorType;
  slide?: number;
};

const play = (notes: Note[], vibrate?: number | number[]) => {
  if (!isSoundOn()) return;
  try {
    const ctx = audio();
    if (ctx) {
      const now = ctx.currentTime;
      notes.forEach(({ freq, at = 0, length = 0.18, volume = 0.07, type = "sine", slide }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + at;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (slide) osc.frequency.exponentialRampToValueAtTime(slide, start + length);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + length + 0.02);
      });
    }
    if (vibrate && "vibrate" in navigator) navigator.vibrate(vibrate);
  } catch {}
};

export const sound = {
  select: () => play([{ freq: 660, length: 0.09, slide: 880 }], 8),
  deselect: () => play([{ freq: 520, length: 0.09, slide: 390, volume: 0.05 }], 5),
  tap: () => play([{ freq: 740, length: 0.05, volume: 0.04 }]),
  create: () =>
    play([
      { freq: 523, length: 0.12 },
      { freq: 784, at: 0.08, length: 0.16 },
    ], 12),
  remove: () => play([{ freq: 330, length: 0.16, slide: 220, volume: 0.06, type: "triangle" }], 15),
  success: () =>
    play(
      [
        { freq: 523, length: 0.22 },
        { freq: 659, at: 0.09, length: 0.22 },
        { freq: 784, at: 0.18, length: 0.3 },
        { freq: 1047, at: 0.27, length: 0.45, volume: 0.05 },
      ],
      [12, 60, 18],
    ),
  celebrate: () =>
    play(
      [
        { freq: 523, length: 0.18, volume: 0.06 },
        { freq: 659, at: 0.12, length: 0.18, volume: 0.06 },
        { freq: 784, at: 0.24, length: 0.18, volume: 0.06 },
        { freq: 1047, at: 0.36, length: 0.7, volume: 0.06 },
        { freq: 784, at: 0.36, length: 0.7, volume: 0.035 },
        { freq: 1568, at: 0.55, length: 0.12, volume: 0.02, type: "triangle" },
        { freq: 2093, at: 0.68, length: 0.12, volume: 0.02, type: "triangle" },
        { freq: 2637, at: 0.8, length: 0.2, volume: 0.015, type: "triangle" },
      ],
      [30, 40, 30, 40, 90],
    ),
  finish: () =>
    play(
      [
        { freq: 528, length: 1.6, volume: 0.06 },
        { freq: 792, at: 0.35, length: 1.6, volume: 0.045 },
        { freq: 1056, at: 0.7, length: 2, volume: 0.03 },
      ],
      [20, 80, 20],
    ),
};
