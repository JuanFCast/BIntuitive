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

/*
 * Chrome/iOS puede presentar una navegación abierta desde otra aplicación en
 * un WKWebView cuyo lienzo conserva el inset de la pestaña anterior. La página
 * no puede detectarlo: sus rectángulos, scrollY y visualViewport siguen siendo
 * correctos, aunque Chrome pinte todo detrás de sus barras. Una recarga sí
 * obliga al navegador a crear la superficie con los insets actuales.
 *
 * El script se instala antes de pintar, solo en CriOS y solo al entrar mediante
 * una navegación nueva. La recarga espera después de `load`: hacerla de
 * inmediato repite el fallo porque Chrome aún está animando su barra y creando
 * la pestaña abierta por la aplicación externa. sessionStorage sobrevive a la
 * recarga y se consume en el segundo documento, por lo que cada entrada se
 * recarga una vez y nunca forma un bucle. Las navegaciones internas y las
 * partidas no se tocan.
 */
const IOS_CHROME_VIEWPORT_RECOVERY = String.raw`
(function () {
  if (!/CriOS\//.test(navigator.userAgent)) return;
  if (!/^\/(hexagons|progress|profile)\/?$/.test(location.pathname)) return;

  var guard = "bintuitive:ios-chrome-viewport-reload";
  var entry = location.href;

  try {
    if (sessionStorage.getItem(guard) === entry) {
      sessionStorage.removeItem(guard);
      return;
    }

    var navigations = performance.getEntriesByType("navigation");
    if (navigations.length && navigations[0].type !== "navigate") return;

    addEventListener("load", function () {
      setTimeout(function () {
        try {
          sessionStorage.setItem(guard, entry);
          location.reload();
        } catch (_) {}
      }, 1500);
    }, { once: true });
  } catch (_) {
    // Sin sessionStorage no es posible garantizar que la recarga no se repita.
  }
})();
`;

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
    // La aplicación ya ofrece español e inglés. Además de ser redundante, el
    // panel nativo de traducción cambia los insets del viewport mientras
    // Chrome/iOS termina de abrir una pestaña desde WhatsApp.
    google: "notranslate",
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
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: IOS_CHROME_VIEWPORT_RECOVERY }}
        />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <TextSizePreference />
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
