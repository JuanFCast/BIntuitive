import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { PRIVACY } from "@/data/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · BIntuitive",
  description: "What information BIntuitive uses, why, and how to delete your account.",
};

// Pública también en el build de tienda: las dos tiendas exigen enlazarla.
export default function PrivacyPage() {
  return <LegalPage documents={PRIVACY} />;
}
