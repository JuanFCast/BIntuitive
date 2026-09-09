"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import type { Language } from "@/lib/language";
import {
  ensureProfile,
  getAvatar,
  PROFILE_AVATARS,
  PROFILE_NAME_MAX_LENGTH,
  saveProfile,
  today,
  type Profile,
} from "@/lib/profile";
import { clearProgress, getProgress, type Progress } from "@/lib/storage";

/**
 * Perfil: quién juega en este dispositivo.
 *
 * Aquí no hay preferencias. Idioma, sonido y tamaño de texto se editan en el
 * menú de la cabecera, que está en todas las pantallas; repetirlas aquí solo
 * las duplicaba, y una lista de solo lectura de lo que ya se ve arriba no es
 * información, es ruido.
 *
 * Tampoco hay cuenta que gestionar, y la pantalla lo dice en vez de callarlo:
 * sin servidor no hay correo ni contraseña que valgan, así que el nombre y el
 * avatar viven en este navegador (`src/lib/profile.ts`) y el resumen sale del
 * progreso que ya estaba guardado. El día que existan cuentas, la tarjeta de
 * "Cuenta" es el sitio donde entra iniciar sesión.
 */
export default function ProfileClient() {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [editing, setEditing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // La primera sesión guardada es anterior a esta pantalla: quien ya jugaba
    // estrena su perfil con esa fecha y no con la de hoy.
    const saved = getProgress();
    setProgress(saved);
    setProfile(ensureProfile(saved.sessions[0]?.date.slice(0, 10) ?? today()));
  }, []);

  const commit = (next: Profile) => {
    saveProfile(next);
    setProfile(next);
  };

  // Cerrar el editor devuelve el foco al botón que lo abrió, como hacen los
  // diálogos: el editor sustituye a ese botón, y sin esto el foco se queda en
  // el aire para quien navega con teclado.
  const closeEditor = () => {
    setEditing(false);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  if (!profile || !progress) {
    return (
      <ProfileLayout t={t}>
        <div className="h-44 animate-pulse rounded-3xl bg-white/60" />
      </ProfileLayout>
    );
  }

  const avatar = getAvatar(profile.avatarId);

  return (
    <ProfileLayout t={t}>
      <header className="text-center">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-sun bg-sunsoft text-5xl shadow-sm"
          aria-hidden="true"
        >
          {avatar.emoji}
        </div>
        <h1 className="mt-3 break-words text-4xl font-extrabold leading-tight sm:text-5xl">
          {profile.name || t("profileNamePlaceholder")}
        </h1>
        <p className="mt-2 text-base font-semibold text-ink/60 sm:text-lg">
          {t("profileSince", { date: formatSince(profile.since, language) })}
        </p>
        {!editing && (
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => setEditing(true)}
            className="mt-4 min-h-12 rounded-2xl border-2 border-ink/15 bg-white px-6 text-base font-extrabold text-ink shadow-sm active:scale-95"
          >
            {t("profileEdit")}
          </button>
        )}
      </header>

      {editing && (
        <ProfileEditor
          profile={profile}
          onSave={(next) => {
            commit(next);
            closeEditor();
          }}
          onCancel={closeEditor}
        />
      )}

      {/*
        Dos números y nada más: estrellas y lecciones son las métricas de las
        lecciones de preguntas, las únicas que se guardan enteras. El detalle
        —nivel por actividad, mejores marcas, últimas sesiones— ya tiene su
        pantalla, y el enlace lleva allí en vez de copiarla aquí.
      */}
      <Section title={t("profileSummary")} id="summary-heading">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            emoji="⭐"
            value={progress.totalStars}
            label={t("profileStatStars")}
          />
          <Stat
            emoji="📚"
            value={progress.sessions.length}
            label={t("profileStatLessons")}
          />
        </div>
        <Link
          href="/progress"
          className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm active:scale-95"
        >
          {t("profileSeeProgress")}
        </Link>
      </Section>

      <Section title={t("profileAccount")} id="account-heading">
        <div className="rounded-3xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
          <p className="flex items-center gap-2 text-lg font-extrabold">
            <span aria-hidden="true">🔒</span>
            {t("profileAccountTitle")}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-ink/55">
            {t("profileAccountText")}
          </p>
        </div>
      </Section>

      {/*
        Al final y aparte: borrar el progreso no es una acción del día a día.
        No se lleva el perfil por delante, que vive en su propia clave.
      */}
      <Section title={t("profileData")} id="data-heading">
        <div className="rounded-3xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-semibold leading-snug text-ink/55">
            {t("profileResetDescription")}
          </p>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="mt-3 min-h-12 w-full rounded-2xl border-2 border-coral bg-white px-4 text-base font-extrabold text-ink transition-colors active:bg-coralsoft sm:w-auto sm:px-6"
          >
            {t("profileReset")}
          </button>
        </div>
      </Section>

      <ConfirmDialog
        open={resetOpen}
        ariaLabel={t("resetDialogAria")}
        title={t("resetDialogTitle")}
        description={t("resetDialogMessage")}
        confirmLabel={t("profileReset")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          clearProgress();
          setProgress(getProgress());
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </ProfileLayout>
  );
}

