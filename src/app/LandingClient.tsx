"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import LanguageSwitch from "@/components/LanguageSwitch";
import { hexagonImage } from "@/data/categories";
import { signOut, useAccount } from "@/lib/account";
import { IS_STORE_BUILD } from "@/lib/buildTarget";
import { useLanguage } from "@/lib/i18n";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase";
import { EXPLORE, SIGN_IN, SIGN_UP } from "@/lib/routes";

/**
 * La portada pública.
 *
 * Dos mitades en escritorio: a la izquierda quién es BIntuitive, a la derecha
 * por dónde se entra. En el teléfono se apilan, la identidad arriba y las
 * acciones debajo, porque lo que trae a alguien aquí es entrar y el pulgar
 * llega antes a lo de abajo.
 *
 * Tres puertas: entrar como invitado, iniciar sesión y crear una cuenta. La
 * de invitado sigue siendo la grande y la primera, porque es la que lleva a
 * jugar sin pedir nada. Con una sesión abierta las dos de cuenta sobran: la
 * grande saluda por el nombre y debajo queda cerrar la sesión. Sin proyecto
 * de Supabase configurado, el aviso de que las cuentas llegarán después sigue
 * junto a los botones. En el build de tienda las dos de cuenta no aparecen
 * (ver `buildTarget.ts`).
 *
 * El panal de la izquierda es decorativo y se anuncia como una imagen sola:
 * repetir hexágono por hexágono no le diría nada a quien escucha la pantalla.
 */
export default function LandingClient() {
  const { t } = useLanguage();
  const account = useAccount();
  const signedIn = account.status === "signed-in" ? account.user : null;
  const firstName = signedIn?.name.trim().split(/\s+/)[0] ?? "";

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
              {/*
                La puerta grande es entrar a jugar, siempre. Con sesión abierta
                saluda por el nombre; sin ella es la de invitado, y las cuentas
                quedan agrupadas aparte.
              */}
              <Link
                href={EXPLORE}
                className="flex min-h-16 w-full items-center justify-center gap-2 break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-2xl font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
              >
                <span aria-hidden="true">▶</span>
                {signedIn && firstName
                  ? t("landingContinueAs", { name: firstName })
                  : t("continueAsGuest")}
              </Link>

              {signedIn && (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-4 flex min-h-12 w-full items-center justify-center break-words rounded-2xl px-4 py-2 text-base font-extrabold text-ink/70 underline underline-offset-4 transition-transform active:scale-95"
                >
                  {t("landingSignOut")}
                </button>
              )}

              {!IS_STORE_BUILD && !signedIn && (
                <>
                  <div
                    className="my-5 flex items-center gap-3"
                    aria-hidden="true"
                  >
                    <span className="h-px flex-1 bg-ink/10" />
                    <span className="text-lg">🐝</span>
                    <span className="h-px flex-1 bg-ink/10" />
                  </div>

                  <p className="text-center text-base font-extrabold text-ink/70">
                    {t("landingAccount")}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                    <Link
                      href={SIGN_IN}
                      className="flex min-h-12 w-full items-center justify-center break-words rounded-2xl border-2 border-b-[6px] border-ink/15 bg-white px-4 py-2 text-lg font-extrabold leading-snug text-ink transition-transform active:scale-95 active:border-b-2"
                    >
                      {t("signIn")}
                    </Link>
                    <Link
                      href={SIGN_UP}
                      className="flex min-h-12 w-full items-center justify-center break-words rounded-2xl border-2 border-b-[6px] border-ink/15 bg-white px-4 py-2 text-lg font-extrabold leading-snug text-ink transition-transform active:scale-95 active:border-b-2"
                    >
                      {t("createAccount")}
                    </Link>
                  </div>

                  {!IS_SUPABASE_CONFIGURED && (
                    <p className="mt-4 break-words px-1 text-center text-sm font-semibold leading-snug text-ink/70">
                      {t("accountsComingSoon")}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/*
          Los dibujos de las fichas derivan de Twemoji, con licencia CC BY 4.0,
          que pide la atribución allí donde se usan y no solo en el
          repositorio. Va aquí, pequeña y al final, porque la portada es la
          única pantalla que ve todo el que entra.
        */}
        <p className="mt-6 text-center text-xs font-semibold text-ink/70">
          {t("artCredit")}{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>
        </p>
      </div>
    </main>
  );
}

/**
 * El panal de la portada: siete fichas con lo que se aprende dentro.
 *
 * Son los dibujos de los hexágonos reales —colores, números, lugares, palabras,
 * trazos— colocados en la misma retícula que el panal de `/explore`: filas que
 * se solapan a tres cuartos de altura y corridas media ficha. Así la portada
 * enseña la forma de la aplicación antes de entrar en ella.
 *
 * Se mueve muy poco y muy despacio, y deja de moverse del todo para quien pide
 * menos animación en su sistema. Es una decoración: no puede costar batería ni
 * marear a nadie.
 */
function HoneycombArt({ label }: { label: string }) {
  const cells = (
    ["colores", "numeros", "lugares", "tracing", "search", "memory", "visual"] as const
  ).map(hexagonImage);

  return (
    <div
      className="landing-hive mt-6 sm:mt-8 lg:mt-10"
      role="img"
      aria-label={label}
    >
      {cells.map((image, index) => (
        <span key={image} className={`landing-hive-cell landing-hive-${index}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" aria-hidden="true" draggable={false} />
        </span>
      ))}
    </div>
  );
}
