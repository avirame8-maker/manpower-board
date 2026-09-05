import { NextResponse } from "next/server";
import { pullBoard } from "@/lib/store";

export async function POST() {
  // Google Sheets API pull is TODO for v1 — reload the committed local dump.
  const board = await pullBoard();
  return NextResponse.json({
    ok: true,
    sheetsApi: "todo",
    board,
  });
}

export async function GET() {
  const board = await pullBoard();
  return NextResponse.json({ ok: true, sheetsApi: "todo", board });
}
