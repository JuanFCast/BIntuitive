"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthAlert from "./AuthAlert";
import AuthButton from "./AuthButton";
import AuthShell from "./AuthShell";
import { FieldErrorText } from "./AuthField";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import {
  cleanEmailCode,
  EMAIL_CODE_LENGTH,
  validateEmailCode,
  type FieldError,
} from "@/lib/authForm";
import { resendConfirmation, verifyEmailCode } from "@/lib/account";
import { AUTH_CALLBACK, EXPLORE } from "@/lib/routes";

/** Lo que tarda en dejar volver a pedir el correo: Supabase limita los envíos. */
const RESEND_COOLDOWN_SECONDS = 60;

type EmailCodeScreenProps = {
  email: string;
  title: string;
  /**
   * Si el código ya se acaba de enviar. Tras registrarse, sí: el reenvío
   * espera un minuto. Desde iniciar sesión con la cuenta sin activar, no: el
   * botón de pedirlo está disponible desde el principio.
   */
  justSent: boolean;
  /** Volver a la pantalla anterior (iniciar sesión). Sin él, vuelve a la portada. */
  onBack?: () => void;
};

/**
 * Activar la cuenta con el código de seis cifras que llega por correo.
 *
 * Una sola casilla y no seis: con `autoComplete="one-time-code"` el teclado
 * del teléfono ofrece el código leído del correo con un toque, y seis casillas
 * separadas rompen ese atajo y el pegado. Al llegar a la sexta cifra se envía
 * solo, sin tener que buscar el botón.
 *
 * Al acertar hay sesión abierta, y se pasa a la bienvenida de
 * `/auth/callback`, que es la misma que recibe a quien llega por un enlace.
 */
export default function EmailCodeScreen({
  email,
  title,
  justSent,
  onBack,
}: EmailCodeScreenProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const id = useId();
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<FieldError>(null);
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(justSent ? RESEND_COOLDOWN_SECONDS : 0);
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const verify = async (value: string) => {
    if (busy) return;
    const error = validateEmailCode(value);
    setFieldError(error);
    setServerError(null);
    if (error) return;

    setBusy(true);
    const result = await verifyEmailCode(email, cleanEmailCode(value));
    setBusy(false);

    if (result.ok) {
      router.push(AUTH_CALLBACK);
    } else {
      setServerError(result.error);
    }
  };

  const change = (value: string) => {
    const digits = cleanEmailCode(value);
    setCode(digits);
    setFieldError(null);
    if (digits.length === EMAIL_CODE_LENGTH) void verify(digits);
  };

  const resend = async () => {
    setSending(true);
    setServerError(null);
    setResent(false);
    const result = await resendConfirmation(email);
    setSending(false);
    if (result.ok) {
      setResent(true);
      setWait(RESEND_COOLDOWN_SECONDS);
    } else {
      setServerError(result.error);
    }
  };

  return (
    <AuthShell title={title} subtitle={t("signUpDoneSpam")} stepKey="code" onBack={onBack}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void verify(code);
        }}
        noValidate
      >
        <div className="text-center">
          <div className="animate-pop relative mx-auto flex h-20 w-20 items-center justify-center">
            <span aria-hidden="true" className="hex-cell absolute inset-0 bg-sunsoft" />
            <span aria-hidden="true" className="relative text-4xl">
              ✉️
            </span>
          </div>
          <p className="mx-auto mt-3 max-w-sm break-words text-lg font-semibold leading-snug text-ink/80">
            {t("signUpDoneText", { email })}
          </p>
        </div>

        <label htmlFor={id} className="sr-only">
          {t("authCode")}
        </label>
        <input
          id={id}
          value={code}
          onChange={(event) => change(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={EMAIL_CODE_LENGTH + 4}
          autoFocus
          placeholder={"•".repeat(EMAIL_CODE_LENGTH)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-error` : undefined}
          className={`mt-5 min-h-16 w-full rounded-2xl border-2 bg-cream px-4 text-center text-[2rem] font-extrabold tabular-nums tracking-[0.4em] text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-sun focus:bg-white ${
            fieldError ? "border-coral" : "border-ink/15"
          }`}
        />
        {fieldError && <FieldErrorText id={`${id}-error`} error={fieldError} />}

        <AuthAlert error={serverError} />
        {resent && (
          <p role="status" className="animate-fade-up mt-4 text-center text-base font-extrabold text-[#1f7a4a]">
            {t("authResent")}
          </p>
        )}

        <AuthButton busy={busy} busyLabel={t("authVerifying")}>
          {t("authVerify")}
        </AuthButton>

        <AuthButton
          type="button"
          variant="secondary"
          onClick={resend}
          busy={sending}
          busyLabel={t("authSending")}
          disabled={wait > 0}
        >
          {wait > 0 ? t("authResendIn", { seconds: wait }) : t("authResend")}
        </AuthButton>

        <Link
          href={EXPLORE}
          className="mt-4 block text-center text-base font-bold text-ink/70 underline"
        >
          {t("authPlayMeanwhile")}
        </Link>
      </form>
    </AuthShell>
  );
}
