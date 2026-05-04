"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { BookingDto } from "@/lib/types";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtHourOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function sameLocalDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function fmtRange(startIso: string, endIso: string): string {
  return sameLocalDay(startIso, endIso)
    ? `${fmtTime(startIso)} — ${fmtHourOnly(endIso)}`
    : `${fmtTime(startIso)} — ${fmtTime(endIso)}`;
}

function statusTone(status: BookingDto["status"]): string {
  switch (status) {
    case "Approved":
      return "text-emerald border-emerald/40 bg-emerald/10";
    case "ProofSubmitted":
      return "text-ace border-ace/40 bg-ace/10";
    case "PendingPayment":
      return "text-amber-200 border-amber-300/30 bg-amber-300/5";
    case "Rejected":
    case "Expired":
    case "Cancelled":
      return "text-rose-200 border-rose-300/30 bg-rose-300/5";
    default:
      return "text-chalk/60 border-chalk/15";
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<BookingDto[]>("/api/bookings/mine")
      .then(setBookings)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase tracking-[0.02em] text-chalk leading-none mb-12">
          My Bookings
        </h1>

        {error && (
          <div className="mb-8 border border-rose-300/30 p-5 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {!bookings ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
            Loading…
          </div>
        ) : bookings.length === 0 ? (
          <div className="border border-chalk/10 p-8">
            <p className="font-sans text-sm text-chalk/60 mb-5">
              You haven&apos;t booked anything yet.
            </p>
            <Link
              href="/booking"
              className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-6 py-3 inline-block"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <div className="space-y-px bg-chalk/8">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-pitch p-6 lg:p-7 flex items-start justify-between gap-6 flex-wrap"
              >
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35 mb-1">
                    {b.type === "OpenPlaySeat" ? "Open Play Seat" : "Court Booking"}
                  </div>
                  <div className="font-display text-2xl text-chalk">{b.roomName}</div>
                  <div className="font-sans text-sm md:text-base text-chalk/80 mt-1.5 leading-snug">
                    {fmtRange(b.startTime, b.endTime)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-3 py-1.5 ${statusTone(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                  <span className="font-display text-xl text-ace">
                    ₱{b.totalAmount.toFixed(0)}
                  </span>
                  {b.status === "PendingPayment" && (
                    <Link
                      href={`/checkout/${b.id}`}
                      className="font-bold text-[10px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-4 py-2"
                    >
                      Pay
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
