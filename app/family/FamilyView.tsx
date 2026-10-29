"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, Link2, Plus, RefreshCw, Search, Share2, Volume2, VolumeX, X } from "lucide-react";
import Sheet from "@/app/elements/Sheet";
import { PeopleStepper } from "@/app/elements/People";
import { useCode, useMounted, useSpace, useSyncStatus } from "@/app/lib/hooks";
import { LOCAL_CODE, newCode, normalizeCode, patchDoc, setCode, uid } from "@/app/lib/store";
import { cloudEnabled } from "@/app/lib/firebase";
import { PRODUCTS } from "@/app/lib/ingredients";
import { SLOTS, type Slot } from "@/app/lib/types";
import { asset } from "@/app/lib/asset";
import { plural } from "@/app/lib/dates";
import { isSoundOn, setSoundOn, sound, subscribeSound } from "@/app/lib/sound";

const PRESETS: [number, number][] = [
  [1, 1],
  [1, 2],
  [2, 2],
  [2, 3],
  [3, 3],
];

const presetLabel = ([a, b]: [number, number]) =>
  a === b ? `${a} ${plural(a, "день", "дня", "дней")}` : `${a}–${b} дня`;

const STATUS = {
  local: "Данные только на этом устройстве",
  offline: "Нет сети — изменения отправятся, когда она появится",
  syncing: "Синхронизация…",
  synced: "Всё синхронизировано",
};

