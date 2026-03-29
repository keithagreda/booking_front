"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const SPORTS = [
  {
    id: "pickleball",
    name: "Pickleball",
    tag: "Court Sport",
    price: 240,
    peakPrice: 276,
    status: "AVAILABLE",
    available: true,
    description: "Lit courts · Up to 4 players · Paddles available on-site",
  },
  {
    id: "billiards",
    name: "Billiards",
    tag: "Table Sport",
    price: 150,
    peakPrice: null,
    status: "AVAILABLE",
    available: true,
    description: "Full-size pool tables · All skill levels welcome",
  },
  {
    id: "darts",
    name: "Darts",
    tag: "Target Sport",
    price: 80,
    peakPrice: null,
    status: "AVAILABLE",
    available: true,
    description: "Electronic dartboards · Perfect for groups and walk-ins",
  },
];

export default function BookingPage() {
  const { user, isLoading } = useAuth();

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* ── Page header ── */}
        <div className="mb-16 lg:mb-20">
          <span
            className="enter font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 block mb-4"
            style={{ animationDelay: "0.05s" }}
          >
            Court Booking
          </span>
          <h1 className="font-display text-[clamp(3.5rem,10vw,8rem)] uppercase tracking-[0.02em] text-chalk leading-[0.9]">
            <span className="enter block" style={{ animationDelay: "0.15s" }}>Reserve</span>
            <span className="enter block text-ace" style={{ animationDelay: "0.28s" }}>Your Court</span>
          </h1>
        </div>

        {/* ── Auth gate notice ── */}
        {!isLoading && !user && (
          <div className="mb-14 border border-ace/25 p-8 max-w-lg">
            <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace mb-3">
              Sign In Required
            </div>
            <p className="font-sans text-sm text-chalk/50 leading-[1.8] mb-7">
              Create a free account to reserve a court. Booking takes under
              60 seconds once you're signed in.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-ace text-pitch font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-chalk"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 border border-chalk/20 text-chalk font-mono text-[11px] tracking-[0.15em] uppercase px-6 py-3 transition-all hover:border-chalk"
              >
                Create account
              </Link>
            </div>
          </div>
        )}

        {/* ── Sports grid ── */}
        <div className="grid md:grid-cols-3 gap-px bg-chalk/8">
          {SPORTS.map((sport, i) => (
            <div
              key={sport.id}
              className="enter bg-pitch p-8 lg:p-10 flex flex-col gap-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_#c5f135] relative z-10"
              style={{ animationDelay: `${0.4 + i * 0.12}s` }}
            >
              {/* Card top */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/25 block mb-2">
                    {sport.tag}
                  </span>
                  <h3 className="font-display text-[1.75rem] uppercase tracking-wide text-chalk leading-none">
                    {sport.name}
                  </h3>
                </div>
                <span className="shrink-0 font-mono text-[8px] tracking-[0.25em] uppercase px-2.5 py-1 bg-ace text-pitch">
                  {sport.status}
                </span>
              </div>

              {/* Description */}
              <p className="font-sans text-[11px] text-chalk/40 leading-[1.8]">
                {sport.description}
              </p>

              {/* Card bottom */}
              <div className="mt-auto pt-6 border-t border-chalk/8 flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[2.25rem] text-chalk leading-none">
                      ₱{sport.price}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-chalk/35">
                      / hr
                    </span>
                  </div>
                  {sport.peakPrice && (
                    <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-chalk/40 mt-1">
                      ₱{sport.peakPrice} peak hrs
                    </div>
                  )}
                </div>

                {user ? (
                  <button className="group inline-flex items-center gap-2 bg-ace text-pitch font-bold text-[11px] tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-chalk">
                    Book
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 border border-chalk/20 text-chalk/50 font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:border-chalk hover:text-chalk"
                  >
                    Sign in
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Coming soon notice ── */}
        <div className="mt-16 pt-10 border-t border-chalk/8">
          <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-chalk/18 leading-[2]">
            Full booking system — date &amp; time picker, multi-court selection,
            and GCash payment — coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
