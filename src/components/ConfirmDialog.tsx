"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/lib/focusTrap";

type ConfirmDialogProps = {
  open: boolean;
  /** Nombre accesible del diálogo. */
  ariaLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  /**
   * Marca la acción como irreversible. Cuando lo es, el botón seguro va
   * primero —si alguien pulsa sin leer, lo que encuentra debajo del dedo es
   * cancelar, no borrar— y el de confirmar va en coral lleno en vez de
   * teñido, para que se lea distinto sin llegar a alarma.
   */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Diálogo de confirmación único de la aplicación.
 *
 * Se monta en `document.body`, no donde se escribe. Un diálogo a pantalla
 * completa tiene que medirse contra la ventana, y desde dentro del árbol no
 * siempre puede: basta un antepasado con `filter` o `backdrop-filter` —un
 * encabezado de la aplicación tiene uno— para que `position: fixed` pase a
 * medirse contra ese antepasado en vez de contra la ventana. Además así queda
 * por encima de la barra inferior, que si no seguiría pintada sobre el fondo
 * oscuro y se podría pulsar con el diálogo abierto.
 *
 * Antes solo existía el de salir de una lección; al aparecer el borrado de
 * progreso hacían falta dos, y dos modales son dos comportamientos de foco y
 * de teclado que se separan con el tiempo. Aquí hay uno: se cierra con Escape,
 * el foco entra al panel al abrir y vuelve a donde estaba al cerrar.
 */
export default function ConfirmDialog({
  open,
  ariaLabel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, panelRef, onCancel);

  if (!open) return null;

  const confirm = (
    <button
      key="confirm"
      type="button"
      onClick={onConfirm}
      className={`min-h-14 w-full break-words rounded-full border-b-8 px-4 py-2 text-xl font-extrabold leading-snug text-ink transition-transform active:scale-95 active:border-b-4 sm:px-6 ${
        destructive
          ? "border-coral/70 bg-coral"
          : "border-coral bg-coralsoft"
      }`}
    >
      {confirmLabel}
    </button>
  );

  const cancel = (
    <button
      key="cancel"
      type="button"
      onClick={onCancel}
      className="min-h-14 w-full break-words rounded-full border-b-8 border-mint bg-mintsoft px-4 py-2 text-xl font-extrabold leading-snug text-ink transition-transform active:scale-95 active:border-b-4 sm:px-6"
    >
      {cancelLabel}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/40 px-6 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="animate-pop my-auto w-full max-w-sm rounded-3xl border-4 border-sky bg-white p-6 text-center shadow-2xl outline-none"
      >
        <p className="text-2xl font-extrabold text-ink">{title}</p>
        <p className="mt-2 text-lg font-semibold text-ink/70">{description}</p>
        <div className="mt-5 flex flex-col gap-3">
          {destructive ? [cancel, confirm] : [confirm, cancel]}
        </div>
      </div>
    </div>,
    document.body,
  );
}
