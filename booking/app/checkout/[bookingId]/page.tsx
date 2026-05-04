"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, apiUpload } from "@/lib/api";
import type { BookingDto, PaymentDto } from "@/lib/types";

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
  if (sameLocalDay(startIso, endIso)) {
    return `${fmtTime(startIso)} — ${fmtHourOnly(endIso)}`;
  }
  return `${fmtTime(startIso)} — ${fmtTime(endIso)}`;
}

function useCountdown(target: string | null | undefined): string {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) return setText("Expired");
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setText(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return text;
}

export default function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const countdown = useCountdown(booking?.holdExpiresAt);

  useEffect(() => {
    apiClient<BookingDto>(`/api/bookings/${bookingId}`)
      .then(setBooking)
      .catch((e: Error) => setError(e.message));
  }, [bookingId]);

  async function submitProof(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Please attach a screenshot of your GCash payment.");
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("proof", file);
      if (reference) form.append("referenceNumber", reference);
      const payment = await apiUpload<PaymentDto>(
        `/api/bookings/${bookingId}/payment/proof`,
        form
      );
      setBooking((b) => (b ? { ...b, status: "ProofSubmitted", payment } : b));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (error && !booking) {
    return (
      <main className="min-h-screen bg-pitch pt-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="border border-rose-300/30 p-6 text-rose-200 font-mono text-xs">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-pitch pt-28 px-6">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30 max-w-3xl mx-auto">
          Loading…
        </div>
      </main>
    );
  }

  const submitted = booking.status === "ProofSubmitted";
  const approved = booking.status === "Approved";
  const ended = booking.status === "Expired" || booking.status === "Cancelled" || booking.status === "Rejected";

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <Link
          href="/bookings"
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
        >
          ← My Bookings
        </Link>

        <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] uppercase tracking-[0.02em] text-chalk leading-none mb-12">
          Checkout
        </h1>

        <section className="border border-chalk/10 p-7 mb-8">
          <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/35 mb-3">
            Booking Summary
          </div>
          <div className="font-display text-3xl text-chalk mb-2">{booking.roomName}</div>
          <div className="font-sans text-base md:text-lg text-chalk/85 leading-snug">
            {fmtRange(booking.startTime, booking.endTime)}
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-chalk/5 pt-6">
            <div>
              <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35">
                Total
              </div>
              <div className="font-display text-4xl text-ace">
                ₱{booking.totalAmount.toFixed(0)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35">
                Status
              </div>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-chalk">
                {booking.status}
              </div>
            </div>
          </div>
        </section>

        {!submitted && !approved && !ended && (
          <>
            <section className="border border-ace/30 p-7 mb-8">
              <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace mb-2">
                Pay via GCash
              </div>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-chalk/50 mb-5">
                Hold expires in <span className="text-ace">{countdown || "—"}</span>
              </div>

              <div className="flex flex-col items-center gap-4 py-6 bg-chalk/5">
                <div className="w-48 h-48 bg-chalk grid place-items-center font-mono text-[10px] tracking-[0.15em] text-pitch">
                  GCASH QR
                </div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-chalk/50">
                  Reference: <span className="text-chalk">{booking.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <p className="font-sans text-xs text-chalk/50 leading-[1.8] mt-5">
                Send ₱{booking.totalAmount.toFixed(0)} to the QR above using GCash.
                After payment, upload a screenshot below. Your booking is confirmed
                once an admin reviews the proof.
              </p>
            </section>

            <form onSubmit={submitProof} className="border border-chalk/10 p-7">
              <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/35 mb-5">
                Upload Proof of Payment
              </div>

              <label className="block mb-4">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-chalk/50 block mb-2">
                  GCash reference (optional)
                </span>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-mono text-sm focus:outline-none focus:border-ace"
                  placeholder="e.g. 0123456789"
                />
              </label>

              <label className="block mb-6">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-chalk/50 block mb-2">
                  Screenshot
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  required
                  className="block w-full text-chalk/70 font-mono text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ace file:text-pitch file:font-bold file:tracking-[0.15em] file:uppercase"
                />
              </label>

              {error && (
                <div className="mb-5 border border-rose-300/30 p-4 text-rose-200 font-mono text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-7 py-3 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Submit Proof"}
              </button>
            </form>
          </>
        )}

        {submitted && (
          <section className="border border-ace/30 bg-ace/5 p-7">
            <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace mb-3">
              Proof Submitted
            </div>
            <p className="font-sans text-sm text-chalk/70 leading-[1.8]">
              Your payment is awaiting admin review. You&apos;ll be notified once
              approved.
            </p>
            <button
              onClick={() => router.push("/bookings")}
              className="mt-6 font-mono text-[11px] tracking-[0.15em] uppercase border border-chalk/20 text-chalk hover:border-chalk px-5 py-2.5 transition"
            >
              View My Bookings
            </button>
          </section>
        )}

        {approved && (
          <section className="border border-emerald/40 bg-emerald/10 p-7">
            <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-emerald mb-3">
              Approved
            </div>
            <p className="font-sans text-sm text-chalk/70 leading-[1.8]">
              Your booking is confirmed. See you at {booking.roomName}.
            </p>
          </section>
        )}

        {ended && (
          <section className="border border-rose-300/30 p-7">
            <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-rose-200 mb-3">
              Booking {booking.status}
            </div>
            {booking.payment?.rejectionReason && (
              <p className="font-sans text-sm text-chalk/70 leading-[1.8]">
                {booking.payment.rejectionReason}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
