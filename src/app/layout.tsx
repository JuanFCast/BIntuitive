import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import { siteDescription, siteName, siteUrl } from "./siteMetadata";
import AppShell from "@/components/AppShell";
import TextSizePreference from "@/components/TextSizePreference";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["400", "600", "700", "800"],
});

const title = siteName;
const description = siteDescription;
const socialImageUrl = `${siteUrl}/bintuitive-og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "BIntuitive",
    locale: "en_US",
    title,
    description,
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "BIntuitive logo on a warm cream background",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImageUrl],
  },
  /*
   * iOS no lee `display` del manifest: para que "Añadir a pantalla de inicio"
   * abra sin la barra del navegador hace falta declararlo aquí. No es un truco
   * heredado, es la única vía en Safari, y Next genera las etiquetas.
   */
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  other: {
    /*
     * De `appleWebApp.capable` Next genera el nombre estandarizado,
     * `mobile-web-app-capable`, que Safari solo entiende en versiones
     * recientes. El nombre con prefijo sigue siendo el que activa standalone
     * en un iPad de hace unos años, que es justo el dispositivo objetivo.
     * Duplicarlo no cuesta nada: quien entiende el nuevo ignora este.
     */
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffc400",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <TextSizePreference />
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
