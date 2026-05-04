"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { createHub } from "@/lib/live";
import type { DisplayRoomState, DisplaySnapshot, RoomStatus } from "@/lib/types";

function statusTone(status: RoomStatus): {
  bg: string;
  border: string;
  label: string;
  labelColor: string;
} {
  switch (status) {
    case "Open":
      return {
        bg: "bg-pitch",
        border: "border-chalk/15",
        label: "Open",
        labelColor: "text-chalk/60",
      };
    case "OpenPlay":
      return {
        bg: "bg-emerald/15",
        border: "border-emerald/40",
        label: "Open Play",
        labelColor: "text-emerald",
      };
    case "Tournament":
      return {
        bg: "bg-amber-300/10",
        border: "border-amber-300/40",
        label: "Tournament",
        labelColor: "text-amber-200",
      };
    case "Closed":
      return {
        bg: "bg-chalk/5",
        border: "border-chalk/10",
        label: "Closed",
        labelColor: "text-chalk/30",
      };
    case "Maintenance":
      return {
        bg: "bg-rose-300/5",
        border: "border-rose-300/30",
        label: "Maintenance",
        labelColor: "text-rose-200",
      };
  }
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DisplayPage() {
  const [snapshot, setSnapshot] = useState<DisplaySnapshot | null>(null);
  const [, setNow] = useState(new Date());

  useEffect(() => {
    apiClient<DisplaySnapshot>("/api/display/rooms").then(setSnapshot).catch(() => {});

    const conn = createHub();
    conn
      .start()
      .then(() => conn.invoke("SubscribeDisplay"))
      .catch(() => {});

    conn.on("DisplayState", (s: DisplaySnapshot) => setSnapshot(s));

    // refresh fallback every 30s in case SignalR is unavailable
    const id = setInterval(() => {
      apiClient<DisplaySnapshot>("/api/display/rooms").then(setSnapshot).catch(() => {});
    }, 30000);

    const tick = setInterval(() => setNow(new Date()), 1000);

    return () => {
      conn.invoke("UnsubscribeDisplay").catch(() => {});
      conn.stop();
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  return (
    <main className="min-h-screen bg-pitch px-8 py-10">
      <header className="flex items-end justify-between mb-10">
        <div>
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-chalk/30 block mb-2">
            Live Court Board
          </span>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] uppercase tracking-[0.02em] text-chalk leading-none">
            <span className="text-chalk">Centre</span>{" "}
            <span className="text-ace">Court</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-chalk/30">
            Now
          </div>
          <div className="font-display text-5xl text-ace leading-none">
            {new Date().toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
      </header>

      {!snapshot ? (
        <div className="font-mono text-[12px] tracking-[0.25em] uppercase text-chalk/30">
          Connecting…
        </div>
      ) : (
        <div className="grid gap-px bg-chalk/8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.rooms.map((r) => (
            <RoomTile key={r.roomId} state={r} />
          ))}
        </div>
      )}
    </main>
  );
}

function RoomTile({ state }: { state: DisplayRoomState }) {
  const tone = statusTone(state.currentStatus);
  return (
    <div className={`p-7 ${tone.bg} border ${tone.border} flex flex-col gap-5 min-h-[260px]`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-chalk/40">
            {state.gameName}
          </div>
          <div className="font-display text-[2.5rem] uppercase text-chalk leading-none mt-1">
            {state.roomName}
          </div>
        </div>
        <span
          className={`font-mono text-[9px] tracking-[0.25em] uppercase ${tone.labelColor} border border-current px-3 py-1.5`}
        >
          {tone.label}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {state.currentReservationLabel && (
          <div className="font-display text-2xl text-chalk leading-snug">
            {state.currentReservationLabel}
          </div>
        )}

        {state.currentMatchPlayers && state.currentMatchPlayers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {state.currentMatchPlayers.map((p) => (
              <span
                key={p.userId}
                className="font-mono text-[10px] tracking-[0.15em] uppercase border border-ace/40 text-ace bg-ace/5 px-3 py-1"
              >
                {p.name}
              </span>
            ))}
          </div>
        )}

        {state.currentEndsAt && (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/40 mt-3">
            Until {fmtTime(state.currentEndsAt)}
          </div>
        )}

        {state.openPlayQueueLength != null && (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/40 mt-2">
            {state.openPlayQueueLength} in queue
          </div>
        )}
      </div>

      {(state.nextLabel || state.nextStartsAt) && (
        <div className="border-t border-chalk/10 pt-4">
          <div className="font-mono text-[8px] tracking-[0.3em] uppercase text-chalk/35">
            Next
          </div>
          <div className="font-mono text-[11px] tracking-[0.15em] text-chalk/70 mt-1">
            {fmtTime(state.nextStartsAt)} · {state.nextLabel ?? ""}
          </div>
        </div>
      )}
    </div>
  );
}
