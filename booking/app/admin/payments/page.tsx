"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { PaymentDto } from "@/lib/types";

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDateRange(start: string | null, end: string | null): string {
  if (!start) return "—";
  const s = new Date(start);
  const date = s.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const startTime = s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  if (!end) return `${date} · ${startTime}`;
  const endTime = new Date(end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} · ${startTime} – ${endTime}`;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    try {
      setPayments(await apiClient<PaymentDto[]>("/api/admin/payments"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiClient<PaymentDto>(`/api/admin/payments/${id}/approve`, {
        method: "POST",
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) {
      setError("Reason required for rejection.");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await apiClient<PaymentDto>(`/api/admin/payments/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setRejectingId(null);
      setRejectReason("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-1">
            Awaiting Review
          </div>
          <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
            Payments
          </h1>
        </div>
        <button
          onClick={load}
          className="rounded-lg font-mono text-[10px] tracking-[0.15em] uppercase border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 px-4 py-2.5 transition"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {!payments ? (
        <div className="text-sm text-zinc-500">Loading…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 p-6 text-sm text-zinc-500">
          No payments awaiting review. Auto-refreshes every 15s.
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 grid md:grid-cols-[1fr_auto] gap-6 items-start"
            >
              <div>
                {p.bookerName && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 grid place-items-center text-xs font-medium text-zinc-400">
                      {p.bookerName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-200 text-sm">{p.bookerName}</div>
                      {p.bookerEmail && (
                        <div className="text-xs text-zinc-500">{p.bookerEmail}</div>
                      )}
                    </div>
                  </div>
                )}
                {p.roomName && (
                  <div className="font-medium text-zinc-300 mb-1">{p.roomName}</div>
                )}
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-1">
                  Booking {p.bookingId.slice(0, 8).toUpperCase()}
                </div>
                <div className="font-display text-2xl text-emerald-400 mb-1">
                  ₱{p.amount.toFixed(0)}
                </div>
                <div className="font-mono text-[10px] tracking-[0.1em] text-zinc-500">
                  {p.method} · ref{" "}
                  <span className="text-zinc-300">
                    {p.referenceNumber ?? "—"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {fmtDateRange(p.bookingStartTime, p.bookingEndTime)}
                </div>
                {p.rejectionReason && (
                  <div className="mt-2 text-xs text-rose-400">
                    Rejected: {p.rejectionReason}
                  </div>
                )}
                {p.proofPresignedUrl && (
                  <a
                    href={p.proofPresignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3"
                  >
                    <img
                      src={p.proofPresignedUrl}
                      alt="GCash proof"
                      className="max-w-[280px] max-h-[280px] rounded-lg border border-zinc-700 hover:border-zinc-500 transition"
                    />
                  </a>
                )}
                <div className="mt-2 text-xs text-zinc-600">
                  Submitted {fmtTime(p.reviewedAt)}
                </div>
              </div>

              {rejectingId === p.id ? (
                <div className="flex flex-col gap-3 min-w-[260px]">
                  <textarea
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection"
                    rows={3}
                    className="rounded-lg bg-zinc-800 border border-rose-500/30 px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-rose-500 placeholder:text-zinc-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject(p.id)}
                      disabled={busyId === p.id}
                      className="rounded-lg font-medium text-[10px] tracking-[0.15em] uppercase bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 px-4 py-2 transition disabled:opacity-50"
                    >
                      {busyId === p.id ? "Rejecting…" : "Confirm Reject"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="rounded-md font-mono text-[10px] tracking-[0.15em] uppercase border border-zinc-700 text-zinc-500 hover:text-zinc-300 px-4 py-2 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <button
                    onClick={() => approve(p.id)}
                    disabled={busyId === p.id}
                    className="rounded-lg font-medium text-[10px] tracking-[0.15em] uppercase bg-emerald-600 text-white hover:bg-emerald-500 transition px-5 py-2.5 disabled:opacity-50"
                  >
                    {busyId === p.id ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(p.id);
                      setRejectReason("");
                    }}
                    className="rounded-md font-mono text-[10px] tracking-[0.15em] uppercase border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 px-5 py-2.5 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