export default function FamilyView() {
  const params = useSearchParams();
  const router = useRouter();
  const mounted = useMounted();
  const code = useCode();
  const status = useSyncStatus();
  const { space } = useSpace();
  const soundOn = useSyncExternalStore(subscribeSound, isSoundOn, () => true);
  const [joinInput, setJoinInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [dislikeQuery, setDislikeQuery] = useState("");
  const [basicName, setBasicName] = useState("");
  const [basicNote, setBasicNote] = useState("");

  const invite = normalizeCode(params.get("join") ?? "");
  const pendingInvite = mounted && invite && invite !== code ? invite : null;
  const joinCode = normalizeCode(joinInput);
  const link = mounted ? `${location.origin}${asset("/family/")}?join=${code}` : "";

  const join = (next: string) => {
    setCode(next);
    setJoinInput("");
    sound.success();
    router.replace("/family/");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const shareLink = async () => {
    const text = `Наше меню на месяц в «Что готовим». Код: ${code}`;
    try {
      if (navigator.share) await navigator.share({ title: "Что готовим", text, url: link });
      else await copy(link);
    } catch {}
  };

  const setDuration = (slot: Slot, value: [number, number]) => {
    patchDoc("", { durations: { [slot]: value } });
    sound.tap();
  };

  const q = dislikeQuery.trim().toLowerCase();
  const dislikeOptions = q
    ? Object.entries(PRODUCTS)
        .filter(([id, p]) => !p.staple && !space.dislikes[id] && p.name.toLowerCase().includes(q))
        .slice(0, 8)
    : [];

  const addBasic = () => {
    const name = basicName.trim();
    if (!name) return;
    const id = `b-${uid()}`;
    // пишем весь список: пока семья его не меняла, он берётся из значений по умолчанию
    patchDoc("", {
      basics: {
        ...space.basics,
        [id]: { id, name: name.slice(0, 40), dept: "grocery", note: basicNote.trim().slice(0, 40) },
      },
    });
    setBasicName("");
    setBasicNote("");
    sound.create();
  };

  const removeBasic = (id: string) => {
    patchDoc("", { basics: { ...space.basics, [id]: undefined } });
    sound.remove();
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade space-y-4">
      <section className="mb-2">
        <p className="eyebrow mb-3">Семья и настройки</p>
        <h1 className="font-display text-3xl sm:text-4xl">
          Одно меню <em className="text-lime">на всех</em>
        </h1>
      </section>

      <section className="card flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-display text-xl">На сколько человек готовим</h2>
          <p className="max-w-sm text-sm text-mute">
            Значение по умолчанию для всех блюд: на него считаются порции и продукты в списке покупок. У отдельного блюда
            можно поставить своё число.
          </p>
        </div>
        <PeopleStepper size="lg" />
      </section>

      {pendingInvite && (
        <div className="card animate-rise rounded-3xl border-lime/40 p-5">
          <p className="font-display text-xl">Подключиться к семейному меню?</p>
          <p className="mt-1 text-sm text-mute">
            Код <b className="font-mono text-cream">{pendingInvite}</b>. Меню и покупки этого устройства заменятся общими.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => join(pendingInvite)}
              className="rounded-full bg-lime px-5 py-2.5 font-bold text-ink"
            >
              Подключиться
            </button>
            <button onClick={() => router.replace("/family/")} className="rounded-full px-4 py-2.5 text-mute">
              Не сейчас
            </button>
          </div>
        </div>
      )}

      <section className="card relative overflow-hidden rounded-3xl p-5 sm:p-6">
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-mute">
            <span
              className={`size-2 rounded-full ${
                !mounted ? "bg-dim" : status === "synced" ? "bg-lime" : status === "local" ? "bg-dim" : "bg-lime animate-pulse"
              }`}
            />
            {mounted ? STATUS[status] : "…"}
          </div>

          {!cloudEnabled ? (
            <div className="mt-4 space-y-2 text-sm text-mute">
              <p className="font-display text-xl text-cream">Синхронизация не подключена</p>
              <p>
                Чтобы меню и покупки были общими на всех телефонах, подключи бесплатный Firebase — инструкция в README
                проекта. Пока всё хранится на этом устройстве.
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow mt-5">Код семьи</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.12em] text-lime sm:text-3xl">
                {mounted && code !== LOCAL_CODE ? code : "····-····-····"}
              </p>
              <p className="mt-2 max-w-md text-sm text-mute">
                Открой ссылку на другом телефоне или введи там этот код — у всех будет одно меню и один список покупок.
                Работает по Wi-Fi и мобильному интернету, без регистрации.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={shareLink}
                  className="flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-bold text-ink"
                >
                  <Share2 size={16} /> Пригласить
                </button>
                <button
                  onClick={() => code && copy(code)}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 font-semibold text-mute transition hover:text-cream"
                >
                  {copied ? <Check size={16} className="text-lime" /> : <Copy size={16} />} Код
                </button>
                <button
                  onClick={() => copy(link)}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 font-semibold text-mute transition hover:text-cream"
                >
                  <Link2 size={16} /> Ссылка
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinCode) join(joinCode);
                }}
                className="mt-6 border-t border-line pt-5"
              >
                <label className="eyebrow mb-2 block">Уже есть код от семьи?</label>
                <div className="flex gap-2">
                  <input
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-2xl border border-line bg-white/3 px-4 py-3 font-mono tracking-wider uppercase outline-none placeholder:text-dim focus:border-lime/50"
                  />
                  <button
                    type="submit"
                    disabled={!joinCode || joinCode === code}
                    className="rounded-2xl bg-cream px-5 font-bold text-ink disabled:opacity-30"
                  >
                    Войти
                  </button>
                </div>
              </form>
              <button
                onClick={() => setResetOpen(true)}
                className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-dim transition hover:text-mute"
              >
                <RefreshCw size={13} /> Начать отдельное меню с новым кодом
              </button>
            </>
          )}
        </div>
      </section>

      
      <section className="card rounded-3xl p-5 sm:p-6">
        <h2 className="font-display text-xl">Приёмы пищи</h2>
        <p className="mb-4 text-sm text-mute">Какие есть и на сколько дней обычно хватает одной готовки</p>
        <div className="space-y-4">
          {SLOTS.map((s) => {
            const on = space.slots[s.id];
            const [min, max] = space.durations[s.id];
            return (
              <div key={s.id} className="rounded-2xl bg-white/2 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                    <span className="text-sm font-normal text-dim">
                      {s.kind === "soup" ? "· суп" : s.kind === "main" ? "· второе" : ""}
                    </span>
                  </span>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={s.name}
                    onClick={() => patchDoc("", { slots: { [s.id]: !on } })}
                    className={`relative h-7 w-12 rounded-full transition ${on ? "bg-lime" : "bg-white/10"}`}
                  >
                    <span
                      className={`absolute top-1 size-5 rounded-full bg-ink transition-all ${on ? "left-6" : "left-1"}`}
                    />
                  </button>
                </div>
                {on && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                      <button
                        key={p.join()}
                        onClick={() => setDuration(s.id, p)}
                        className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                          p[0] === min && p[1] === max ? "bg-cream text-ink" : "bg-white/5 text-mute hover:text-cream"
                        }`}
                      >
                        {presetLabel(p)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-dim">Новые настройки применятся, когда меню соберётся заново.</p>
      </section>

      <section className="card rounded-3xl p-5 sm:p-6">
        <h2 className="font-display text-xl">Не едим</h2>
        <p className="mb-4 text-sm text-mute">Блюда с этими продуктами не попадут в меню</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Object.keys(space.dislikes).map((id) => (
            <button
              key={id}
              onClick={() => patchDoc("", { dislikes: { [id]: undefined } })}
              className="flex items-center gap-1 rounded-full bg-danger/12 py-1.5 pr-2 pl-3 text-sm text-danger"
            >
              {PRODUCTS[id]?.name ?? id} <X size={14} />
            </button>
          ))}
          {!Object.keys(space.dislikes).length && <span className="text-sm text-dim">Едим всё</span>}
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-line bg-white/3 px-3.5 py-2.5 focus-within:border-lime/50">
          <Search size={16} className="text-dim" />
          <input
            value={dislikeQuery}
            onChange={(e) => setDislikeQuery(e.target.value)}
            placeholder="Печень, рыба, грибы…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
          />
        </label>
        {dislikeOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dislikeOptions.map(([id, p]) => (
              <button
                key={id}
                onClick={() => {
                  patchDoc("", { dislikes: { [id]: true } });
                  setDislikeQuery("");
                  sound.tap();
                }}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-mute hover:text-cream"
              >
                + {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card rounded-3xl p-5 sm:p-6">
        <h2 className="font-display text-xl">Обязательные покупки</h2>
        <p className="mb-3 text-sm text-mute">Попадают в список каждую неделю, независимо от меню</p>
        <ul className="divide-y divide-white/5">
          {Object.values(space.basics)
            .sort((a, b) => a.name.localeCompare(b.name, "ru"))
            .map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <span className="flex-1">
                  {b.name}
                  {b.note && <span className="text-sm text-dim"> · {b.note}</span>}
                </span>
                <button
                  aria-label={`Убрать ${b.name}`}
                  onClick={() => removeBasic(b.id)}
                  className="grid size-8 place-items-center rounded-full text-dim transition hover:bg-white/5 hover:text-danger"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addBasic();
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={basicName}
            onChange={(e) => setBasicName(e.target.value)}
            placeholder="Продукт"
            className="min-w-0 flex-[2] rounded-2xl border border-line bg-white/3 px-4 py-2.5 text-sm outline-none placeholder:text-dim focus:border-lime/50"
          />
          <input
            value={basicNote}
            onChange={(e) => setBasicNote(e.target.value)}
            placeholder="Сколько"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-white/3 px-4 py-2.5 text-sm outline-none placeholder:text-dim focus:border-lime/50"
          />
          <button
            type="submit"
            aria-label="Добавить"
            disabled={!basicName.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-ink disabled:opacity-30"
          >
            <Plus size={18} />
          </button>
        </form>
      </section>

      <section className="card flex items-center justify-between rounded-3xl p-5 sm:p-6">
        <div>
          <h2 className="font-display text-xl">Звуки и вибрация</h2>
          <p className="text-sm text-mute">Отклик на отметки в списке покупок</p>
        </div>
        <button
          onClick={() => setSoundOn(!soundOn)}
          aria-pressed={soundOn}
          className={`grid size-11 place-items-center rounded-2xl transition ${soundOn ? "bg-lime/15 text-lime" : "bg-white/5 text-dim"}`}
        >
          {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
      </section>

      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} title="Новое меню с нуля?">
        <p className="text-mute">
          Это устройство отключится от текущей семьи и начнёт пустое меню с новым кодом. Старое меню останется у остальных — к
          нему можно вернуться по коду <b className="font-mono text-cream">{code}</b>.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => setResetOpen(false)} className="rounded-2xl bg-white/6 py-3 font-semibold">
            Отмена
          </button>
          <button
            onClick={() => {
              setCode(newCode());
              setResetOpen(false);
            }}
            className="rounded-2xl bg-danger py-3 font-bold text-ink"
          >
            Начать
          </button>
        </div>
      </Sheet>
    </div>
  );
}
