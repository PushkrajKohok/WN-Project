"use client";

import { FileSpreadsheet } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { ManifestRowCount } from "@/types/data";

type Props = {
  rows: ManifestRowCount[];
  totalRows: number;
};

export function DataManifestTable({ rows, totalRows }: Props) {
  return (
    <section
      className="p-4 rounded-lg space-y-3 animate-fade-in border"
      style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1">
          <FileSpreadsheet size={14} className="text-success" /> Data Manifest
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          Total rows: {formatNumber(totalRows)}
        </span>
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
        <table className="data-table text-xs">
          <thead>
            <tr>
              <th>Table</th>
              <th>Rows</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.table}>
                <td>{row.label}</td>
                <td>{formatNumber(row.rows)}</td>
                <td style={{ color: "var(--color-text-secondary)" }}>{row.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

