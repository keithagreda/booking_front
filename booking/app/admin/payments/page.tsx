"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <Link
          href="/admin"
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
        >
          ← Admin
        </Link>

        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 block mb-3">
              Awaiting Review
            </span>
            <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase tracking-[0.02em] text-chalk leading-none">
              Payments
            </h1>
          </div>
          <button
            onClick={load}
            className="font-mono text-[10px] tracking-[0.25em] uppercase border border-chalk/20 text-chalk/60 hover:text-chalk hover:border-chalk px-5 py-3 transition"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-rose-300/30 p-4 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {!payments ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
            Loading…
          </div>
        ) : payments.length === 0 ? (
          <div className="border border-chalk/10 p-7 font-sans text-sm text-chalk/50">
            No payments awaiting review. Auto-refreshes every 15s.
          </div>
        ) : (
          <div className="space-y-px bg-chalk/8">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-pitch p-6 grid md:grid-cols-[1fr_auto] gap-6 items-start"
              >
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35 mb-1">
                    Booking {p.bookingId.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="font-display text-3xl text-ace mb-1">
                    ₱{p.amount.toFixed(0)}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-chalk/50">
                    {p.method} · ref{" "}
                    <span className="text-chalk">
                      {p.gcashReference ?? "—"}
                    </span>
                  </div>
                  {p.proofPresignedUrl && (
                    <a
                      href={p.proofPresignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4"
                    >
                      <img
                        src={p.proofPresignedUrl}
                        alt="GCash proof"
                        className="max-w-[280px] max-h-[280px] border border-chalk/15 hover:border-ace transition"
                      />
                    </a>
                  )}
                </div>

                {rejectingId === p.id ? (
                  <div className="flex flex-col gap-3 min-w-[260px]">
                    <textarea
                      autoFocus
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                      rows={3}
                      className="bg-chalk/5 border border-rose-300/30 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-rose-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => reject(p.id)}
                        disabled={busyId === p.id}
                        className="font-bold text-[10px] tracking-[0.15em] uppercase bg-rose-300/20 border border-rose-300/40 text-rose-200 hover:bg-rose-300/30 px-4 py-2.5 transition disabled:opacity-50"
                      >
                        {busyId === p.id ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="font-mono text-[10px] tracking-[0.15em] uppercase border border-chalk/20 text-chalk/60 hover:text-chalk px-4 py-2.5 transition"
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
                      className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-5 py-3 disabled:opacity-50"
                    >
                      {busyId === p.id ? "Approving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(p.id);
                        setRejectReason("");
                      }}
                      className="font-mono text-[10px] tracking-[0.15em] uppercase border border-rose-300/30 text-rose-200 hover:bg-rose-300/10 px-5 py-3 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
