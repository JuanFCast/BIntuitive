"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import BrandMark from "./BrandMark";
import ComingSoonNotice from "./ComingSoonNotice";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "@/lib/i18n";
import { LANDING } from "@/lib/routes";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /**
   * `true` cuando no hay proyecto de Supabase configurado y ya se intentó
   * enviar: en vez del formulario se enseña que las cuentas aún no están.
   */
  comingSoon?: boolean;
  /** El enlace de debajo de la tarjeta: ir al otro formulario. */
  footer?: ReactNode;
  /**
   * Volver dentro de la propia pantalla (el paso anterior del registro). Sin
   * él, el botón de volver es un enlace a la portada.
   */
  onBack?: () => void;
  /** Lo que va entre la cabecera y la tarjeta: el progreso del registro. */
  progress?: ReactNode;
  /**
   * Cambia cuando cambia la pregunta, para que el bocadillo y la tarjeta
   * vuelvan a entrar. Sin él no se anima nada al escribir.
   */
  stepKey?: string | number;
};

/**
 * El marco de las pantallas de cuenta.
 *
 * No lleva `AppShell`: la barra inferior es para moverse dentro de la
 * aplicación, y aquí todavía no se ha entrado. Se sale por el botón de volver.
 *
 * La cabecera es una conversación: la abeja de la marca pregunta y el
 * formulario de debajo es la respuesta. Una pregunta cada vez, en un bocadillo
 * y no en un rótulo, que es lo que hace que crear una cuenta se lea como
 * empezar a jugar y no como rellenar un trámite.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  comingSoon = false,
  footer,
  onBack,
  progress,
  stepKey,
}: AuthShellProps) {
  const { t } = useLanguage();
  const backClass =
    "flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm transition-transform active:scale-95";

  return (
    <main className="landing-surface min-h-[100svh] px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} className={backClass}>
              <span aria-hidden="true">←</span>
              {t("back")}
            </button>
          ) : (
            <Link href={LANDING} className={backClass}>
              <span aria-hidden="true">←</span>
              {t("back")}
            </Link>
          )}
          <LanguageSwitch />
        </div>

        {progress && <div className="mt-6">{progress}</div>}

        <header
          key={stepKey}
          className={`flex items-end gap-3 ${progress ? "mt-5" : "mt-7"}`}
        >
          <BrandMark
            size={64}
            priority
            className="animate-bee-in shadow-[0_8px_20px_rgba(74,56,0,0.18)]"
          />
          <div className="animate-enter relative min-w-0 flex-1 rounded-3xl rounded-bl-md border-2 border-ink/10 bg-white px-4 py-3 shadow-sm">
            <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 break-words text-base font-semibold leading-snug text-ink/70">
              {subtitle}
            </p>
          </div>
        </header>

        <div className="mt-5 rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_14px_40px_rgba(74,56,0,0.10)] sm:p-6">
          {comingSoon ? <ComingSoonNotice /> : children}
        </div>

        {!comingSoon && footer && (
          <div className="mt-5 text-center text-base font-semibold text-ink/70">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
