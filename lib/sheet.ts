// Reads a CSV or Excel file into rows of trimmed strings. Runs in the browser.

export type Grid = string[][];

// Minimal RFC 4180 parser: quoted fields may contain the delimiter, newlines
// and "" for a literal quote. The delimiter is guessed from the first line,
// since Excel in some locales saves CSV with ";".
export function parseCsv(text: string): Grid {
  const input = text.replace(/^﻿/, "");
  const firstLine = input.slice(0, input.search(/\r?\n|$/));
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const delimiter = [",", ";", "\t"].reduce((best, ch) =>
    count(ch) > count(best) ? ch : best,
  );

  const rows: Grid = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

export async function readGrid(file: File): Promise<Grid> {
  if (/\.xlsx$/i.test(file.name)) {
    // Loaded on demand: only admins importing a spreadsheet need it.
    const { readSheet } = await import("read-excel-file/browser");
    const data = await readSheet(file);
    return data.map((row) =>
      row.map((cell) => (cell == null ? "" : String(cell).trim())),
    );
  }
  return parseCsv(await file.text());
}

export type CategoryColumn = { name: string; links: string[] };

// Each column is a category: its name in the first row, channel links below.
// Empty columns and cells are skipped.
export function gridToColumns(grid: Grid): CategoryColumn[] {
  const [header = [], ...rows] = grid;
  return header
    .map((name, col) => ({
      name: name.trim(),
      links: rows.map((r) => (r[col] ?? "").trim()).filter(Boolean),
    }))
    .filter((c) => c.name);
}
