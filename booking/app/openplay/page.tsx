"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { OpenPlayWindowSummary } from "@/lib/types";

function fmtRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return `${fmt(startIso)} — ${fmt(endIso)}`;
}

export default function OpenPlayListPage() {
  const [windows, setWindows] = useState<OpenPlayWindowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<OpenPlayWindowSummary[]>("/api/openplay/windows")
      .then(setWindows)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="mb-12">
          <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 block mb-3">
            Drop-In Sessions
          </span>
          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase tracking-[0.02em] text-chalk leading-none">
            <span className="text-chalk">Open</span>{" "}
            <span className="text-ace">Play</span>
          </h1>
        </div>

        {error && (
          <div className="mb-8 border border-rose-300/30 p-5 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {!windows ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
            Loading…
          </div>
        ) : windows.length === 0 ? (
          <div className="border border-chalk/10 p-8 font-sans text-sm text-chalk/60">
            No open-play sessions scheduled right now.
          </div>
        ) : (
          <div className="space-y-px bg-chalk/8">
            {windows.map((w) => (
              <Link
                key={w.windowId}
                href={`/openplay/${w.windowId}`}
                className="block bg-pitch p-7 hover:bg-court transition flex items-center justify-between gap-6 flex-wrap"
              >
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35 mb-1">
                    {w.gameName}
                  </div>
                  <div className="font-display text-2xl text-chalk">
                    {w.roomName}
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.15em] text-chalk/50 mt-1">
                    {fmtRange(w.startTime, w.endTime)}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35">
                      Seat
                    </div>
                    <div className="font-display text-2xl text-ace">
                      ₱{w.seatRate.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35">
                      Queue
                    </div>
                    <div className="font-display text-2xl text-chalk">
                      {w.queueLength}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
