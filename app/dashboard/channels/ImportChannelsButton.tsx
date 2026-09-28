"use client";

import { useRef, useState, useTransition } from "react";
import { FaDownload, FaFileImport, FaXmark } from "react-icons/fa6";
import { gridToColumns, readGrid, type CategoryColumn } from "@/lib/sheet";
import { importPassiveChannels, type ImportResult } from "./actions";

const TEMPLATE = "Podcasts,Cartoons\n@channel1,@channel3\n@channel2,\n";

export default function ImportChannelsButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [columns, setColumns] = useState<CategoryColumn[]>();
  const [fileError, setFileError] = useState<string>();
  const [result, setResult] = useState<ImportResult>();
  const [pending, startTransition] = useTransition();

  const linkCount = columns?.reduce((n, c) => n + c.links.length, 0) ?? 0;

  const reset = () => {
    setColumns(undefined);
    setFileError(undefined);
    setResult(undefined);
  };

  const onFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    try {
      const parsed = gridToColumns(await readGrid(file));
      if (!parsed.length) setFileError("No category names in the first row.");
      else setColumns(parsed);
    } catch {
      setFileError("Couldn't read this file. Use a .csv or .xlsx file.");
    }
  };

  const runImport = () =>
    columns &&
    startTransition(async () => {
      setResult(await importPassiveChannels(columns));
      setColumns(undefined);
    });

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          dialogRef.current?.showModal();
        }}
        className="btn-ghost"
      >
        <FaFileImport />
        Import
      </button>

      <dialog
        ref={dialogRef}
        // Keep it open while the import runs.
        onCancel={(e) => pending && e.preventDefault()}
        aria-labelledby="import-title"
        className="card m-auto w-[calc(100%-2rem)] max-w-lg text-foreground backdrop:bg-black/50"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="import-title" className="text-xl font-semibold">
            Import passive channels
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:text-foreground"
          >
            <FaXmark />
          </button>
        </div>

        <p className="mb-3 text-sm text-muted">
          Each column is a category: its name in the first row and channel links
          (@handle or youtube.com link) below. New categories are created;
          channels already added are skipped.
        </p>
        <div className="mb-4 overflow-x-auto rounded-lg border border-border text-xs">
          <table className="w-full">
            <thead className="bg-foreground/5 text-left">
              <tr>
                <th className="px-3 py-1.5 font-medium">Podcasts</th>
                <th className="px-3 py-1.5 font-medium">Cartoons</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr>
                <td className="px-3 py-1">@channel1</td>
                <td className="px-3 py-1">youtube.com/@channel3</td>
              </tr>
              <tr>
                <td className="px-3 py-1">@channel2</td>
                <td className="px-3 py-1" />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={pending}
              onChange={(e) => onFile(e.target.files?.[0])}
              className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
            <a
              href={templateHref}
              download="channels-template.csv"
              className="flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <FaDownload className="text-xs" />
              Template
            </a>
          </div>

          {fileError && <p className="text-sm text-red-500">{fileError}</p>}

          {columns && (
            <div className="rounded-lg bg-foreground/5 p-3 text-sm">
              <p className="mb-2 font-medium">
                {columns.length} categor{columns.length === 1 ? "y" : "ies"},{" "}
                {linkCount} link{linkCount === 1 ? "" : "s"}
              </p>
              <ul className="flex flex-col gap-0.5 text-muted">
                {columns.map((c) => (
                  <li key={c.name}>
                    {c.name}: {c.links.length}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.error && (
            <p className="text-sm text-red-500">{result.error}</p>
          )}
          {result && !result.error && (
            <div className="text-sm">
              <p className="font-medium text-done">
                Added {result.added} channel{result.added === 1 ? "" : "s"}
                {result.categoriesCreated
                  ? ` and ${result.categoriesCreated} new categor${result.categoriesCreated === 1 ? "y" : "ies"}`
                  : ""}
                .
              </p>
              {!!result.skipped?.length && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted">
                    {result.skipped.length} skipped
                  </summary>
                  <ul className="mt-2 max-h-48 overflow-y-auto text-xs">
                    {result.skipped.map((s, i) => (
                      <li
                        key={i}
                        className="border-b border-border py-1.5 last:border-0"
                      >
                        <span className="font-medium">{s.link}</span>{" "}
                        <span className="text-muted">
                          ({s.category}): {s.reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={runImport}
              disabled={!columns || linkCount === 0 || pending}
              className="btn-primary"
            >
              {pending
                ? "Importing…"
                : `Import ${linkCount || ""} channel${linkCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
