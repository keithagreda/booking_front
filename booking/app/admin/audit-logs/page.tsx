"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { AuditLogDto } from "@/lib/types";

const LEVEL_STYLES: Record<string, string> = {
  Information: "bg-zinc-800 text-zinc-400",
  Warning: "bg-amber-500/15 text-amber-400",
  Error: "bg-rose-500/15 text-rose-400",
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-400",
  PUT: "text-amber-400",
  DELETE: "text-rose-400",
  PATCH: "text-violet-400",
};

function fmtDuration(ms: number): string {
  if (ms < 10) return `${ms.toFixed(0)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [statusCode, setStatusCode] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditLogDto | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (level) params.set("level", level);
      if (method) params.set("method", method);
      if (statusCode) params.set("statusCode", statusCode);
      if (search) params.set("search", search);

      const res = await apiClient<{ items: AuditLogDto[]; total: number }>(
        `/api/admin/audit-logs?${params}`
      );
      setLogs(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, level, method, statusCode, search]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setLevel("");
    setMethod("");
    setStatusCode("");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
            Audit Logs
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track requests, errors, and admin actions.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          {total} record{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search URL, user, error…"
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 w-56"
        />
        <select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Levels</option>
          <option value="Information">Information</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
        </select>
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Methods</option>
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={statusCode}
          onChange={(e) => { setStatusCode(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Status Codes</option>
          <option value="200">200 OK</option>
          <option value="201">201 Created</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="409">409 Conflict</option>
          <option value="500">500 Server Error</option>
        </select>
        {(level || method || statusCode || search) && (
          <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            Clear
          </button>
        )}
        <button onClick={applyFilters} className="ml-auto rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition">
          Search
        </button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Time</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Level</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Method</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">URL</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Duration</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Error</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 text-sm">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const statusColor = log.statusCode >= 500
                    ? "text-rose-400"
                    : log.statusCode >= 400
                      ? "text-amber-400"
                      : "text-emerald-400";

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(selected?.id === log.id ? null : log)}
                      className="border-b border-zinc-800/50 hover:bg-zinc-900/30 cursor-pointer transition"
                    >
                      <td className="px-4 py-2.5 text-xs text-zinc-400 whitespace-nowrap font-mono">
                        {fmtDate(log.creationTime)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_STYLES[log.level]}`}>
                          {log.level[0]}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-xs font-mono font-semibold ${METHOD_COLORS[log.httpMethod] ?? "text-zinc-400"}`}>
                        {log.httpMethod}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-300 max-w-[200px] truncate font-mono">
                        {log.requestUrl}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400">
                        {log.userName || "—"}
                      </td>
                      <td className={`px-4 py-2.5 text-xs font-mono font-semibold ${statusColor}`}>
                        {log.statusCode}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400 font-mono">
                        {fmtDuration(log.durationMs)}
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {log.errorMessage ? (
                          <span className="text-rose-400 truncate block max-w-[150px]">{log.errorMessage}</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Detail modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_STYLES[selected.level]}`}>
                  {selected.level}
                </span>
                <span className="text-sm text-zinc-200 font-mono">
                  {selected.httpMethod} {selected.requestUrl}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300 text-lg">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Time" value={fmtDate(selected.creationTime)} />
                <DetailItem label="Status" value={`${selected.statusCode} (${fmtDuration(selected.durationMs)})`} />
                <DetailItem label="User" value={selected.userName || "Anonymous"} />
                <DetailItem label="Email" value={selected.email || "—"} />
                <DetailItem label="IP Address" value={selected.ipAddress || "—"} />
                <DetailItem label="User ID" value={selected.userId ? selected.userId.slice(0, 8) + "…" : "—"} />
              </div>

              {selected.userAgent && (
                <DetailItem label="User Agent" value={selected.userAgent} />
              )}

              {selected.errorMessage && (
                <div>
                  <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1.5">Error</div>
                  <div className="text-sm text-rose-400">{selected.errorMessage}</div>
                </div>
              )}

              {selected.errorStackTrace && (
                <div>
                  <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1.5">Stack Trace</div>
                  <pre className="text-xs text-rose-300/80 bg-zinc-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-40 font-mono">
                    {selected.errorStackTrace}
                  </pre>
                </div>
              )}

              {selected.requestBody && (
                <div>
                  <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1.5">Request Body</div>
                  <pre className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg overflow-x-auto max-h-40 font-mono">
                    {(() => {
                      try { return JSON.stringify(JSON.parse(selected.requestBody), null, 2); }
                      catch { return selected.requestBody; }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">{label}</div>
      <div className="text-sm text-zinc-200 font-mono break-all">{value}</div>
    </div>
  );
}
