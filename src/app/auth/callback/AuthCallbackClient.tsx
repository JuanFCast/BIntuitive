"use client";

import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import Confetti from "@/components/Confetti";
import { useLanguage } from "@/lib/i18n";
import { useAccount } from "@/lib/account";
import { EXPLORE, SIGN_IN } from "@/lib/routes";

/**
 * Adonde vuelve el enlace del correo de alta.
 *
 * El enlace trae la sesión en la dirección y el cliente de Supabase la recoge
 * solo al cargar; esta pantalla solo espera a saber cómo ha ido. Si la cuenta
 * quedó activa, la recibe con confeti y por su nombre, que es el momento en
 * que de verdad empieza; si no, el enlace caducó o ya se usó, e iniciar
 * sesión dice qué falta.
 */
export default function AuthCallbackClient() {
  const { t } = useLanguage();
  const account = useAccount();

  if (account.status === "loading") {
    return (
      <AuthShell title={t("callbackChecking")} subtitle={t("signUpStepEmailHint")}>
        <p role="status" className="text-center text-lg font-bold text-ink/70">
          {t("callbackChecking")}
        </p>
      </AuthShell>
    );
  }

  if (account.status !== "signed-in") {
    return (
      <AuthShell
        title={t("signInTitle")}
        subtitle={t("callbackFailed")}
        comingSoon={account.status === "unavailable"}
      >
        <ActionLink href={SIGN_IN}>{t("signIn")}</ActionLink>
      </AuthShell>
    );
  }

  const firstName = account.user.name.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="relative">
      <AuthShell
        title={t("callbackTitle", { name: firstName })}
        subtitle={t("callbackText")}
        stepKey="welcome"
      >
        <div className="animate-pop relative mx-auto flex h-24 w-24 items-center justify-center">
          <span aria-hidden="true" className="hex-cell absolute inset-0 bg-mintsoft" />
          <span aria-hidden="true" className="relative text-5xl">
            🎉
          </span>
        </div>
        <ActionLink href={EXPLORE}>{t("authStartLearning")}</ActionLink>
      </AuthShell>
      {/* Encima de la portada y contra este envoltorio: cae sobre toda la pantalla. */}
      <Confetti />
    </div>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-5 flex min-h-14 w-full items-center justify-center break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-5 py-3 text-lg font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
    >
      {children}
    </Link>
  );
}
