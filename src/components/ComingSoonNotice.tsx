"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { EXPLORE } from "@/lib/routes";

/**
 * Lo que aparece al enviar cualquiera de los formularios de cuenta.
 *
 * Dice la verdad y no la disfraza: no hay cuentas todavía, no se ha creado
 * nada, no se ha guardado ningún correo y no hay ninguna sesión iniciada.
 * Fingir un "te hemos enviado un correo" que nunca llega se paga con la
 * confianza de una familia, y este producto es para niños.
 *
 * Por eso el aviso no se queda solo: trae la puerta que sí funciona. Quien
 * quería entrar puede entrar, como invitado, con todo su progreso local.
 */
export default function ComingSoonNotice() {
  const { t } = useLanguage();

  return (
    <div className="text-center" role="status">
      <span className="text-4xl" aria-hidden="true">
        🐝
      </span>
      <p className="mx-auto mt-3 max-w-sm text-base font-semibold leading-snug text-ink/70">
        {t("accountsComingSoonForm")}
      </p>
      <Link
        href={EXPLORE}
        className="mt-5 flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-lg font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
      >
        {t("continueAsGuest")}
      </Link>
    </div>
  );
}
