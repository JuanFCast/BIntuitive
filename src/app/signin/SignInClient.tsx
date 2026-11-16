"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthAlert from "@/components/AuthAlert";
import AuthButton from "@/components/AuthButton";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import {
  isClean,
  validateEmail,
  validatePasswordPresence,
  type FieldError,
} from "@/lib/authForm";
import { resendConfirmation, signIn } from "@/lib/account";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase";
import { EXPLORE, FORGOT_PASSWORD, SIGN_UP } from "@/lib/routes";

/**
 * Iniciar sesión con correo y contraseña.
 *
 * Al entrar se va al panal, que es el principio de la aplicación. Si la
 * cuenta existe pero todavía no se ha activado, el aviso trae el botón de
 * reenviar el correo ahí mismo: es el único arreglo posible y no tiene sentido
 * mandar a nadie a buscarlo a otra pantalla.
 */
export default function SignInClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const next = {
      email: validateEmail(email),
      password: validatePasswordPresence(password),
    };
    setErrors(next);
    setServerError(null);
    setResent(false);
    if (!isClean(next)) return;

    if (!IS_SUPABASE_CONFIGURED) {
      setComingSoon(true);
      return;
    }

    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);

    if (result.ok) {
      router.push(EXPLORE);
    } else {
      setServerError(result.error);
    }
  };

  const resend = async () => {
    const result = await resendConfirmation(email);
    if (result.ok) {
      setServerError(null);
      setResent(true);
    } else {
      setServerError(result.error);
    }
  };

  return (
    <AuthShell
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      comingSoon={comingSoon}
      footer={
        <>
          {t("authNoAccount")}{" "}
          <Link href={SIGN_UP} className="font-extrabold text-ink underline">
            {t("createAccount")}
          </Link>
        </>
      }
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
        <AuthField
          label={t("authPassword")}
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password ?? null}
          autoComplete="current-password"
        />

        <Link
          href={FORGOT_PASSWORD}
          className="mt-3 inline-block px-1 text-base font-bold text-ink/70 underline"
        >
          {t("authForgotLink")}
        </Link>

        <AuthAlert error={serverError} />

        {serverError === "authErrorEmailNotConfirmed" && (
          <AuthButton type="button" variant="secondary" onClick={resend}>
            {t("authResend")}
          </AuthButton>
        )}
        {resent && (
          <p role="status" className="animate-fade-up mt-4 text-center text-base font-extrabold text-[#1f7a4a]">
            {t("authResent")}
          </p>
        )}

        <AuthButton busy={busy} busyLabel={t("authSigningIn")}>
          {t("signIn")}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
