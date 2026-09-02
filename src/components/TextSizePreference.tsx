"use client";

import { useEffect } from "react";
import { useTextSize } from "@/lib/preferences";

/**
 * Lleva la preferencia de tamaño de texto al documento. No pinta nada: solo
 * pone `data-text-size` en `<html>`, que es lo que activa la escala de los
 * tokens tipográficos definida en `globals.css`.
 *
 * Va en `<html>` y no en un contenedor porque el tamaño de letra vale también
 * en las rutas de juego, que no pasan por `AppShell`.
 */
export default function TextSizePreference() {
  const textSize = useTextSize();

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  return null;
}
