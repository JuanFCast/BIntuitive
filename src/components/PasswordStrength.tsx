"use client";

import { useLanguage, type MessageKey } from "@/lib/i18n";
import { passwordStrength } from "@/lib/authForm";

const LEVELS: Record<1 | 2 | 3 | 4, { label: MessageKey; fill: string }> = {
  1: { label: "authStrengthWeak", fill: "bg-coral" },
  2: { label: "authStrengthOkay", fill: "bg-sun" },
  3: { label: "authStrengthGood", fill: "bg-mint" },
  4: { label: "authStrengthGreat", fill: "bg-mint" },
};

/**
 * El medidor de la contraseña: cuatro celdas del panal que se van llenando.
 *
 * Es una pista mientras se escribe, no una regla: lo único que bloquea es la
 * longitud mínima, que dice `validateNewPassword`. Habla en palabras además
 * de en color, porque el color solo no lo distingue todo el mundo.
 */
export default function PasswordStrength({ password }: { password: string }) {
  const { t } = useLanguage();
  const score = passwordStrength(password);
  if (score === 0) return null;

  const level = LEVELS[score];

  return (
    <div className="mt-3 flex items-center gap-3 px-1" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((cell) => (
          <span
            key={cell}
            className={`hex-cell inline-block h-6 w-5 transition-colors duration-300 ${
              cell <= score ? level.fill : "bg-ink/10"
            }`}
          />
        ))}
      </div>
      <p className="text-sm font-extrabold text-ink/70">
        {t("authStrength", { level: t(level.label) })}
      </p>
    </div>
  );
}
