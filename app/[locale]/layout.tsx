import type { Metadata, Viewport } from "next";
import "../globals.css";
import AppProviders from "@/components/providers/app-providers";
import { Bricolage_Grotesque, Instrument_Sans, Cairo } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages } from "next-intl/server";
import { getDirection } from "@/i18n/i18n-confige";
import clsx from "clsx";
import { WEBSITE_NAME } from "@/constants";
import { brandInitScript } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${WEBSITE_NAME} | Save Money`,
  description: "walstore for all products",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6F8" },
    { media: "(prefers-color-scheme: dark)", color: "#090B0F" },
  ],
};

// Display: headings and prices.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display",
});

// UI and body text.
const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// All Arabic text.
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = getDirection(locale);

  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={clsx(bricolage.variable, instrument.variable, cairo.variable)}
    >
      <head>
        {/* Applies the saved brand before first paint (no flash of the default). */}
        <script dangerouslySetInnerHTML={{ __html: brandInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders dir={dir}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
