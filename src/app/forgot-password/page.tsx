import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Recover your password · BIntuitive",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
