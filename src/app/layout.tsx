import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BeeSmart",
  description:
    "Juego educativo táctil para niños: toca la respuesta correcta y aprende jugando.",
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
    <html lang="es" className={baloo.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
