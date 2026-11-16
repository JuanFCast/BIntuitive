"use client";

import { useState } from "react";
import Link from "next/link";
import AuthAlert from "@/components/AuthAlert";
import AuthButton from "@/components/AuthButton";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import PasswordStrength from "@/components/PasswordStrength";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import { validateNewPassword, type FieldError } from "@/lib/authForm";
import { updatePassword, useAccount } from "@/lib/account";
import { EXPLORE, FORGOT_PASSWORD } from "@/lib/routes";

/**
 * Elegir una contraseña nueva, al volver del enlace del correo.
 *
 * El enlace trae una sesión de recuperación en la dirección y el cliente de
 * Supabase la recoge solo al cargar. Mientras la lee, la pantalla espera; si
 * no hay sesión, el enlace caducó o ya se usó, y lo único útil es pedir otro.
 */
export default function ResetPasswordClient() {
  const { t } = useLanguage();
  const account = useAccount();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const next = validateNewPassword(password);
    setError(next);
    setServerError(null);
    if (next) return;

    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);

    if (result.ok) setDone(true);
    else setServerError(result.error);
  };

  if (done) {
    return (
      <AuthShell title={t("resetDoneTitle")} subtitle={t("resetDoneText")} stepKey="done">
        <div className="animate-pop relative mx-auto flex h-24 w-24 items-center justify-center">
          <span aria-hidden="true" className="hex-cell absolute inset-0 bg-mintsoft" />
          <span aria-hidden="true" className="relative text-5xl">
            ✅
          </span>
        </div>
        <PrimaryLink href={EXPLORE}>{t("authStartLearning")}</PrimaryLink>
      </AuthShell>
    );
  }

  if (account.status === "loading") {
    return (
      <AuthShell title={t("resetTitle")} subtitle={t("resetChecking")}>
        <p role="status" className="text-center text-lg font-bold text-ink/70">
          {t("resetChecking")}
        </p>
      </AuthShell>
    );
  }

  if (account.status !== "signed-in") {
    return (
      <AuthShell
        title={t("resetTitle")}
        subtitle={t("resetInvalidLink")}
        comingSoon={account.status === "unavailable"}
      >
        <PrimaryLink href={FORGOT_PASSWORD}>{t("authRequestNewLink")}</PrimaryLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("authNewPassword")}
          type="password"
          value={password}
          onChange={setPassword}
          error={error}
          autoComplete="new-password"
          autoFocus
        >
          <PasswordStrength password={password} />
        </AuthField>

        <AuthAlert error={serverError} />

        <AuthButton busy={busy} busyLabel={t("authSaving")}>
          {t("resetSave")}
        </AuthButton>
      </form>
    </AuthShell>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-5 flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-lg font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
    >
      {children}
    </Link>
  );
}
