import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IS_STORE_BUILD } from "@/lib/buildTarget";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Recover your password · BIntuitive",
};

export default function ForgotPasswordPage() {
  // En la tienda las cuentas no se enseñan: ver `buildTarget.ts`.
  if (IS_STORE_BUILD) notFound();
  return <ForgotPasswordClient />;
}
