import { Suspense } from "react";
import GameClient from "./GameClient";

export const metadata = {
  title: "Let's play! · BIntuitive",
};

export default function GamePage() {
  return (
    <Suspense fallback={null}>
      <GameClient />
    </Suspense>
  );
}
