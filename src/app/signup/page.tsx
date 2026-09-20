import type { Metadata } from "next";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Create an account · BIntuitive",
};

export default function SignUpPage() {
  return <SignUpClient />;
}
