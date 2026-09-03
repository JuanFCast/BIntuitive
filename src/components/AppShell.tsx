"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import ViewportRecovery from "./ViewportRecovery";

const primaryRoutes = new Set(["/hexagons", "/progress", "/profile"]);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrimaryRoute = primaryRoutes.has(pathname);

  if (!isPrimaryRoute) return children;

  return (
    <div className="app-shell">
      {/* Solo aquí: nunca sobre una partida en curso. */}
      <ViewportRecovery />
      <AppHeader />
      <div className="app-shell-content">{children}</div>
      <BottomNavigation />
    </div>
  );
}
