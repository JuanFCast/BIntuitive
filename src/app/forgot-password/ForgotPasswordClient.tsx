"use client";

import { useState } from "react";
import Link from "next/link";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import { useLanguage } from "@/lib/i18n";
import { isClean, validateEmail, type FieldError } from "@/lib/authForm";
import { SIGN_IN } from "@/lib/routes";

/**
 * Recuperar la contraseña: prototipo visual.
 *
 * Aquí la honestidad importa más que en las otras dos. Un "te hemos enviado un
 * correo" es exactamente lo que espera ver quien usa esta pantalla, y si el
 * correo no llega nunca la persona se queda esperando, revisando la carpeta de
 * no deseado y pensando que el fallo es suyo. Por eso al enviar no se dice que
 * se ha enviado nada: se dice que las cuentas todavía no existen.
 */
export default function ForgotPasswordClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = { email: validateEmail(email) };
    setErrors(next);
    if (isClean(next)) setSubmitted(true);
  };

  return (
    <AuthShell
      title={t("forgotTitle")}
      subtitle={t("forgotSubtitle")}
      submitted={submitted}
    >
      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("authEmail")}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email ?? null}
          autoComplete="email"
        />

        <button
          type="submit"
          className="mt-5 min-h-14 w-full break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-xl font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
        >
          {t("authSendInstructions")}
        </button>

        <Link
          href={SIGN_IN}
          className="mt-3 flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-2 border-ink/15 bg-white px-5 py-3 text-lg font-extrabold leading-snug text-ink transition-transform active:scale-95"
        >
          {t("authBackToSignIn")}
        </Link>
      </form>
    </AuthShell>
  );
}
