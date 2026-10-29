import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import ServiceWorker from "./elements/ServiceWorker";
import Nav from "./elements/Nav";
import Background from "./elements/Background";
import { asset } from "./lib/asset";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "Что готовим",
  description:
    "Семейное меню на месяц: домашние супы и вторые блюда без повторов, список покупок на неделю и синхронизация между телефонами.",
  appleWebApp: { capable: true, title: "Что готовим", statusBarStyle: "black-translucent" },
  icons: { apple: asset("/icons/icon-192.png") },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <ServiceWorker />
        <Background />
        <Nav />
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-32 sm:px-6 md:pb-16">{children}</main>
      </body>
    </html>
  );
}
