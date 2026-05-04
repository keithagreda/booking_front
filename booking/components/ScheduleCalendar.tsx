"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import type {
  GameDto,
  RoomDto,
  ScheduleBookingDto,
  ScheduleDayDto,
  ScheduleOpenPlayDto,
} from "@/lib/types";

const HOURS = Array.from({ length: 24 }, (_, h) => {
  const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
  return { h, label };
});

const CELL_W = 110;
const ROW_H = 72;
const HEADER_H = 40;
const SIDEBAR_W = 176;

const STATUS_COLORS: Record<string, string> = {
  PendingPayment: "bg-amber-500/15 border-l-amber-500",
  ProofSubmitted: "bg-sky-500/15 border-l-sky-500",
  Approved: "bg-emerald-500/15 border-l-emerald-500",
  Rejected: "bg-rose-500/15 border-l-rose-500",
  Expired: "bg-zinc-500/15 border-l-zinc-500",
  Cancelled: "bg-red-500/15 border-l-red-600",
};

const STATUS_TEXT: Record<string, string> = {
  PendingPayment: "text-amber-400",
  ProofSubmitted: "text-sky-400",
  Approved: "text-emerald-400",
  Rejected: "text-rose-400",
  Expired: "text-zinc-400",
  Cancelled: "text-red-400",
};

