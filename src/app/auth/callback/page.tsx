import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IS_STORE_BUILD } from "@/lib/buildTarget";
import AuthCallbackClient from "./AuthCallbackClient";

export const metadata: Metadata = {
  title: "Welcome · BIntuitive",
  robots: { index: false },
};

export default function AuthCallbackPage() {
  // En la tienda las cuentas no se enseñan: ver `buildTarget.ts`.
  if (IS_STORE_BUILD) notFound();
  return <AuthCallbackClient />;
}
