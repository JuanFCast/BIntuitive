import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BeeSmart",
  description:
    "A touch-friendly educational game: tap the correct answer and learn through play.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff9ef",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body className="font-sans antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
