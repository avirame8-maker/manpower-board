import { NextResponse } from "next/server";
import { pushCell } from "@/lib/store";

export async function POST(request: Request) {
  let body: { sheetId?: string; row?: number; col?: number; value?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const sheetId = body.sheetId?.trim() ?? "";
  const row = Number(body.row);
  const col = Number(body.col);
  const value = typeof body.value === "string" ? body.value : "";

  if (!sheetId || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
    return NextResponse.json({ error: "פרטי תא חסרים" }, { status: 400 });
  }

  const board = await pushCell({ sheetId, row, col, value });
  return NextResponse.json({ ok: true, board });
}
