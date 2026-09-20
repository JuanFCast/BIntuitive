"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import { APP_FRAME_ROUTES } from "@/lib/routes";

// El marco de la aplicación: el panal, su dirección anterior —que sigue
// sirviendo la misma pantalla— y las otras dos pestañas.
//
// La raíz ya no está en la lista: es la portada pública, y una portada con la
// barra de navegación debajo invitaría a moverse por dentro de algo en lo que
// todavía no se ha entrado. Las pantallas de cuenta tampoco la llevan.
const primaryRoutes = new Set<string>(APP_FRAME_ROUTES);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrimaryRoute = primaryRoutes.has(pathname);

  if (!isPrimaryRoute) return children;

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-shell-content">{children}</div>
      <BottomNavigation />
    </div>
  );
}
