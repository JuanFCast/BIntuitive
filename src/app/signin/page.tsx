import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IS_STORE_BUILD } from "@/lib/buildTarget";
import SignInClient from "./SignInClient";

export const metadata: Metadata = {
  title: "Sign in · BIntuitive",
};

export default function SignInPage() {
  // En la tienda las cuentas no se enseñan: ver `buildTarget.ts`.
  if (IS_STORE_BUILD) notFound();
  return <SignInClient />;
}
