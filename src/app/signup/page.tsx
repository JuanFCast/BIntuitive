import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IS_STORE_BUILD } from "@/lib/buildTarget";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Create an account · BIntuitive",
};

export default function SignUpPage() {
  // En la tienda las cuentas no se enseñan: ver `buildTarget.ts`.
  if (IS_STORE_BUILD) notFound();
  return <SignUpClient />;
}
