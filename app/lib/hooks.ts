"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getCode,
  getServerCode,
  getServerStatus,
  getStatus,
  subscribeCode,
  subscribeDoc,
  subscribeStatus,
} from "./store";
import { monthOf, today as todayIso } from "./dates";
import { withDefaults, type Cook, type MonthDoc, type Space, type WeekDoc } from "./types";

export const useCode = () => useSyncExternalStore(subscribeCode, getCode, getServerCode);

export const useSyncStatus = () =>
  useSyncExternalStore(subscribeStatus, getStatus, getServerStatus);

const noop = () => () => {};

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

export const useCooksAround = (days: string[]) => {
  const first = days.length ? monthOf(days[0]) : null;
  const last = days.length ? monthOf(days[days.length - 1]) : null;
  const a = useMonth(first);
  const b = useMonth(last && last !== first ? last : null);
  const cooks: Cook[] = [...Object.values(a.cooks), ...(last !== first ? Object.values(b.cooks) : [])];
  return { cooks, ready: a.ready && (last === first || b.ready) };
};

export const useQueryParam = (key: string) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  return [params.get(key), set] as const;
};
