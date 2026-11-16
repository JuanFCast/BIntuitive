"use client";

import { useState } from "react";
import Link from "next/link";
import AuthAlert from "@/components/AuthAlert";
import AuthButton from "@/components/AuthButton";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import { validateEmail, type FieldError } from "@/lib/authForm";
import { sendPasswordReset } from "@/lib/account";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase";
import { SIGN_IN } from "@/lib/routes";

/**
 * Recuperar la contraseña: se pide el correo y Supabase envía un enlace que
 * vuelve a `/reset-password`.
 *
 * Al enviar se dice lo mismo exista o no la cuenta ("si hay una cuenta con
 * ese correo…"): contestar "ese correo no existe" le contaría a cualquiera
 * quién está registrado. Sin proyecto configurado no se finge ningún envío:
 * se dice que las cuentas aún no están, porque quien espera un correo que no
 * va a llegar acaba pensando que el fallo es suyo.
 */
export default function ForgotPasswordClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const next = validateEmail(email);
    setError(next);
    setServerError(null);
    if (next) return;

    if (!IS_SUPABASE_CONFIGURED) {
      setComingSoon(true);
      return;
    }

    setBusy(true);
    const result = await sendPasswordReset(email);
    setBusy(false);

    if (result.ok) setSentTo(email.trim());
    else setServerError(result.error);
  };

  const backToSignIn = (
    <Link
      href={SIGN_IN}
      className="mt-3 flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-2 border-ink/15 bg-white px-5 py-3 text-lg font-extrabold leading-snug text-ink transition-transform active:scale-95"
    >
      {t("authBackToSignIn")}
    </Link>
  );

  if (sentTo) {
    return (
      <AuthShell
        title={t("forgotDoneTitle")}
        subtitle={t("signUpDoneSpam")}
        stepKey="sent"
      >
        <div className="text-center" role="status">
          <div className="animate-pop relative mx-auto flex h-24 w-24 items-center justify-center">
            <span aria-hidden="true" className="hex-cell absolute inset-0 bg-sunsoft" />
            <span aria-hidden="true" className="relative text-5xl">
              🔑
            </span>
          </div>
          <p className="mx-auto mt-4 max-w-sm break-words text-lg font-semibold leading-snug text-ink/80">
            {t("forgotDoneText", { email: sentTo })}
          </p>
        </div>
        {backToSignIn}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("forgotTitle")}
      subtitle={t("forgotSubtitle")}
      comingSoon={comingSoon}
    >
      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("authEmail")}
          type="email"
          value={email}
          onChange={setEmail}
          error={error}
          autoComplete="email"
        />

        <AuthAlert error={serverError} />

        <AuthButton busy={busy} busyLabel={t("authSending")}>
          {t("authSendInstructions")}
        </AuthButton>

        {backToSignIn}
      </form>
    </AuthShell>
  );
}
