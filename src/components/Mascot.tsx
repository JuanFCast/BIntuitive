"use client";

import { useLanguage } from "@/lib/i18n";

type MascotExpression = "normal" | "feliz" | "pista";

type MascotProps = {
  expression?: MascotExpression;
  size?: number;
  className?: string;
};

/**
 * Abejita guía "Bee": redonda, tierna y con ojos grandes.
 * Cambia la boca y las alas según la expresión.
 */
export default function Mascot({
  expression = "normal",
  size = 120,
  className = "",
}: MascotProps) {
  const { t } = useLanguage();
  const happy = expression === "feliz";
  const hint = expression === "pista";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={
        happy
          ? t("mascotHappyAria")
          : hint
            ? t("mascotHintAria")
            : t("mascotNormalAria")
      }
      className={className}
    >
      {/* Alas */}
      <g className={happy ? "animate-wiggle" : ""} style={{ transformOrigin: "60px 40px" }}>
        <ellipse cx="38" cy="32" rx="16" ry="22" fill="#cfeeff" opacity="0.9" transform="rotate(-25 38 32)" />
        <ellipse cx="82" cy="32" rx="16" ry="22" fill="#cfeeff" opacity="0.9" transform="rotate(25 82 32)" />
      </g>
      {/* Cuerpo */}
      <circle cx="60" cy="68" r="42" fill="#ffd93d" stroke="#3b3355" strokeWidth="3" />
      {/* Rayas */}
      <path d="M 24 82 Q 60 96 96 82 L 94 90 Q 60 102 26 90 Z" fill="#3b3355" />
      <path d="M 22 66 Q 60 78 98 66 L 98 74 Q 60 86 22 74 Z" fill="#3b3355" />
      {/* Antenas */}
      <path d="M 46 30 Q 42 18 34 14" fill="none" stroke="#3b3355" strokeWidth="3" strokeLinecap="round" />
      <path d="M 74 30 Q 78 18 86 14" fill="none" stroke="#3b3355" strokeWidth="3" strokeLinecap="round" />
      <circle cx="33" cy="13" r="4" fill="#ff8a80" />
      <circle cx="87" cy="13" r="4" fill="#ff8a80" />
      {/* Ojos */}
      {hint ? (
        <>
          {/* Guiño: un ojo cerrado */}
          <path d="M 38 56 Q 45 50 52 56" fill="none" stroke="#3b3355" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="75" cy="56" r="8" fill="#3b3355" />
          <circle cx="78" cy="53" r="2.8" fill="white" />
        </>
      ) : (
        <>
          <circle cx="45" cy="56" r="8" fill="#3b3355" />
          <circle cx="48" cy="53" r="2.8" fill="white" />
          <circle cx="75" cy="56" r="8" fill="#3b3355" />
          <circle cx="78" cy="53" r="2.8" fill="white" />
        </>
      )}
      {/* Mejillas */}
      <circle cx="34" cy="68" r="5" fill="#ffb3ab" opacity="0.7" />
      <circle cx="86" cy="68" r="5" fill="#ffb3ab" opacity="0.7" />
      {/* Boca */}
      {happy ? (
        <path d="M 46 72 Q 60 88 74 72 Z" fill="#3b3355" />
      ) : (
        <path d="M 48 74 Q 60 82 72 74" fill="none" stroke="#3b3355" strokeWidth="3.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
