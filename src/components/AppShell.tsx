"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import { useResumeKey } from "@/lib/resumeKey";

const primaryRoutes = new Set(["/hexagons", "/progress", "/profile"]);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrimaryRoute = primaryRoutes.has(pathname);

  if (!isPrimaryRoute) return children;

  return <ShellFrame>{children}</ShellFrame>;
}

/**
 * El marco de las pantallas principales.
 *
 * Va aparte de `AppShell` a propósito: así su estado y sus escuchas solo
 * existen en Explore, Progress y Profile. Una ruta de juego ni siquiera monta
 * este componente, y por eso nada de lo que ocurra aquí puede tocar una
 * partida en curso.
 *
 * El encabezado y la barra inferior llevan una `key` que cambia al volver del
 * segundo plano, así que React los desmonta y crea nodos nuevos. Es la forma
 * de conseguir que WebKit reconstruya desde cero las capas `sticky` que
 * restaura mal, sin recargar la página. El contenido no lleva `key`: no se
 * remonta, así que ni la pantalla ni sus datos se pierden.
 */
function ShellFrame({ children }: { children: ReactNode }) {
  const resumeKey = useResumeKey();

  return (
    <div className="app-shell">
      <AppHeader key={`header-${resumeKey}`} />
      <div className="app-shell-content">{children}</div>
      <BottomNavigation key={`navigation-${resumeKey}`} />
    </div>
  );
}
