"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";

const primaryRoutes = new Set([
  "/",
  "/hexagons",
  "/games",
  "/progress",
  "/profile",
]);

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
