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

const IOS_CHROME_RECOVERY_STYLE = `
html.bintuitive-ios-booting,
html.bintuitive-ios-booting body {
  background: #f7f4ea !important;
}

html.bintuitive-ios-booting body {
  opacity: 0 !important;
  pointer-events: none !important;
}

html.bintuitive-ios-booting::before {
  position: fixed;
  z-index: 2147483647;
  /*
   * El porcentaje de un elemento fixed sigue el viewport dinámico de Chrome y
   * salta cuando sus barras cambian de tamaño. svh conserva la altura del
   * viewport pequeño durante toda la transición.
   */
  top: 50%;
  top: 50svh;
  left: 50vw;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 1.25rem;
  background: url("/brand-mark.png") center / contain no-repeat;
  box-shadow: 0 0.75rem 2.5rem rgb(74 56 0 / 0.16);
  content: "";
  opacity: 1;
  transform: translate3d(-50%, -50%, 0);
  transition: opacity 180ms ease;
  will-change: opacity;
}

html.bintuitive-ios-booting.bintuitive-ios-ready body {
  opacity: 1 !important;
  transition: opacity 180ms ease;
}

html.bintuitive-ios-booting.bintuitive-ios-ready::before {
  opacity: 0;
}

`;

/*
 * Chrome/iOS puede presentar una navegación abierta desde otra aplicación en
 * un WKWebView cuyo lienzo conserva el inset de la pestaña anterior. La página
 * no puede detectarlo: sus rectángulos, scrollY y visualViewport siguen siendo
 * correctos, aunque Chrome pinte todo detrás de sus barras. Una recarga sí
 * obliga al navegador a crear la superficie con los insets actuales.
 *
 * El script se instala antes de pintar, solo en CriOS y solo al entrar mediante
 * una navegación nueva. Todas las aperturas enseñan la misma pantalla de marca:
 * una primera entrada la funde con la aplicación al terminar de cargar y solo
 * una apertura posterior activa la recuperación. Mientras Chrome termina de
 * animar su barra se oculta el documento, de modo que nunca se enseña el layout
 * desplazado. sessionStorage sobrevive a la recarga y se consume en el segundo
 * documento, por lo que cada entrada se recarga una vez y nunca forma un bucle.
 * Las navegaciones internas y las partidas no se tocan.
 */
const IOS_CHROME_VIEWPORT_RECOVERY = String.raw`
(function () {
  if (!/CriOS\//.test(navigator.userAgent)) return;
  if (!/^\/(hexagons|progress|profile)\/?$/.test(location.pathname)) return;

  var guard = "bintuitive:ios-chrome-viewport-reload";
  var lastEntryKey = "bintuitive:ios-chrome-last-entry";
  var entry = location.href;
  var bootClass = "bintuitive-ios-booting";
  var readyClass = "bintuitive-ios-ready";
  var root = document.documentElement;

  function revealAfterLoad(delay) {
    addEventListener("load", function () {
      setTimeout(function () {
        root.classList.add(readyClass);
        setTimeout(function () {
          root.classList.remove(readyClass);
          root.classList.remove(bootClass);
        }, 220);
      }, delay);
    }, { once: true });
  }

  try {
    if (sessionStorage.getItem(guard) === entry) {
      sessionStorage.removeItem(guard);
      root.classList.add(bootClass);
      revealAfterLoad(150);
      return;
    }

    var navigations = performance.getEntriesByType("navigation");
    if (navigations.length && navigations[0].type !== "navigate") return;

    root.classList.add(bootClass);

    var now = Date.now();
    var lastEntry = Number(localStorage.getItem(lastEntryKey) || 0);
    localStorage.setItem(lastEntryKey, String(now));

    // Una entrada aislada nace bien. El fallo aparece al abrir otro enlace
    // desde WhatsApp mientras Chrome conserva la superficie de la anterior.
    if (!lastEntry || now - lastEntry > 24 * 60 * 60 * 1000) {
      revealAfterLoad(450);
      return;
    }

    addEventListener("load", function () {
      setTimeout(function () {
        try {
          sessionStorage.setItem(guard, entry);
          location.reload();
        } catch (_) {
          root.classList.remove(bootClass);
        }
      }, 1500);
    }, { once: true });
  } catch (_) {
    // Sin sessionStorage no es posible garantizar que la recarga no se repita.
    root.classList.remove(bootClass);
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
        <style dangerouslySetInnerHTML={{ __html: IOS_CHROME_RECOVERY_STYLE }} />
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
