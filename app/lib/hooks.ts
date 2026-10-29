"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getCode,
  getServerCode,
  getServerStatus,
  getStatus,
  subscribeCode,
  subscribeDoc,
  subscribeStatus,
} from "./store";
import { addMonths, monthOf, today as todayIso } from "./dates";
import { withDefaults, type Cook, type MonthDoc, type Space, type WeekDoc } from "./types";

export const useCode = () => useSyncExternalStore(subscribeCode, getCode, getServerCode);

export const useSyncStatus = () =>
  useSyncExternalStore(subscribeStatus, getStatus, getServerStatus);

const noop = () => () => {};

// true только в браузере — чтобы статическая страница не мигала чужими датами
export const useMounted = () =>
  useSyncExternalStore(noop, () => true, () => false);

export const useToday = () => {
  const mounted = useMounted();
  return mounted ? todayIso() : null;
};

export function useDoc<T>(path: string | null) {
  const code = useCode();
  const [state, setState] = useState<{ key: string; data: T | undefined } | null>(null);
  const key = `${code}/${path}`;

  useEffect(() => {
    if (!code || path === null) return;
    return subscribeDoc<T>(path, (data) => setState({ key, data }));
  }, [code, path, key]);

  const ready = state?.key === key;
  return { data: ready ? state.data : undefined, ready };
}

export const useSpace = (): { space: Space; ready: boolean } => {
  const { data, ready } = useDoc<Partial<Space>>("");
  return { space: withDefaults(data), ready };
};

export const useMonth = (month: string | null) => {
  const { data, ready } = useDoc<MonthDoc>(month ? `months/${month}` : null);
  return { cooks: data?.cooks ?? {}, generatedAt: data?.generatedAt, ready };
};

export const useWeek = (start: string | null) => {
  const { data, ready } = useDoc<WeekDoc>(start ? `weeks/${start}` : null);
  return { week: data ?? {}, ready };
};

// Готовки за период, который может зацепить два месяца (неделя на стыке)
export const useCooksAround = (days: string[]) => {
  const first = days.length ? monthOf(days[0]) : null;
  const last = days.length ? monthOf(days[days.length - 1]) : null;
  const a = useMonth(first);
  const b = useMonth(last && last !== first ? last : null);
  const cooks: Cook[] = [...Object.values(a.cooks), ...(last !== first ? Object.values(b.cooks) : [])];
  return { cooks, ready: a.ready && (last === first || b.ready) };
};

export const usePrevMonth = (month: string) => useMonth(addMonths(month, -1));
