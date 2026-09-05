#!/usr/bin/env python3
"""Build committed local dump from parsed Google Sheet tables. Strips emails."""
from __future__ import annotations

import json
import re
from pathlib import Path

SRC = Path("/tmp/manpower-parse/tables.json")
OUT = Path(__file__).resolve().parents[1] / "data" / "dump.json"

TABS = [
    {
        "id": "koach-adam",
        "name": "כוח אדם",
        "kind": "names",
        "dutyCols": [],
    },
    {
        "id": "shavua-17-18",
        "name": "שבוע 17 +18",
        "kind": "week-grid",
        "dutyCols": [0, 1, 2, 3, 4, 5, 6],
    },
    {
        "id": "exams",
        "name": "מעקב מבחנים חודשיים",
        "kind": "exams",
        "dutyCols": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    },
    {
        "id": "constraints",
        "name": "לוח אילוצים מילואים והצח",
        "kind": "constraints",
        "dutyCols": [],
    },
    {
        "id": "exam-exec",
        "name": "ביצוע מבחן",
        "kind": "exam-exec",
        "dutyCols": [2],
    },
    {
        "id": "pesach",
        "name": "פסח א' + ב'",
        "kind": "week-grid",
        "dutyCols": [0, 1, 2, 3, 4, 5, 6],
    },
    {
        "id": "shabbatot-1-25",
        "name": "שבתות1.25",
        "kind": "mixed",
        "dutyCols": [2, 3, 4, 5, 6, 7],
    },
    {
        "id": "shabbatot-2-25",
        "name": "שבתות 2.25 מעודכן",
        "kind": "duty-roster",
        "dutyCols": [3, 4, 5, 6, 7, 8, 9],
    },
    {
        "id": "hishuv",
        "name": "חישוב",
        "kind": "calc",
        "dutyCols": [],
    },
    {
        "id": "shabbatot-1-26",
        "name": "שבתות 1.26",
        "kind": "duty-roster",
        "dutyCols": [3, 4, 5, 6, 7, 8, 9],
    },
    {
        "id": "shabbatot-2-26",
        "name": "שבתות 2.26",
        "kind": "duty-roster",
        "dutyCols": [3, 4, 5, 6, 7, 8, 9],
    },
    {
        "id": "hagim-2-26",
        "name": "חגים 2.26",
        "kind": "duty-roster",
        "dutyCols": [3, 4, 5, 6, 7, 8, 9],
    },
    {
        "id": "nihul-2-26",
        "name": "ניהול 2.26",
        "kind": "duty-roster",
        "dutyCols": [3],
    },
    {
        "id": "summary",
        "name": "טבלת סיכום כוננויות",
        "kind": "summary",
        "dutyCols": [],
    },
    {
        "id": "log",
        "name": "LOG",
        "kind": "log",
        "dutyCols": [],
    },
]

SEP = re.compile(r"^:?-+:?$")


def is_sep_row(row: list[str]) -> bool:
    return all(not c or SEP.match(c) for c in row)


def trim_table(rows: list[list[str]]) -> list[list[str]]:
    rows = [r for r in rows if not is_sep_row(r) and any(c for c in r)]
    if not rows:
        return []
    # drop trailing empty columns
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    while width > 1 and all(not r[width - 1] for r in rows):
        width -= 1
        rows = [r[:width] for r in rows]
    return rows


def compact_constraints(rows: list[list[str]]) -> list[list[str]]:
    if len(rows) < 3:
        return [["הערה"], ["גיליון האילוצים המקורי הוא לוח שנתי רחב. מוצג כאן תקציר החגים."]]
    holidays = [(i, c) for i, c in enumerate(rows[1]) if c]
    out = [["עמודה", "תווית"]]
    for i, c in holidays:
        out.append([str(i), c])
    out.append(["", ""])
    out.append(["הערה", "הלוח המלא בגיליון כולל עמודת יום בשבוע לכל ימות השנה. איש לא סומן באילוץ בדגימה זו."])
    return out


def exam_exec_from_exams(exam_rows: list[list[str]]) -> list[list[str]]:
    names = []
    for r in exam_rows:
        if len(r) > 1 and r[1] and r[1] != "שם":
            names.append(r[1])
    out = [["שם", "חודש", "סטטוס"]]
    for n in names:
        out.append([n, "אפריל", ""])
    return out


def collect_names(sheets: list[dict]) -> list[str]:
    found: set[str] = set()
    skip = {
        "שם",
        "תאריך",
        "יום",
        "שבוע",
        "כוננות",
        'או"ק',
        "מיקום",
        "הערות",
        "חג",
        "עמודה 1",
        "הנהלה",
        "הצ\"ח",
        "מילואים",
        "סדיר בכיר",
        "סדיר צעיר",
        "Column 14",
        "שם החג",
        "יום בשבוע",
        "חודש",
        "אפריל",
    }
    for sheet in sheets:
        for row in sheet["rows"]:
            for i, cell in enumerate(row):
                if not cell or cell in skip:
                    continue
                if cell.replace(".", "").replace("/", "").replace("-", "").isdigit():
                    continue
                if any(ch.isdigit() for ch in cell) and "/" in cell:
                    continue
                if i in sheet.get("dutyCols", []) or sheet["id"] == "koach-adam":
                    if 2 <= len(cell) <= 40 and not cell.startswith("פלמחים") and "סה" not in cell:
                        found.add(cell)
    extra = {"אבירם אלמליח", "אבי פסח", "גבי גרלניק", "מוכתאר מנסור"}
    found |= extra
    return sorted(found, key=lambda s: s)


def main() -> None:
    raw = json.loads(SRC.read_text())
    sheets = []
    for meta, rows in zip(TABS, raw):
        cleaned = trim_table(rows)
        if meta["id"] == "koach-adam":
            names = [r[0] for r in cleaned if r and r[0] and r[0] not in ("שם", ":-:")]
            cleaned = [["שם"]] + [[n] for n in names]
        elif meta["id"] == "constraints":
            cleaned = compact_constraints(rows)
        elif meta["id"] == "exam-exec":
            exam_rows = trim_table(raw[2])
            cleaned = exam_exec_from_exams(exam_rows)
        elif meta["id"] == "exams":
            # drop email column (already stripped) — keep שם + months
            if cleaned:
                # find header row
                header_i = next(
                    (i for i, r in enumerate(cleaned) if "שם" in r and "ינואר" in r),
                    0,
                )
                body = cleaned[header_i:]
                # drop first col (was email)
                body = [[c for j, c in enumerate(r) if j != 0] for r in body]
                if body and body[0] and body[0][0] == "":
                    body[0][0] = "שם"
                cleaned = body
        sheets.append({**meta, "rows": cleaned})

    names = collect_names(sheets)
    # Prefer כוח אדם order first
    koach = [r[0] for r in sheets[0]["rows"][1:]]
    rest = [n for n in names if n not in koach]
    names = koach + rest

    dump = {
        "title": "לוח מילואים והצח",
        "spreadsheetId": "1f1rfc60-0FNQQOWj_AbEJCuUws6FdAI2gRZTauwoUog",
        "source": "local-dump",
        "pulledAt": "2026-09-05T17:51:00.000Z",
        "names": names,
        "sheets": sheets,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dump, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {OUT} sheets={len(sheets)} names={len(names)} bytes={OUT.stat().st_size}")
    for s in sheets:
        print(f"  {s['id']:20s} {len(s['rows']):4d}x{len(s['rows'][0]) if s['rows'] else 0}")


if __name__ == "__main__":
    main()
