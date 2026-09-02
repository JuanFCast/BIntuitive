"use client";

import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";
import { useLanguage } from "@/lib/i18n";

type ExitDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Confirmación al salir de una lección en curso. Los textos y el destino son
 * los de siempre; lo que cambia es que el diálogo lo pone `ConfirmDialog`, así
 * que ahora también responde a Escape y devuelve el foco al cerrarse.
 */
export default function ExitDialog({ open, onClose }: ExitDialogProps) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <ConfirmDialog
      open={open}
      ariaLabel={t("exitDialogAria")}
      title={t("exitTitle")}
      description={t("exitMessage")}
      confirmLabel={t("leaveLesson")}
      cancelLabel={`⬅️ ${t("continuePlaying")}`}
      onConfirm={() => router.push("/hexagons")}
      onCancel={onClose}
    />
  );
}
