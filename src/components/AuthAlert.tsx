"use client";

import { useLanguage, type MessageKey } from "@/lib/i18n";

/**
 * Lo que contesta el servidor cuando algo no sale: sin red, correo ya usado,
 * contraseña equivocada. Va encima del botón, no al lado de un campo, porque
 * no es culpa de una casilla concreta.
 */
export default function AuthAlert({ error }: { error: MessageKey | null }) {
  const { t } = useLanguage();
  if (!error) return null;

  return (
    <p
      role="alert"
      className="animate-shake mt-4 flex items-start gap-2 rounded-2xl border-2 border-coral bg-coralsoft px-4 py-3 text-base font-bold leading-snug text-[#8f2f22]"
    >
      <span aria-hidden="true">⚠️</span>
      {t(error)}
    </p>
  );
}
