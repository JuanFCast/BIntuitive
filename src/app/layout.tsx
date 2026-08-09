import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["400", "600", "700", "800"],
});

const title = "BeeSmart";
const description =
  "A touch-friendly educational game: tap the correct answer and learn through play.";

export const metadata: Metadata = {
  metadataBase: new URL("https://beesmart.aumcrsp.com"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BeeSmart",
    locale: "en_US",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
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
