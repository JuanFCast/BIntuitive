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

/*
 * Sin `viewportFit: "cover"` a propósito.
 *
 * `cover` es exactamente la petición de que el viewport de disposición cubra
 * toda la pantalla incluyendo lo que tapa la interfaz del sistema, dejando que
 * la página lo compense con `env(safe-area-inset-*)`. Es decir: es el
 * interruptor que autoriza a que el espacio de coordenadas del documento no
 * coincida con lo que se ve, que es justo el fallo que aparece en Chrome de
 * iPhone al abrir el mismo enlace por segunda vez desde otra aplicación.
 *
 * Quitarlo no cambia nada en el navegador: medido en iPhone, las áreas seguras
 * ya valían cero ahí —el encabezado medía sus 3.75rem exactos y la barra sus
 * 4.25rem—. Sí cambia en modo instalado, donde el marco pasa a quedarse dentro
 * del área segura en vez de meterse bajo la muesca. Se acepta ese cambio: la
 * aplicación se abre casi siempre desde un enlace, en el navegador.
 *
 * Los `env(safe-area-inset-*)` de `globals.css` se quedan donde están. Ahora
 * resuelven a cero y no estorban, y siguen siendo correctos si algún día se
 * vuelve a `cover`.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
