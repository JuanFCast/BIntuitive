"use client";

import { useState } from "react";
import Link from "next/link";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import { useLanguage } from "@/lib/i18n";
import {
  isClean,
  validateConfirmation,
  validateEmail,
  validateNewPassword,
  type FieldError,
} from "@/lib/authForm";
import { SIGN_IN } from "@/lib/routes";

/**
 * Crear una cuenta: prototipo visual, sin crear nada.
 *
 * La pantalla dice en voz alta de quién es la cuenta antes de pedir el primer
 * dato. No es decoración: el modelo es una cuenta de adulto con perfiles
 * infantiles dentro, y un adulto que llega aquí tiene que entender que el
 * correo que escribe es el suyo y no el de su hijo. Los niños no tendrán
 * correo ni contraseña.
 *
 * Nada de lo escrito sale de esta pestaña ni se guarda en ningún sitio.
 */
export default function SignUpClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = {
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirmation: validateConfirmation(password, confirmation),
    };
    setErrors(next);
    if (isClean(next)) setSubmitted(true);
  };

  return (
    <AuthShell
      title={t("signUpTitle")}
      subtitle={t("signUpSubtitle")}
      submitted={submitted}
      footer={
        <>
          {t("authHasAccount")}{" "}
          <Link href={SIGN_IN} className="font-extrabold text-ink underline">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <p className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-sky bg-skysoft px-4 py-3 text-sm font-semibold leading-snug text-ink/70">
        <span aria-hidden="true" className="text-lg">
          👩‍👧
        </span>
        {t("signUpAdultNotice")}
      </p>

      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("authAdultEmail")}
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
          autoComplete="new-password"
        />
        <AuthField
          label={t("authConfirmPassword")}
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          error={errors.confirmation ?? null}
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="mt-5 min-h-14 w-full break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-xl font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
        >
          {t("createAccount")}
        </button>
      </form>
    </AuthShell>
  );
}
