import { LoginForm } from "@/components/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-lg font-bold text-emerald-300">
            מ״ה
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            לוח מילואים והצח
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            כניסה עם אימייל מורשה או סיסמה משותפת
          </p>
        </div>
        <LoginForm nextPath={searchParams.next || "/"} />
      </div>
    </main>
  );
}
