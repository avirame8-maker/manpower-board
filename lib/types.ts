export type SheetKind =
  | "names"
  | "week-grid"
  | "exams"
  | "constraints"
  | "exam-exec"
  | "mixed"
  | "duty-roster"
  | "calc"
  | "summary"
  | "log";

export type SheetDump = {
  id: string;
  name: string;
  kind: SheetKind;
  dutyCols: number[];
  rows: string[][];
  hiddenRows?: boolean[];
};

export type BoardDump = {
  title: string;
  spreadsheetId: string;
  source: string;
  pulledAt: string;
  names: string[];
  sheets: SheetDump[];
};

export type SessionPayload = {
  v: 1;
  via: "email" | "password";
  email?: string;
  exp: number;
};

export type CellUpdate = {
  sheetId: string;
  row: number;
  col: number;
  value: string;
};
