function parseAllowedEmails(): Set<string> {
  return new Set(
    (process.env.ALLOWED_EMAILS ?? "")
      .split(/[,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedEmail(email: string): boolean {
  return parseAllowedEmails().has(email.trim().toLowerCase());
}

export function isValidPassword(password: string): boolean {
  const expected = process.env.PREVIEW_PASSWORD ?? "";
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  let out = 0;
  for (let i = 0; i < password.length; i++) {
    out |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return out === 0;
}

export type LoginInput = {
  email?: string;
  password?: string;
};

export function authenticate(
  input: LoginInput,
): { ok: true; via: "email" | "password"; email?: string } | { ok: false; error: string } {
  const email = input.email?.trim() ?? "";
  const password = input.password ?? "";

  if (email && isAllowedEmail(email)) {
    return { ok: true, via: "email", email: email.toLowerCase() };
  }
  if (password && isValidPassword(password)) {
    return { ok: true, via: "password" };
  }
  if (email && !password) {
    return { ok: false, error: "האימייל אינו ברשימת ההרשאות" };
  }
  if (password && !email) {
    return { ok: false, error: "סיסמה שגויה" };
  }
  return { ok: false, error: "יש להזין אימייל מורשה או סיסמה משותפת" };
}
