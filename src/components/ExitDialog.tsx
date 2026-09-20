"use client";

import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";
import { useLanguage, type MessageKey } from "@/lib/i18n";

/**
 * Qué se está abandonando. Las dos superficies de juego pierden lo mismo —la
 * sesión en curso— pero no se llaman igual delante del niño: la ruta de
 * preguntas es una lección y los juegos independientes son una partida.
 */
export type ExitVariant = "lesson" | "game";

const COPY = {
  lesson: {
    aria: "exitDialogAria",
    title: "exitTitle",
    message: "exitMessage",
    confirm: "leaveLesson",
  },
  game: {
    aria: "exitGameDialogAria",
    title: "exitGameTitle",
    message: "exitGameMessage",
    confirm: "leaveGame",
  },
} satisfies Record<ExitVariant, Record<string, MessageKey>>;

type ExitDialogProps = {
  open: boolean;
  /** Por defecto la lección, que es quien estrenó este diálogo. */
  variant?: ExitVariant;
  onClose: () => void;
};

/**
 * Confirmación al abandonar una sesión en curso. El destino es siempre el
 * panal; lo único que cambia entre superficies son los textos, que salen de la
 * tabla de arriba.
 *
 * El diálogo lo pone `ConfirmDialog`, el único modal de la aplicación, así que
 * responde a Escape y devuelve el foco a lo que lo abrió.
 */
export default function ExitDialog({
  open,
  variant = "lesson",
  onClose,
}: ExitDialogProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const copy = COPY[variant];

  return (
    <ConfirmDialog
      open={open}
      ariaLabel={t(copy.aria)}
      title={t(copy.title)}
      description={t(copy.message)}
      confirmLabel={t(copy.confirm)}
      cancelLabel={`⬅️ ${t("continuePlaying")}`}
      onConfirm={() => router.push("/")}
      onCancel={onClose}
    />
  );
}
