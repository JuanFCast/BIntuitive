import { Suspense } from "react";
import GameClient from "./GameClient";

export const metadata = {
  title: "¡A jugar! · BeeSmart",
};

export default function GamePage() {
  return (
    <Suspense fallback={null}>
      <GameClient />
    </Suspense>
  );
}
