"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { GameDto } from "@/lib/types";

export default function BookingPage() {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState<GameDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<GameDto[]>("/api/games")
      .then(setGames)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-chalk pt-12 pb-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-16 lg:mb-20">
          <span
            className="enter font-mono text-[9px] tracking-[0.35em] uppercase text-pitch/35 block mb-4"
            style={{ animationDelay: "0.05s" }}
          >
            Court Booking
          </span>
          <h1 className="font-display text-[clamp(3.5rem,10vw,8rem)] uppercase tracking-[0.02em] text-pitch leading-[0.9]">
            <span className="enter block" style={{ animationDelay: "0.15s" }}>
              Reserve
            </span>
            <span
              className="enter block text-pitch/70"
              style={{ animationDelay: "0.28s" }}
            >
              Your Court
            </span>
          </h1>
        </div>

        {!isLoading && !user && (
          <div className="mb-14 border border-pitch/15 p-8 max-w-lg">
            <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-emerald mb-3">
              Sign In Required
            </div>
            <p className="font-sans text-sm text-pitch/60 leading-[1.8] mb-7">
              Create a free account to reserve a court. Booking takes under 60
              seconds once you&apos;re signed in.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-emerald text-chalk font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-ace hover:text-pitch"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 border border-pitch/20 text-pitch font-mono text-[11px] tracking-[0.15em] uppercase px-6 py-3 transition-all hover:border-pitch hover:bg-pitch/5"
              >
                Create account
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-10 border border-rose-400/40 bg-rose-400/5 p-6 text-rose-700 font-mono text-xs">
            {error}
          </div>
        )}

        {!games ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-pitch/30">
            Loading games…
          </div>
        ) : games.length === 0 ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-pitch/30">
            No games configured yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">

            {games.map((g, i) => (
              <Link
                key={g.id}
                href={`/booking/${g.id}`}
                className="border border-pitch/10 enter bg-gradient-to-br from-white to-chalk p-8 lg:p-10 flex flex-col gap-7 transition-all duration-300 hover:-translate-y-1 relative z-10 hover:shadow-[5px_5px_0_0_#1F5D3B] after:absolute after:inset-0 after:bg-pitch/4.5 after:pointer-events-none"
                style={{ animationDelay: `${0.4 + i * 0.12}s` }}
              >
                <div>
                  <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-pitch/35 block mb-2">
                    Game
                  </span>
                  <h3 className="font-display text-[1.75rem] uppercase tracking-wide text-pitch leading-none">
                    {g.name}
                  </h3>
                </div>
                {g.description && (
                  <p className="font-sans text-[11px] text-pitch/50 leading-[1.8]">
                    {g.description}
                  </p>
                )}
                <div className="mt-auto pt-6 border-t border-pitch/10 flex items-end justify-between">
                  <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-pitch/40">
                    View Calendar
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-emerald">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
