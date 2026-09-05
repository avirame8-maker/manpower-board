"use client";

import { useState } from "react";
import type { SheetDump } from "@/lib/types";

type Props = {
  sheet: SheetDump;
  names: string[];
  busyKey: string | null;
  onSetCell: (row: number, col: number, value: string) => void;
};

function isHeaderRow(rowIndex: number, sheet: SheetDump): boolean {
  if (rowIndex === 0) return true;
  if (sheet.kind === "week-grid" && rowIndex <= 3) return true;
  return false;
}

export function SheetTable({ sheet, names, busyKey, onSetCell }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const duty = new Set(sheet.dutyCols);
  const width = Math.max(1, ...sheet.rows.map((r) => r.length));

  return (
    <div className="overflow-auto rounded-xl border border-white/10 bg-ink-900/70">
      <table className="min-w-full border-collapse text-right text-[13px]">
        <tbody>
          {sheet.rows.map((row, ri) =>
            sheet.hiddenRows?.[ri] ? null : (
            <tr key={ri} className={ri % 2 === 1 ? "bg-white/[0.02]" : undefined}>
              {Array.from({ length: width }, (_, ci) => {
                const value = row[ci] ?? "";
                const isDuty = duty.has(ci) && !isHeaderRow(ri, sheet);
                const key = `${sheet.id}:${ri}:${ci}`;
                const editing = open === key;
                return (
                  <td
                    key={ci}
                    className={`whitespace-nowrap border border-white/5 px-2 py-1.5 align-middle ${
                      isHeaderRow(ri, sheet)
                        ? "sticky top-0 z-10 bg-ink-800 font-semibold text-emerald-200"
                        : ""
                    } ${ci === 0 ? "sticky right-0 z-[11] bg-ink-900 font-medium" : ""} ${
                      isDuty && !value ? "bg-emerald-500/[0.04]" : ""
                    }`}
                  >
                    {isDuty ? (
                      <div className="flex min-w-[8.5rem] items-center gap-1">
                        {value && !editing ? (
                          <>
                            <span className="flex-1">{value}</span>
                            <button
                              type="button"
                              title="נקה"
                              disabled={busyKey === key}
                              onClick={() => onSetCell(ri, ci, "")}
                              className="rounded px-1 text-xs text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <select
                            className="w-full rounded-md border border-white/10 bg-ink-950 px-1 py-1 text-[13px] outline-none focus:border-emerald-400/50"
                            value={value}
                            disabled={busyKey === key}
                            onFocus={() => setOpen(key)}
                            onBlur={() => setOpen(null)}
                            onChange={(e) => {
                              onSetCell(ri, ci, e.target.value);
                              setOpen(null);
                            }}
                          >
                            <option value="">בחירת שם…</option>
                            {names.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-200">{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
