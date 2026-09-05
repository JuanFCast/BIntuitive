"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";

// El panal ("/") y su dirección anterior, que sigue sirviendo la misma
// pantalla: las dos llevan marco de aplicación.
const primaryRoutes = new Set(["/", "/hexagons", "/progress", "/profile"]);

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
