"use client";

import { useState } from "react";
import Link from "next/link";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import { useLanguage } from "@/lib/i18n";
import {
  isClean,
  validateEmail,
  validatePasswordPresence,
  type FieldError,
} from "@/lib/authForm";
import { FORGOT_PASSWORD, SIGN_UP } from "@/lib/routes";

/**
 * Iniciar sesión: un prototipo visual, y solo eso.
 *
 * No hay proveedor de identidad, ni base de datos, ni sesión. Lo escrito aquí
 * se valida, se enseña el aviso de que las cuentas aún no existen y se olvida
 * al cambiar de pantalla: no se envía a ningún sitio y no se guarda en
 * `localStorage` ni en ninguna otra parte.
 */
export default function SignInClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = {
      email: validateEmail(email),
      password: validatePasswordPresence(password),
    };
    setErrors(next);
    if (isClean(next)) setSubmitted(true);
  };

  return (
    <AuthShell
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      submitted={submitted}
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
          className="mt-3 inline-block px-1 text-base font-bold text-ink/60 underline"
        >
          {t("authForgotLink")}
        </Link>

        <button
          type="submit"
          className="mt-5 min-h-14 w-full break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-xl font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
        >
          {t("signIn")}
        </button>
      </form>
    </AuthShell>
  );
}
