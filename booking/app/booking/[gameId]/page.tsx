"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  AvailabilityResponse,
  BookingDto,
  CreateRegularBookingRequest,
  RoomAvailabilityDto,
  RoomSlotDto,
} from "@/lib/types";

type Mode = "week" | "month";

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtMonthDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtWeekday(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function fmtFullDate(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return `${weekday}, ${monthDay}`;
}

function fmtHour(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, " ");
}

function isAm(iso: string): boolean {
  return new Date(iso).getHours() < 12;
}

function fmtHour12(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", hour12: true });
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

interface DaySlots {
  open: RoomSlotDto[]; // bookable: future + available
  openTotal: number; // for "X of Y" copy: future open slots regardless of taken
  openPlayWindows: RoomSlotDto[]; // future, distinct windows
  blockedReason: string | null;
}

function bucketDay(slots: RoomSlotDto[]): DaySlots {
  const nowMs = Date.now();
  const futureOpen = slots.filter(
    (s) => s.status === "Open" && new Date(s.start).getTime() > nowMs
  );
  const open = futureOpen.filter((s) => s.available);

  const seen = new Set<string>();
  const openPlayWindows: RoomSlotDto[] = [];
  for (const s of slots) {
    if (
      s.status === "OpenPlay" &&
      s.windowId &&
      !seen.has(s.windowId) &&
      new Date(s.end).getTime() > nowMs
    ) {
      seen.add(s.windowId);
      openPlayWindows.push(s);
    }
  }

  const blockingStatuses: RoomSlotDto["status"][] = [
    "Closed",
    "Tournament",
    "Maintenance",
  ];
  const allBlocked =
    slots.length > 0 && slots.every((s) => blockingStatuses.includes(s.status));
  const blockedReason = allBlocked ? slots[0].status : null;
  return { open, openTotal: futureOpen.length, openPlayWindows, blockedReason };
}

function roomDayLabel(room: RoomAvailabilityDto, dayIso: string): string {
  const slots = room.slots.filter((s) => sameLocalDay(s.start, dayIso));
  const { open, openTotal, openPlayWindows, blockedReason } = bucketDay(slots);
  if (blockedReason) return `${blockedReason} all day`;
  const op = openPlayWindows.length > 0 ? ` · ${openPlayWindows.length} open play` : "";
  if (openTotal === 0 && openPlayWindows.length > 0) return `Open play${op}`;
  if (open.length === 0 && openPlayWindows.length === 0)
    return openTotal === 0 ? "No remaining slots today" : "Fully booked";
  if (open.length === openTotal && openTotal > 0)
    return `All ${openTotal} slots open${op}`;
  return `${open.length} of ${openTotal} open${op}`;
}

function roomDayTone(
  room: RoomAvailabilityDto,
  dayIso: string
): "blocked" | "full" | "limited" | "ok" {
  const slots = room.slots.filter((s) => sameLocalDay(s.start, dayIso));
  const { open, openTotal, openPlayWindows, blockedReason } = bucketDay(slots);
  if (blockedReason) return "blocked";
  if (open.length === 0 && openPlayWindows.length === 0) return "full";
  if (openTotal > 0 && open.length <= openTotal / 4) return "limited";
  return "ok";
}

export default function GameCalendarPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState<Date>(() => startOfDayLocal(new Date()));
  const [selectedDay, setSelectedDay] = useState<string>(() =>
    startOfDayLocal(new Date()).toISOString()
  );
  const [pickedRoomId, setPickedRoomId] = useState<string | null>(null);

  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selSlots, setSelSlots] = useState<string[]>([]);

  const days = mode === "week" ? 7 : 31;

  useEffect(() => {
    const from = anchor.toISOString();
    setData(null);
    apiClient<AvailabilityResponse>(
      `/api/games/${gameId}/availability?from=${encodeURIComponent(from)}&days=${days}`
    )
      .then((r) => {
        setData(r);
        if (
          !r.rooms.flatMap((rr) => rr.slots).some((s) => sameLocalDay(s.start, selectedDay))
        ) {
          setSelectedDay(r.from);
        }
      })
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, anchor, days]);

  const dayList = useMemo(() => {
    if (!data) return [];
    const out: string[] = [];
    const start = new Date(data.from);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d.toISOString());
    }
    return out;
  }, [data, days]);

  const pickedRoom =
    pickedRoomId && data ? data.rooms.find((r) => r.room.id === pickedRoomId) ?? null : null;
  const totalAmount = pickedRoom ? pickedRoom.room.hourlyRate * selSlots.length : 0;

  function clearSelection() {
    setSelSlots([]);
  }

  function pickRoom(roomId: string) {
    setPickedRoomId(roomId);
    setSelSlots([]);
  }

  function unpickRoom() {
    setPickedRoomId(null);
    setSelSlots([]);
  }

  function pickDay(iso: string) {
    setSelectedDay(iso);
    setPickedRoomId(null);
    setSelSlots([]);
  }

  function shiftAnchor(direction: 1 | -1) {
    const next = new Date(anchor);
    next.setDate(anchor.getDate() + direction * days);
    const today = startOfDayLocal(new Date());
    if (next < today) return;
    setAnchor(next);
    setPickedRoomId(null);
    setSelSlots([]);
  }

  function jumpToToday() {
    setAnchor(startOfDayLocal(new Date()));
    setPickedRoomId(null);
    setSelSlots([]);
  }

  const today = startOfDayLocal(new Date());
  const canGoPrev = anchor.getTime() > today.getTime();

  function toggleSlot(slot: RoomSlotDto) {
    if (slot.status !== "Open" || !slot.available) return;

    if (selSlots.includes(slot.start)) {
      const sorted = [...selSlots].sort();
      if (
        sorted[0] === slot.start ||
        sorted[sorted.length - 1] === slot.start
      ) {
        setSelSlots(selSlots.filter((s) => s !== slot.start));
      }
      return;
    }

    if (selSlots.length === 0) {
      setSelSlots([slot.start]);
      return;
    }

    const sorted = [...selSlots].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const hourBefore = new Date(new Date(first).getTime() - 3_600_000).toISOString();
    const hourAfter = new Date(new Date(last).getTime() + 3_600_000).toISOString();

    if (slot.start === hourBefore || slot.start === hourAfter) {
      setSelSlots([...sorted, slot.start].sort());
    } else {
      setSelSlots([slot.start]);
    }
  }

  async function handleContinue() {
    if (!user) {
      router.push(`/login?callbackUrl=/booking/${gameId}`);
      return;
    }
    if (!pickedRoomId || selSlots.length === 0) return;
    setSubmitting(true);
    try {
      const startTime = [...selSlots].sort()[0];
      const body: CreateRegularBookingRequest = {
        roomId: pickedRoomId,
        startTime,
        hours: selSlots.length,
      };
      const booking = await apiClient<BookingDto>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/checkout/${booking.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-pitch pt-28 pb-28 px-6">
        <div className="max-w-5xl mx-auto font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
          Loading availability…
        </div>
      </main>
    );
  }

  // Day-wide open play windows (across all rooms) — surface at top of room picker
  const dayOpenPlayWindows: { room: RoomAvailabilityDto; window: RoomSlotDto }[] = [];
  if (!pickedRoom) {
    for (const r of data.rooms) {
      const daySlots = r.slots.filter((s) => sameLocalDay(s.start, selectedDay));
      const { openPlayWindows } = bucketDay(daySlots);
      for (const w of openPlayWindows) dayOpenPlayWindows.push({ room: r, window: w });
    }
  }

  return (
    <main className="min-h-screen bg-pitch pt-12 pb-40">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <Link
              href="/booking"
              className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
            >
              ← All Games
            </Link>
            <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] uppercase tracking-[0.02em] text-chalk leading-none">
              {data.game.name}
            </h1>
          </div>
          <div className="flex bg-chalk/5 border border-chalk/10">
            <button
              onClick={() => setMode("week")}
              className={`font-mono text-[10px] tracking-[0.25em] uppercase px-5 py-2.5 transition ${mode === "week" ? "bg-ace text-pitch" : "text-chalk/60 hover:text-chalk"
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setMode("month")}
              className={`font-mono text-[10px] tracking-[0.25em] uppercase px-5 py-2.5 transition ${mode === "month" ? "bg-ace text-pitch" : "text-chalk/60 hover:text-chalk"
                }`}
            >
              Month
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 border border-rose-300/30 p-5 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {/* ── Date strip + nav ── */}
        <div className="mb-12">
          <div className="flex flex-col items-start mb-3 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftAnchor(-1)}
                disabled={!canGoPrev}
                aria-label="Previous range"
                className="font-mono text-[12px] tracking-[0.15em] uppercase border border-chalk/15 text-chalk/70 hover:border-chalk hover:text-chalk px-3 py-2 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-chalk/15 disabled:hover:text-chalk/70"
              >
                ←
              </button>
              <button
                onClick={jumpToToday}
                className="font-mono text-[10px] tracking-[0.25em] uppercase border border-chalk/15 text-chalk/70 hover:border-chalk hover:text-chalk px-4 py-2 transition"
              >
                Today
              </button>
              <button
                onClick={() => shiftAnchor(1)}
                aria-label="Next range"
                className="font-mono text-[12px] tracking-[0.15em] uppercase border border-chalk/15 text-chalk/70 hover:border-chalk hover:text-chalk px-3 py-2 transition"
              >
                →
              </button>
            </div>
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/45">
              {dayList.length > 0 && (
                <>
                  {fmtMonthDay(dayList[0])} — {fmtMonthDay(dayList[dayList.length - 1])}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2">
            {dayList.map((iso) => {
              const isSelected = sameLocalDay(iso, selectedDay);
              return (
                <button
                  key={iso}
                  onClick={() => pickDay(iso)}
                  className={`shrink-0 w-20 py-3 border transition text-center ${isSelected
                    ? "bg-ace text-pitch border-ace"
                    : "border-chalk/10 text-chalk/60 hover:border-chalk/40"
                    }`}
                >
                  <div className="font-mono text-[9px] tracking-[0.25em] uppercase">
                    {fmtWeekday(iso)}
                  </div>
                  <div className="font-display text-xl mt-1">{fmtMonthDay(iso)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected date header ── */}
        <div className="mb-10">
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-ace mb-3">
            01 — Selected Date
          </div>
          <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] text-chalk leading-none">
            {fmtFullDate(selectedDay)}
          </h2>

          {pickedRoom?.room.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pickedRoom.room.imageUrl}
              alt={pickedRoom.room.name}
              className="mt-6 w-full max-h-[320px] object-cover border border-chalk/10"
            />
          )}
        </div>

        {!pickedRoom ? (
          <RoomPicker
            rooms={data.rooms}
            selectedDay={selectedDay}
            openPlayWindows={dayOpenPlayWindows}
            onPickRoom={pickRoom}
            onPickOpenPlay={(windowId) => router.push(`/openplay/${windowId}`)}
          />
        ) : (
          <RoomTimes
            room={pickedRoom}
            selectedDay={selectedDay}
            selSlots={selSlots}
            onToggle={toggleSlot}
            onBack={unpickRoom}
            onPickOpenPlay={(windowId) => router.push(`/openplay/${windowId}`)}
          />
        )}

        {selSlots.length > 0 && pickedRoom && (
          <div className="fixed bottom-0 left-0 right-0 bg-court border-t border-ace/40 z-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-6 flex-wrap">
              <div>
                <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/40 mb-1">
                  Selection
                </div>
                <div className="font-display text-2xl text-chalk leading-none">
                  {pickedRoom.room.name} · {selSlots.length} hr
                  {selSlots.length > 1 ? "s" : ""} ·{" "}
                  <span className="text-ace">₱{totalAmount.toFixed(0)}</span>
                </div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-chalk/50 mt-1.5">
                  {fmtHour12([...selSlots].sort()[0])} —{" "}
                  {fmtHour12(
                    new Date(
                      new Date([...selSlots].sort()[selSlots.length - 1]).getTime() +
                      3_600_000
                    ).toISOString()
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearSelection}
                  className="font-mono text-[10px] tracking-[0.25em] uppercase border border-chalk/20 text-chalk/60 hover:text-chalk hover:border-chalk px-5 py-3 transition"
                >
                  Clear
                </button>
                <button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-7 py-3 disabled:opacity-50"
                >
                  {submitting ? "Reserving…" : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function RoomPicker({
  rooms,
  selectedDay,
  openPlayWindows,
  onPickRoom,
  onPickOpenPlay,
}: {
  rooms: RoomAvailabilityDto[];
  selectedDay: string;
  openPlayWindows: { room: RoomAvailabilityDto; window: RoomSlotDto }[];
  onPickRoom: (roomId: string) => void;
  onPickOpenPlay: (windowId: string) => void;
}) {
  return (
    <div className="mb-12">
      <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-ace mb-6">
        02 — Pick a Room
      </div>

      {openPlayWindows.length > 0 && (
        <div className="mb-8">
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-emerald mb-3">
            Open Play Today
          </div>
          <div className="space-y-px bg-emerald/30">
            {openPlayWindows.map(({ room, window: w }) => (
              <button
                key={w.windowId}
                onClick={() => onPickOpenPlay(w.windowId!)}
                className="w-full text-left bg-pitch hover:bg-court transition p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-emerald mb-1">
                    {room.room.name}
                  </div>
                  <div className="font-display text-2xl text-chalk">
                    {fmtHour12(w.start)}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-chalk/50 mt-1">
                    Drop in · {w.queueLength ?? 0} in queue
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-px bg-chalk/8">
        {rooms.map((r) => {
          const tone = roomDayTone(r, selectedDay);
          const label = roomDayLabel(r, selectedDay);
          const disabled = tone === "blocked" || tone === "full";
          return (
            <button
              key={r.room.id}
              onClick={() => !disabled && onPickRoom(r.room.id)}
              disabled={disabled}
              className={`w-full text-left bg-pitch p-6 flex items-center justify-between gap-4 transition ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-court hover:pl-7"
                }`}
            >
              <div className="flex items-center gap-5 min-w-0">
                {r.room.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.room.imageUrl}
                    alt={r.room.name}
                    className="w-20 h-20 object-cover border border-chalk/10 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-chalk/5 border border-dashed border-chalk/15 grid place-items-center font-mono text-[8px] tracking-[0.25em] uppercase text-chalk/25 shrink-0">
                    Room
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-display text-2xl text-chalk leading-none truncate">
                    {r.room.name}
                  </div>
                  <div
                    className={`font-mono text-[10px] tracking-[0.2em] uppercase mt-2 ${tone === "limited"
                      ? "text-amber-200"
                      : tone === "blocked" || tone === "full"
                        ? "text-chalk/30"
                        : "text-chalk/55"
                      }`}
                  >
                    {label}
                  </div>
                </div>
              </div>
              {!disabled && (
                <span className="font-mono text-[12px] tracking-[0.15em] text-ace shrink-0">
                  →
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoomTimes({
  room,
  selectedDay,
  selSlots,
  onToggle,
  onBack,
  onPickOpenPlay,
}: {
  room: RoomAvailabilityDto;
  selectedDay: string;
  selSlots: string[];
  onToggle: (slot: RoomSlotDto) => void;
  onBack: () => void;
  onPickOpenPlay: (windowId: string) => void;
}) {
  const daySlots = room.slots.filter((s) => sameLocalDay(s.start, selectedDay));
  const { open, openPlayWindows, blockedReason } = bucketDay(daySlots);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-2"
          >
            ← Change Room
          </button>
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-ace mb-1">
            02 — {room.room.name}
          </div>
        </div>
      </div>

      {blockedReason && (
        <div className="border border-chalk/10 p-5 font-mono text-[11px] tracking-[0.2em] uppercase text-chalk/40">
          {blockedReason} all day
        </div>
      )}

      {openPlayWindows.length > 0 && (
        <div className="space-y-px bg-emerald/30 mb-4">
          {openPlayWindows.map((w) => (
            <button
              key={w.windowId}
              onClick={() => onPickOpenPlay(w.windowId!)}
              className="w-full text-left bg-pitch hover:bg-court transition p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-emerald mb-1">
                  Open Play
                </div>
                <div className="font-display text-2xl text-chalk">
                  {fmtHour12(w.start)}
                </div>
                <div className="font-mono text-[10px] tracking-[0.15em] text-chalk/50 mt-1">
                  Drop in · {w.queueLength ?? 0} in queue
                </div>
              </div>
              <span className="font-mono text-[12px] tracking-[0.15em] text-emerald">
                →
              </span>
            </button>
          ))}
        </div>
      )}

      {open.length > 0 && (
        <SlotGrid open={open} selSlots={selSlots} onToggle={onToggle} />
      )}

      {open.length === 0 && openPlayWindows.length === 0 && !blockedReason && (
        <div className="border border-chalk/10 p-6 font-sans text-sm text-chalk/50">
          No remaining times for this room today.
        </div>
      )}
    </div>
  );
}

function SlotGrid({
  open,
  selSlots,
  onToggle,
}: {
  open: RoomSlotDto[];
  selSlots: string[];
  onToggle: (slot: RoomSlotDto) => void;
}) {
  const am = open.filter((s) => isAm(s.start));
  const pm = open.filter((s) => !isAm(s.start));

  return (
    <div className="space-y-7">
      {am.length > 0 && (
        <div>
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-chalk/35 mb-3">
            Morning · AM
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {am.map((s) => (
              <SlotTile
                key={s.start}
                slot={s}
                selected={selSlots.includes(s.start)}
                onClick={() => onToggle(s)}
              />
            ))}
          </div>
        </div>
      )}

      {am.length > 0 && pm.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-chalk/10" />
          <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-chalk/30">
            Noon
          </span>
          <div className="flex-1 h-px bg-chalk/10" />
        </div>
      )}

      {pm.length > 0 && (
        <div>
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-chalk/35 mb-3">
            Afternoon &amp; Evening · PM
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pm.map((s) => (
              <SlotTile
                key={s.start}
                slot={s}
                selected={selSlots.includes(s.start)}
                onClick={() => onToggle(s)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlotTile({
  slot,
  selected,
  onClick,
}: {
  slot: RoomSlotDto;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-4 border transition text-left ${selected
        ? "bg-ace text-pitch border-ace"
        : "border-chalk/15 bg-chalk/[0.02] text-chalk hover:border-ace hover:bg-chalk/[0.05]"
        }`}
    >
      <span className="font-display text-2xl leading-none tabular-nums">
        {fmtHour(slot.start)}
      </span>
      <span
        className={`font-mono text-[10px] tracking-[0.15em] uppercase ${selected ? "text-pitch/70" : "text-chalk/40"
          }`}
      >
        60min
      </span>
    </button>
  );
}
