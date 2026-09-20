"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useLanguage } from "@/lib/i18n";
import { EXPLORE, SIGN_IN, SIGN_UP } from "@/lib/routes";

/**
 * La portada pública.
 *
 * Dos mitades en escritorio: a la izquierda quién es BIntuitive, a la derecha
 * por dónde se entra. En el teléfono se apilan, la identidad arriba y las
 * acciones debajo, porque lo que trae a alguien aquí es entrar y el pulgar
 * llega antes a lo de abajo.
 *
 * De las tres puertas solo una está abierta, y la pantalla no lo esconde: el
 * aviso de que las cuentas llegarán después está junto a los botones, no
 * escondido detrás de ellos, y "continuar como invitado" es la que lleva a la
 * aplicación de verdad, con el progreso de este dispositivo intacto.
 *
 * El panal de la izquierda es decorativo y se anuncia como una imagen sola:
 * repetir hexágono por hexágono no le diría nada a quien escucha la pantalla.
 */
export default function LandingClient() {
  const { t } = useLanguage();

  return (
    <main className="landing-surface flex min-h-[100svh] flex-col px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6 lg:flex-row lg:items-center lg:gap-16 lg:py-10">
          <section className="flex w-full max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
            <BrandMark size={84} priority />
            <h1 className="mt-4 break-words text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              {t("landingWelcome")}
            </h1>
            <p className="mt-3 break-words text-xl font-bold leading-snug text-ink/60 sm:text-2xl">
              {t("landingTagline")}
            </p>
            <HoneycombArt label={t("landingArtAria")} />
          </section>

          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_18px_48px_rgba(74,56,0,0.12)] sm:p-7">
              <Link
                href={SIGN_IN}
                className="flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-xl font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
              >
                {t("signIn")}
              </Link>

              <Link
                href={SIGN_UP}
                className="mt-3 flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-b-8 border-ink/15 bg-white px-5 py-3 text-xl font-extrabold leading-snug text-ink shadow-md transition-transform active:scale-95 active:border-b-4"
              >
                {t("createAccount")}
              </Link>

              <div
                className="my-5 flex items-center gap-3"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-lg">🐝</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              <Link
                href={EXPLORE}
                className="flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-b-8 border-mint bg-mintsoft px-5 py-3 text-xl font-extrabold leading-snug text-ink shadow-md transition-transform active:scale-95 active:border-b-4"
              >
                {t("continueAsGuest")}
              </Link>

              <p className="mt-4 break-words px-1 text-center text-sm font-semibold leading-snug text-ink/55">
                {t("accountsComingSoon")}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/**
 * El panal de la portada: siete fichas con lo que se aprende dentro.
 *
 * Son los emoji de los hexágonos reales —colores, números, lugares, palabras,
 * trazos— colocados en la misma retícula que el panal de `/explore`: filas que
 * se solapan a tres cuartos de altura y corridas media ficha. Así la portada
 * enseña la forma de la aplicación antes de entrar en ella.
 *
 * Se mueve muy poco y muy despacio, y deja de moverse del todo para quien pide
 * menos animación en su sistema. Es una decoración: no puede costar batería ni
 * marear a nadie.
 */
function HoneycombArt({ label }: { label: string }) {
  const cells = ["🎨", "🔢", "🏝️", "✏️", "🔠", "🧠", "👀"];

  return (
    <div
      className="landing-hive mt-6 sm:mt-8 lg:mt-10"
      role="img"
      aria-label={label}
    >
      {cells.map((emoji, index) => (
        <span key={emoji} className={`landing-hive-cell landing-hive-${index}`}>
          <span aria-hidden="true">{emoji}</span>
        </span>
      ))}
    </div>
  );
}