function fmtHour(h: number): string {
  return HOURS[h]?.label ?? `${h}:00`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ScheduleCalendar({
  initialDate,
}: {
  initialDate?: Date;
}) {
  const [date, setDate] = useState(initialDate ?? new Date());
  const [rooms, setRooms] = useState<ScheduleDayDto["rooms"]>([]);
  const [bookings, setBookings] = useState<ScheduleBookingDto[]>([]);
  const [openPlay, setOpenPlay] = useState<ScheduleOpenPlayDto[]>([]);
  const [games, setGames] = useState<GameDto[]>([]);
  const [, setRoomList] = useState<RoomDto[]>([]);
  const [filterRoomStatus, setFilterRoomStatus] = useState<string>("");
  const [filterGame, setFilterGame] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dateStr = date.toISOString().split("T")[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, r, sched] = await Promise.all([
        apiClient<GameDto[]>("/api/games"),
        apiClient<RoomDto[]>("/api/admin/rooms"),
        apiClient<ScheduleDayDto>(`/api/admin/schedule?date=${dateStr}`),
      ]);
      setGames(g);
      setRoomList(r);
      setRooms(sched.rooms);
      setBookings(sched.bookings);
      setOpenPlay(sched.openPlayWindows);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 6 * CELL_W;
    }
  }, []);

  const filteredRooms = useMemo(() => {
    let list = rooms;
    if (filterGame) list = list.filter((r) => r.game.id === filterGame);
    return list;
  }, [rooms, filterGame]);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (filterGame) list = list.filter((b) => filteredRooms.some((r) => r.id === b.roomId));
    if (filterStatus) list = list.filter((b) => b.status === filterStatus);
    return list;
  }, [bookings, filterGame, filterStatus, filteredRooms]);

  const filteredOpenPlay = useMemo(() => {
    let list = openPlay;
    if (filterGame) list = list.filter((w) => filteredRooms.some((r) => r.id === w.roomId));
    if (filterRoomStatus) list = list.filter((w) => w.status === filterRoomStatus);
    return list;
  }, [openPlay, filterGame, filterRoomStatus, filteredRooms]);

  const groupedRooms = useMemo(() => {
    const gameMap = new Map<string, typeof rooms>();
    for (const r of filteredRooms) {
      const key = r.game.id;
      if (!gameMap.has(key)) gameMap.set(key, []);
      gameMap.get(key)!.push(r);
    }
    return Array.from(gameMap.entries());
  }, [filteredRooms]);

  function goPrev() {
    setDate((d) => new Date(d.getTime() - 86400000));
  }
  function goNext() {
    setDate((d) => new Date(d.getTime() + 86400000));
  }
  function goToday() {
    setDate(new Date());
  }

  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isToday = date.toDateString() === new Date().toDateString();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-zinc-500 font-mono tracking-[0.15em] uppercase">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goPrev} className="w-7 h-7 rounded-md border border-zinc-700 grid place-items-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition text-sm">
            ‹
          </button>
          <button onClick={goNext} className="w-7 h-7 rounded-md border border-zinc-700 grid place-items-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition text-sm">
            ›
          </button>
          <button onClick={goToday} className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition px-2.5 py-1.5 rounded-md border border-zinc-700">
            Today
          </button>
          <span className="text-sm font-medium text-zinc-200">{dateLabel}</span>
          {isToday && (
            <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 shrink-0 flex-wrap">
        <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-600">Filters:</span>
        <select
          value={filterGame}
          onChange={(e) => setFilterGame(e.target.value)}
          className="rounded-md bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Games</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Statuses</option>
          {["PendingPayment", "ProofSubmitted", "Approved", "Rejected", "Expired", "Cancelled"].map((s) => (
            <option key={s} value={s}>{s.replace(/([a-z])([A-Z])/g, "$1 $2")}</option>
          ))}
        </select>
        <select
          value={filterRoomStatus}
          onChange={(e) => setFilterRoomStatus(e.target.value)}
          className="rounded-md bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Room Statuses</option>
          {["Open", "OpenPlay", "Tournament", "Closed", "Maintenance"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(filterGame || filterStatus || filterRoomStatus) && (
          <button
            onClick={() => { setFilterGame(""); setFilterStatus(""); setFilterRoomStatus(""); }}
            className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 shrink-0 flex-wrap">
        <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-600">Legend:</span>
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <span key={status} className={`inline-flex items-center gap-1.5 text-[10px] font-medium rounded-full px-2 py-0.5 border-l-2 ${cls} ${STATUS_TEXT[status]}`}>
            {status.replace(/([a-z])([A-Z])/g, "$1 $2")}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium rounded-full px-2 py-0.5 bg-violet-500/15 border-l-2 border-l-violet-500 text-violet-400">
          OpenPlay
        </span>
      </div>

      {/* ── Grid ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 border-r border-zinc-800 bg-zinc-950 overflow-y-auto" style={{ width: SIDEBAR_W }}>
          <div style={{ height: HEADER_H }} className="shrink-0 border-b border-zinc-800 flex items-center px-3">
            <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-600">
              Room
            </span>
          </div>
          {groupedRooms.map(([gameId, rs]) => {
            const game = rs[0]?.game;
            return (
              <div key={gameId}>
                <div className="px-3 py-1.5 bg-zinc-900/40 border-b border-zinc-800/60">
                  <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-zinc-500">
                    {game?.name}
                  </span>
                </div>
                {rs.map((r) => (
                  <div key={r.id} className="px-3 py-2 border-b border-zinc-800/40" style={{ height: ROW_H - 1 }}>
                    <div className="text-sm font-medium text-zinc-200 truncate">{r.name}</div>
                  </div>
                ))}
              </div>
            );
          })}
          {groupedRooms.length === 0 && (
            <div className="px-3 py-6 text-xs text-zinc-600">No rooms match filters.</div>
          )}
        </div>

        {/* Scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {/* Time header */}
          <div className="flex sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800" style={{ height: HEADER_H }}>
            {HOURS.map(({ h, label }) => {
              const off = h < 7 || h >= 22;
              return (
                <div
                  key={h}
                  className={`flex items-center justify-center text-[11px] font-semibold shrink-0 border-r border-zinc-800/40 ${
                    off ? "text-zinc-600" : h === new Date().getHours() && isToday ? "text-emerald-400" : "text-zinc-400"
                  }`}
                  style={{ minWidth: CELL_W }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {groupedRooms.map(([gameId, rs]) =>
            rs.map((r) => {
              const roomBookings = filteredBookings.filter((b) => b.roomId === r.id);
              const roomOpenPlay = filteredOpenPlay.filter((w) => w.roomId === r.id);

              const dayStart = date.getTime();
              const dayEnd = dayStart + 86400000;

              // Filter events that fall on this day
              const dayEvents = [
                ...roomBookings.map((b) => ({
                  type: "booking" as const,
                  id: b.id,
                  startTime: new Date(b.startTime).getTime(),
                  endTime: new Date(b.endTime).getTime(),
                  bookerName: b.bookerName,
                  status: b.status,
                  totalAmount: b.totalAmount,
                })),
                ...roomOpenPlay.map((w) => ({
                  type: "openplay" as const,
                  id: w.windowId,
                  startTime: new Date(w.startTime).getTime(),
                  endTime: new Date(w.endTime).getTime(),
                  notes: w.windowNotes,
                  matchSize: w.matchSize,
                })),
              ].filter((e) => e.startTime < dayEnd && e.endTime > dayStart);

              return (
                <div key={r.id} className="flex relative" style={{ height: ROW_H }}>
                  {/* Time cells */}
                  {HOURS.map(({ h }) => {
                    const off = h < 7 || h >= 22;
                    return (
                      <div
                        key={h}
                        className={`shrink-0 border-r border-b border-zinc-800/20 ${off ? "bg-zinc-900/15" : ""}`}
                        style={{ minWidth: CELL_W }}
                      />
                    );
                  })}

                  {/* Cards overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {dayEvents.map((item) => {
                      const eventStartH = Math.max((item.startTime - dayStart) / 3600000, 0);
                      const eventEndH = Math.min((item.endTime - dayStart) / 3600000, 24);
                      if (eventEndH <= eventStartH) return null;

                      const left = eventStartH * CELL_W;
                      const width = Math.max((eventEndH - eventStartH) * CELL_W - 4, 24);

                      if (item.type === "booking") {
                        const statusClass = STATUS_COLORS[item.status] ?? "bg-zinc-500/15 border-l-zinc-500";
                        const textClass = STATUS_TEXT[item.status] ?? "text-zinc-400";
                        return (
                          <div
                            key={item.id}
                            className={`absolute top-1.5 rounded-md border-l-2 px-2 py-1 pointer-events-auto overflow-hidden transition-shadow hover:shadow-lg hover:z-20 ${statusClass}`}
                            style={{ left: left + 2, width, height: ROW_H - 12 }}
                          >
                            <div className={`text-[9px] font-bold whitespace-nowrap ${textClass}`}>
                              {fmtTime(new Date(item.startTime).toISOString())}–{fmtTime(new Date(item.endTime).toISOString())}
                            </div>
                            <div className="text-[11px] font-semibold text-zinc-200 truncate">{item.bookerName}</div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={item.id}
                            className="absolute top-1.5 rounded-md border-l-2 border-l-violet-500 bg-violet-500/15 px-2 py-1 pointer-events-auto overflow-hidden transition-shadow hover:shadow-lg hover:z-20"
                            style={{ left: left + 2, width, height: ROW_H - 12 }}
                          >
                            <div className="text-[9px] font-bold text-violet-400 whitespace-nowrap">
                              {fmtTime(new Date(item.startTime).toISOString())}–{fmtTime(new Date(item.endTime).toISOString())}
                            </div>
                            <div className="text-[11px] font-semibold text-zinc-200 truncate">
                              OpenPlay{item.matchSize ? ` · ${item.matchSize}p` : ""}
                            </div>
                            {item.notes && (
                              <div className="text-[9px] text-zinc-500 truncate">{item.notes}</div>
                            )}
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
