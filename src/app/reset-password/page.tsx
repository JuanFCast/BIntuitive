import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IS_STORE_BUILD } from "@/lib/buildTarget";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Choose a new password · BIntuitive",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  // En la tienda las cuentas no se enseñan: ver `buildTarget.ts`.
  if (IS_STORE_BUILD) notFound();
  return <ResetPasswordClient />;
}
