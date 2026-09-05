import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import {
  cookieOptions,
  SESSION_COOKIE,
  sessionExpiry,
  signSession,
} from "@/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string } = {};
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const result = authenticate({
    email: body.email,
    password: body.password,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const token = await signSession({
    v: 1,
    via: result.via,
    email: result.email,
    exp: sessionExpiry(),
  });

  const res = NextResponse.json({
    ok: true,
    via: result.via,
    email: result.email ?? null,
  });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions());
  return res;
}