/**
 * El editor se abre en su sitio, debajo de la cabecera, y no en un diálogo:
 * cambiar de nombre no es una confirmación, y `ConfirmDialog` es el único
 * modal de la aplicación.
 */
function ProfileEditor({
  profile,
  onSave,
  onCancel,
}: {
  profile: Profile;
  onSave: (next: Profile) => void;
  onCancel: () => void;
}) {
  const { language, t } = useLanguage();
  const [name, setName] = useState(profile.name);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const nameRef = useRef<HTMLInputElement>(null);

  // El editor ocupa el sitio del botón que lo abrió, así que hereda su foco.
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <form
      className="mt-5 rounded-3xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...profile, name: name.trim(), avatarId });
      }}
    >
      <label
        className="block px-1 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45"
        htmlFor="profile-name"
      >
        {t("profileNameLabel")}
      </label>
      <input
        ref={nameRef}
        id="profile-name"
        type="text"
        value={name}
        maxLength={PROFILE_NAME_MAX_LENGTH}
        autoComplete="off"
        placeholder={t("profileNamePlaceholder")}
        onChange={(event) => setName(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-2xl border-2 border-ink/15 bg-cream px-4 text-lg font-extrabold text-ink outline-none focus:border-sun"
      />

      <p
        className="mt-4 px-1 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45"
        id="avatar-label"
      >
        {t("profileAvatarLabel")}
      </p>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-labelledby="avatar-label"
      >
        {PROFILE_AVATARS.map((option) => {
          const selected = option.id === avatarId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setAvatarId(option.id)}
              aria-pressed={selected}
              aria-label={option.name[language]}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-3xl transition-transform active:scale-90 ${
                selected ? "border-sun bg-sunsoft" : "border-ink/10 bg-cream"
              }`}
            >
              <span aria-hidden="true">{option.emoji}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="submit"
          className="min-h-12 rounded-2xl border-b-8 border-b-[#d9a600] bg-sun px-6 text-base font-extrabold text-ink active:scale-95 active:border-b-4 sm:px-8"
        >
          {t("profileSave")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-2xl border-2 border-ink/15 bg-white px-6 text-base font-extrabold text-ink active:scale-95 sm:px-8"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

function ProfileLayout({
  t,
  children,
}: {
  t: (key: MessageKey) => string;
  children: React.ReactNode;
}) {
  return (
    <main
      className="min-h-full bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10"
      aria-label={t("profileHeading")}
    >
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </main>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8" aria-labelledby={id}>
      <h2
        id={id}
        className="px-1 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45"
      >
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Stat({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-4 text-center shadow-sm">
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="mt-1 text-3xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-sm font-bold text-ink/55">{label}</p>
    </div>
  );
}

/** Mes y año, no el día: "jugando desde" no necesita más precisión. */
function formatSince(since: string, language: Language): string {
  const date = new Date(`${since}T00:00:00`);
  if (Number.isNaN(date.getTime())) return since;

  return new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}
