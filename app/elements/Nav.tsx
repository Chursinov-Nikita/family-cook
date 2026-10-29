"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, CalendarRange, ShoppingBasket, Soup, Users } from "lucide-react";
import SyncBadge from "./SyncBadge";

const LINKS = [
  { href: "/", label: "Неделя", icon: CalendarDays },
  { href: "/month/", label: "Месяц", icon: CalendarRange },
  { href: "/shop/", label: "Покупки", icon: ShoppingBasket },
  { href: "/recipes/", label: "Рецепты", icon: BookOpen },
  { href: "/family/", label: "Семья", icon: Users },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href.slice(0, -1));

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-lime text-ink">
              <Soup size={19} strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl leading-none">
              Что <em className="text-lime">готовим</em>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-cream text-ink" : "text-mute hover:bg-white/5 hover:text-cream"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <SyncBadge />
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-around rounded-3xl border border-white/15 bg-ash p-1.5 shadow-[0_-12px_32px_8px_rgb(10_10_10/0.95)] md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2 text-[13px] font-semibold transition ${
                active ? "bg-lime text-ink" : "text-mute"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
