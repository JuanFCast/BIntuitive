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
  /** `true` cuando el formulario ya se envió y toca decir la verdad. */
  submitted: boolean;
  children: ReactNode;
  /** El enlace de debajo de la tarjeta: ir al otro formulario. */
  footer?: ReactNode;
};

/**
 * El marco de las tres pantallas de cuenta.
 *
 * No lleva `AppShell`: la barra inferior es para moverse dentro de la
 * aplicación, y aquí todavía no se ha entrado. Se sale por el botón de volver,
 * que lleva a la portada, y no por la pestaña de una sección que aún no toca.
 *
 * Cuando el formulario se envía, el formulario desaparece y en su sitio queda
 * el aviso de que las cuentas no existen todavía, con la puerta de invitado
 * abierta. Enseñar el aviso encima del formulario invitaría a volver a pulsar
 * un botón que no va a hacer nada.
 */
export default function AuthShell({
  title,
  subtitle,
  submitted,
  children,
  footer,
}: AuthShellProps) {
  const { t } = useLanguage();

  return (
    <main className="landing-surface min-h-[100svh] px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={LANDING}
            className="flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm transition-transform active:scale-95"
          >
            <span aria-hidden="true">←</span>
            {t("back")}
          </Link>
          <LanguageSwitch />
        </div>

        <header className="mt-6 text-center">
          <BrandMark size={64} className="mx-auto" priority />
          <h1 className="mt-3 break-words text-3xl font-extrabold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-base font-semibold leading-snug text-ink/60">
            {subtitle}
          </p>
        </header>

        <div className="mt-6 rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_14px_40px_rgba(74,56,0,0.10)] sm:p-6">
          {submitted ? <ComingSoonNotice /> : children}
        </div>

        {!submitted && footer && (
          <div className="mt-5 text-center text-base font-semibold text-ink/60">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
