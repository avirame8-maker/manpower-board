"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardDump } from "@/lib/types";
import { SheetTable } from "./SheetTable";

export function BoardApp({ initial }: { initial: BoardDump }) {
  const router = useRouter();
  const [board, setBoard] = useState(initial);
  const [tab, setTab] = useState(initial.sheets[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const sheet = board.sheets.find((s) => s.id === tab) ?? board.sheets[0];

  const filtered = useMemo(() => {
    if (!sheet) return sheet;
    if (!query.trim()) return sheet;
    const q = query.trim();
    const keep = new Set<number>();
    sheet.rows.forEach((r, i) => {
      if (i === 0 || r.some((c) => c.includes(q))) keep.add(i);
    });
    return {
      ...sheet,
      rows: sheet.rows.map((r, i) => (keep.has(i) ? r : r.map(() => ""))),
      hiddenRows: sheet.rows.map((_, i) => !keep.has(i)),
    };
  }, [sheet, query]);

  async function setCell(row: number, col: number, value: string) {
    if (!sheet) return;
    const key = `${sheet.id}:${row}:${col}`;
    setBusyKey(key);
    setStatus("");
    const prev = board;
    setBoard((cur) => {
      const sheets = cur.sheets.map((s) => {
        if (s.id !== sheet.id) return s;
        const rows = s.rows.map((r, ri) =>
          ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r,
        );
        return { ...s, rows };
      });
      return { ...cur, sheets };
    });
    try {
      const res = await fetch("/api/sync/push-cell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId: sheet.id, row, col, value }),
      });
      const data = (await res.json()) as { board?: BoardDump; error?: string };
      if (!res.ok || !data.board) {
        setBoard(prev);
        setStatus(data.error || "עדכון התא נכשל");
        return;
      }
      setBoard(data.board);
    } catch {
      setBoard(prev);
      setStatus("שגיאת רשת בעדכון תא");
    } finally {
      setBusyKey(null);
    }
  }

  async function refresh() {
    setRefreshing(true);
    setStatus("");
    try {
      const res = await fetch("/api/sync/pull", { method: "POST" });
      const data = (await res.json()) as {
        board?: BoardDump;
        sheetsApi?: string;
        error?: string;
      };
      if (!res.ok || !data.board) {
        setStatus(data.error || "הרענון נכשל");
        return;
      }
      setBoard(data.board);
      setStatus(
        data.sheetsApi === "todo"
          ? "רוען מהעותק המקומי (סנכרון Sheets עדיין לא פעיל)"
          : "עודכן",
      );
    } catch {
      setStatus("שגיאת רשת ברענון");
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-extrabold text-emerald-300">
              מ״ה
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none sm:text-lg">
                {board.title}
              </h1>
              <p className="mt-1 text-[11px] text-zinc-500">
                עותק מקומי · {new Date(board.pulledAt).toLocaleString("he-IL")}
              </p>
            </div>
          </div>
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש בגיליון…"
              className="w-40 rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400/40 sm:w-56"
            />
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {refreshing ? "מרענן…" : "רענון"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              יציאה
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
          {board.sheets.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setTab(s.id);
                setQuery("");
              }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                s.id === sheet?.id
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {s.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-3 py-4 sm:px-5">
        {status ? (
          <p className="mb-3 text-sm text-zinc-400">{status}</p>
        ) : null}
        {filtered ? (
          <SheetTable
            sheet={filtered}
            names={board.names}
            busyKey={busyKey}
            onSetCell={setCell}
          />
        ) : (
          <p className="text-zinc-500">אין גיליון להצגה</p>
        )}
      </main>
    </div>
  );
}
