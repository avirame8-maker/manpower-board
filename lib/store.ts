import { promises as fs } from "fs";
import path from "path";
import type { BoardDump, CellUpdate } from "./types";

const COMMITTED_DUMP = path.join(process.cwd(), "data", "dump.json");

function writableRoot(): string {
  if (process.env.VERCEL) return "/tmp/manpower-board";
  return path.join(process.cwd(), "data");
}

function overridesPath(): string {
  return path.join(writableRoot(), "overrides.json");
}

function queueDir(): string {
  return path.join(writableRoot(), "queue");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function readCommittedDump(): Promise<BoardDump> {
  const raw = await fs.readFile(COMMITTED_DUMP, "utf8");
  return JSON.parse(raw) as BoardDump;
}

export async function readOverrides(): Promise<CellUpdate[]> {
  return readJson<CellUpdate[]>(overridesPath(), []);
}

export function applyOverrides(dump: BoardDump, overrides: CellUpdate[]): BoardDump {
  const sheets = dump.sheets.map((s) => ({
    ...s,
    rows: s.rows.map((r) => [...r]),
  }));
  const byId = new Map(sheets.map((s) => [s.id, s]));
  for (const u of overrides) {
    const sheet = byId.get(u.sheetId);
    if (!sheet) continue;
    if (u.row < 0 || u.col < 0) continue;
    while (sheet.rows.length <= u.row) {
      const width = sheet.rows[0]?.length ?? u.col + 1;
      sheet.rows.push(Array.from({ length: width }, () => ""));
    }
    const row = sheet.rows[u.row];
    while (row.length <= u.col) row.push("");
    row[u.col] = u.value;
  }
  return { ...dump, sheets };
}

export async function getBoard(): Promise<BoardDump> {
  const dump = await readCommittedDump();
  const overrides = await readOverrides();
  return applyOverrides(dump, overrides);
}

export async function pushCell(update: CellUpdate): Promise<BoardDump> {
  await ensureDir(writableRoot());
  await ensureDir(queueDir());
  const overrides = await readOverrides();
  const next = overrides.filter(
    (u) =>
      !(u.sheetId === update.sheetId && u.row === update.row && u.col === update.col),
  );
  next.push(update);
  await fs.writeFile(overridesPath(), JSON.stringify(next, null, 2), "utf8");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.writeFile(
    path.join(queueDir(), `${stamp}-${update.sheetId}-${update.row}-${update.col}.json`),
    JSON.stringify({ ...update, at: new Date().toISOString() }, null, 2),
    "utf8",
  );
  return getBoard();
}

export async function pullBoard(): Promise<BoardDump> {
  // Sheets API sync is TODO for v1 — reload the committed local dump + overlays.
  const dump = await getBoard();
  return {
    ...dump,
    source: "local-dump",
    pulledAt: new Date().toISOString(),
  };
}
