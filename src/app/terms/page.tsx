import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { TERMS } from "@/data/legal";

export const metadata: Metadata = {
  title: "Terms of Use · BIntuitive",
  description: "The terms that apply when you use BIntuitive.",
};

// Pública también en el build de tienda, como la política de privacidad.
export default function TermsPage() {
  return <LegalPage documents={TERMS} />;
}
