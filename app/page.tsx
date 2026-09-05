import { BoardApp } from "@/components/BoardApp";
import { getBoard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const board = await getBoard();
  return <BoardApp initial={board} />;
}
