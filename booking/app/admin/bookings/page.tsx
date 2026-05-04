"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient, apiUpload } from "@/lib/api";
import type {
  AdminBookingListDto,
  CreateAdminBookingRequest,
  UserDto,
  GameDto,
  PaymentMethod,
  PaymentSummaryDto,
  RoomSlotDto,
  RoomAvailabilityDto,
  AvailabilityResponse,
} from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  PendingPayment: "bg-amber-500/15 text-amber-400",
  ProofSubmitted: "bg-sky-500/15 text-sky-400",
  Approved: "bg-emerald-500/15 text-emerald-400",
  Rejected: "bg-rose-500/15 text-rose-400",
  Expired: "bg-zinc-500/15 text-zinc-400",
  Cancelled: "bg-zinc-500/15 text-zinc-500",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  AwaitingProof: "bg-amber-500/15 text-amber-400",
  Submitted: "bg-sky-500/15 text-sky-400",
  Approved: "bg-emerald-500/15 text-emerald-400",
  Rejected: "bg-rose-500/15 text-rose-400",
  Outstanding: "bg-orange-500/15 text-orange-400",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBookingListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<AdminBookingListDto | null>(null);
  const [showSettle, setShowSettle] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await apiClient<{ items: AdminBookingListDto[]; total: number }>(
        `/api/admin/bookings?${params}`
      );
      setBookings(res.items);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setSearchInput("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  async function cancelBooking(id: string) {
    setBusyId(id);
    try {
      await apiClient(`/api/admin/bookings/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
            Bookings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage all bookings, create walk-in reservations.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition"
        >
          + Create Booking
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search user, room…"
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 w-48"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        />
        {(status || dateFrom || dateTo || search) && (
          <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-300 transition">Clear</button>
        )}
        <button onClick={applyFilters} className="ml-auto rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Booker</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Room</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Time</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Booking</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Payment</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500 text-sm">Loading…</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500 text-sm">No bookings found.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 cursor-pointer transition"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-zinc-200 font-medium">{b.bookerName}</div>
                      <div className="text-xs text-zinc-500">{b.bookerEmail}</div>
                      {b.bookerIsProvisional && (
                        <span className="text-[10px] text-violet-400">provisional</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-zinc-300">{b.roomName}</div>
                      <div className="text-xs text-zinc-500">{b.gameName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-zinc-300 font-mono">{fmtDate(b.startTime)}</div>
                      <div className="text-xs text-zinc-500 font-mono">{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-200 font-mono">₱{b.totalAmount.toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.payment ? (
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[b.payment.status]}`}>
                          {b.payment.status}{b.payment.method !== "GCash" ? ` · ${b.payment.method}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.payment?.status === "Outstanding" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(b); setShowSettle(true); }}
                            className="rounded-md text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition"
                          >
                            Settle
                          </button>
                        )}
                        {b.status !== "Cancelled" && b.status !== "Expired" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); cancelBooking(b.id); }}
                            disabled={busyId === b.id}
                            className="rounded-md text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition disabled:opacity-50"
                          >
                            {busyId === b.id ? "…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          booking={selected}
          onClose={() => { setSelected(null); setShowSettle(false); }}
          onSettle={() => setShowSettle(true)}
          onCancel={() => cancelBooking(selected.id)}
          onRefresh={load}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateBookingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {/* Settle Modal */}
      {showSettle && selected?.payment?.status === "Outstanding" && (
        <SettleModal
          booking={selected}
          payment={selected.payment}
          onClose={() => setShowSettle(false)}
          onSettled={() => { setShowSettle(false); load(); }}
        />
      )}
    </>
  );
}

function DetailModal({
  booking,
  onClose,
  onSettle,
  onCancel,
  onRefresh,
}: {
  booking: AdminBookingListDto;
  onClose: () => void;
  onSettle: () => void;
  onCancel: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg text-zinc-100 font-medium">Booking Details</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Booker" value={`${booking.bookerName}${booking.bookerIsProvisional ? " (provisional)" : ""}`} />
            <DetailItem label="Email" value={booking.bookerEmail} />
            <DetailItem label="Room" value={`${booking.roomName} (${booking.gameName})`} />
            <DetailItem label="Amount" value={`₱${booking.totalAmount.toFixed(0)}`} />
            <DetailItem label="Start" value={fmtDateTime(booking.startTime)} />
            <DetailItem label="End" value={fmtDateTime(booking.endTime)} />
            <DetailItem label="Booking Status" value={booking.status} />
            <DetailItem label="Payment" value={booking.payment ? `${booking.payment.status} (${booking.payment.method})` : "—"} />
          </div>
          {booking.notes && <DetailItem label="Notes" value={booking.notes} />}
          {booking.payment?.referenceNumber && <DetailItem label="Reference" value={booking.payment.referenceNumber} />}
          {booking.payment?.remarks && <DetailItem label="Remarks" value={booking.payment.remarks} />}
          {booking.payment?.reviewedAt && <DetailItem label="Reviewed" value={fmtDateTime(booking.payment.reviewedAt)} />}

          <div className="flex gap-3 pt-2">
            {booking.payment?.status === "Outstanding" && (
              <button onClick={onSettle} className="rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium px-4 py-2 hover:bg-orange-500/30 transition">
                Settle Payment
              </button>
            )}
            {booking.status !== "Cancelled" && booking.status !== "Expired" && (
              <button onClick={onCancel} className="rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-medium px-4 py-2 hover:bg-rose-500/25 transition">
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">{label}</div>
      <div className="text-sm text-zinc-200">{value}</div>
    </div>
  );
}

function CreateBookingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"user" | "booking" | "payment">("user");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [games, setGames] = useState<GameDto[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userDropdown, setUserDropdown] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Booking availability state
  type Mode = "week" | "month";
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });
  const [pickedRoomId, setPickedRoomId] = useState<string | null>(null);
  const [availData, setAvailData] = useState<AvailabilityResponse[]>([]);
  const [availBusy, setAvailBusy] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [selSlots, setSelSlots] = useState<string[]>([]);

  // Form state
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirst, setNewUserFirst] = useState("");
  const [newUserLast, setNewUserLast] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const days = mode === "week" ? 7 : 31;

  useEffect(() => {
    apiClient<GameDto[]>("/api/games").then(setGames).catch(() => {});
  }, []);

  useEffect(() => {
    if (userSearch.length >= 2) {
      apiClient<{ items: UserDto[] }>(`/api/admin/users?search=${encodeURIComponent(userSearch)}&pageSize=20`)
        .then((r) => setUsers(r.items))
        .catch(() => setUsers([]));
    } else {
      setUsers([]);
    }
  }, [userSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (step !== "booking") return;
    setAvailBusy(true);
    setAvailError(null);
    const from = anchor.toISOString();
    Promise.all(
      games.map((g) =>
        apiClient<AvailabilityResponse>(
          `/api/games/${g.id}/availability?from=${encodeURIComponent(from)}&days=${days}`
        ).catch(() => null)
      )
    ).then((results) => {
      setAvailData(results.filter(Boolean) as AvailabilityResponse[]);
      setAvailBusy(false);
      setPickedRoomId(null);
      setSelSlots([]);
    }).catch(() => {
      setAvailError("Failed to load availability");
      setAvailBusy(false);
    });
  }, [step, anchor, days, games]);

  const dayList = useMemo(() => {
    if (availData.length === 0) return [];
    const first = availData[0];
    if (!first) return [];
    const start = new Date(first.from);
    const out: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d.toISOString());
    }
    return out;
  }, [availData, days]);

  // Flatten all rooms across all games
  const allRooms = useMemo(() => {
    const out: RoomAvailabilityDto[] = [];
    for (const a of availData) {
      for (const r of a.rooms) {
        out.push(r);
      }
    }
    return out;
  }, [availData]);

  const pickedRoom = allRooms.find((r) => r.room.id === pickedRoomId) ?? null;

  // Compute estimated total
  const totalAmount = pickedRoom ? pickedRoom.room.hourlyRate * selSlots.length : 0;

  async function createProvisionalUser() {
    if (!newUserEmail.trim() || !newUserFirst.trim() || !newUserLast.trim()) {
      setError("Email, first name, and last name are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiClient<{ id: string; email: string }>(
        "/api/admin/users",
        {
          method: "POST",
          body: JSON.stringify({
            email: newUserEmail.trim(),
            firstName: newUserFirst.trim(),
            lastName: newUserLast.trim(),
            phoneNumber: newUserPhone.trim() || null,
          }),
        }
      );
      setSelectedUser({
        id: res.id,
        email: res.email,
        firstName: newUserFirst.trim(),
        lastName: newUserLast.trim(),
        phoneNumber: newUserPhone.trim() || null,
        role: "Player",
        isBanned: false,
        bannedAt: null,
        creationTime: new Date().toISOString(),
        trustScore: 50,
        outstandingBalance: 0,
        isProvisional: true,
      });
      setShowNewUser(false);
      setStep("booking");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

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

  function fmtHourRange(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", hour12: true });
  }

  function sameLocalDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }

  function shiftAnchor(direction: 1 | -1) {
    const next = new Date(anchor);
    next.setDate(anchor.getDate() + direction * days);
    const today = startOfDayLocal(new Date());
    // Allow going back for admin, but cap at 30 days ago
    const limit = new Date(today);
    limit.setDate(limit.getDate() - 30);
    if (next < limit) return;
    setAnchor(next);
    setPickedRoomId(null);
    setSelSlots([]);
  }

  function pickDay(iso: string) {
    setSelectedDay(iso);
    setPickedRoomId(null);
    setSelSlots([]);
  }

  function bucketDay(slots: RoomSlotDto[]) {
    const nowMs = Date.now();
    const futureOpen = slots.filter((s) => s.status === "Open" && new Date(s.start).getTime() > nowMs);
    const open = futureOpen.filter((s) => s.available);
    const blockingStatuses: RoomSlotDto["status"][] = ["Closed", "Tournament", "Maintenance"];
    const allBlocked = slots.length > 0 && slots.every((s) => blockingStatuses.includes(s.status));
    const blockedReason = allBlocked ? slots[0].status : null;
    return { open, openTotal: futureOpen.length, blockedReason };
  }

  function roomDayLabel(slots: RoomSlotDto[]): string {
    const { open, openTotal, blockedReason } = bucketDay(slots);
    if (blockedReason) return `${blockedReason} all day`;
    if (openTotal === 0) return "No slots today";
    if (open.length === 0) return "Fully booked";
    if (open.length === openTotal) return `All ${openTotal} slots open`;
    return `${open.length} of ${openTotal} open`;
  }

  function roomDayTone(slots: RoomSlotDto[]): "blocked" | "full" | "limited" | "ok" {
    const { open, openTotal, blockedReason } = bucketDay(slots);
    if (blockedReason) return "blocked";
    if (open.length === 0) return "full";
    if (openTotal > 0 && open.length <= openTotal / 4) return "limited";
    return "ok";
  }

  function pickRoom(roomId: string) {
    setPickedRoomId(roomId);
    setSelSlots([]);
  }

  function unpickRoom() {
    setPickedRoomId(null);
    setSelSlots([]);
  }

  function toggleSlot(slot: RoomSlotDto) {
    if (slot.status !== "Open" || !slot.available) return;
    if (selSlots.includes(slot.start)) {
      const sorted = [...selSlots].sort();
      if (sorted[0] === slot.start || sorted[sorted.length - 1] === slot.start) {
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

  async function submitBooking() {
    if (!pickedRoomId || selSlots.length === 0 || !selectedUser) {
      setError("Select a room and at least one time slot.");
      return;
    }

    const needsRef = payMethod === "GCash" || payMethod === "OnlineBanking";
    if (needsRef && !referenceNumber.trim() && !proofFile) {
      setError("Reference number or proof required for " + payMethod);
      return;
    }

    setBusy(true);
    try {
      const startTime = [...selSlots].sort()[0];

      const body: CreateAdminBookingRequest = {
        userId: selectedUser.id,
        roomId: pickedRoomId,
        startTime,
        hours: selSlots.length,
        notes: bookingNotes.trim() || null,
        paymentMethod: payMethod,
        referenceNumber: referenceNumber.trim() || null,
        remarks: remarks.trim() || null,
      };

      const res = await apiClient<{ id: string }>("/api/admin/bookings", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (proofFile && res.id) {
        const form = new FormData();
        form.append("file", proofFile);
        try {
          await apiUpload(`/api/admin/bookings/${res.id}/proof`, form);
        } catch {
          // proof upload is optional, don't fail
        }
      }

      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg text-zinc-100 font-medium">Create Booking</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg">×</button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Step indicators */}
          <div className="flex gap-2">
            {(["user", "booking", "payment"] as const).map((s, i) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${s === step ? "bg-emerald-500" : i < ["user", "booking", "payment"].indexOf(step) ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
            ))}
          </div>

          {/* Step 1: User Selection */}
          {step === "user" && (
            <div className="space-y-4">
              <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">Select or Create User</div>

              <div className="relative" ref={dropdownRef}>
                <input
                  value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})` : userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserDropdown(true); setSelectedUser(null); }}
                  onFocus={() => setUserDropdown(true)}
                  placeholder="Search by name or email…"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                {userDropdown && users.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 max-h-48 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setUserDropdown(false); setUserSearch(""); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition"
                      >
                        <span className="text-zinc-200">{u.firstName} {u.lastName}</span>
                        <span className="text-zinc-500 text-xs ml-2">{u.email}</span>
                        {u.isProvisional && <span className="text-violet-400 text-xs ml-1">(provisional)</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center text-zinc-500 text-sm">or</div>

              {!showNewUser ? (
                <button
                  onClick={() => setShowNewUser(true)}
                  className="w-full rounded-lg border border-dashed border-zinc-700 text-zinc-400 text-sm py-3 hover:border-zinc-500 hover:text-zinc-300 transition"
                >
                  + Create New User (Walk-in)
                </button>
              ) : (
                <div className="space-y-3 rounded-lg border border-zinc-700 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email *" className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                    <input value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} placeholder="Phone" className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                    <input value={newUserFirst} onChange={(e) => setNewUserFirst(e.target.value)} placeholder="First Name *" className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                    <input value={newUserLast} onChange={(e) => setNewUserLast(e.target.value)} placeholder="Last Name *" className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                  </div>
                  <button
                    onClick={createProvisionalUser}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition disabled:opacity-50"
                  >
                    {busy ? "Creating…" : "Create & Continue"}
                  </button>
                </div>
              )}

              {selectedUser && (
                <button
                  onClick={() => setStep("booking")}
                  className="w-full rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition"
                >
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* Step 2: Booking Details (availability-based) */}
          {step === "booking" && (
            <div className="space-y-4">
              <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">Pick Date & Room</div>

              {availError && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300 text-sm">{availError}</div>
              )}

              {/* Date strip */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => shiftAnchor(-1)} className="font-mono text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 px-2 py-1 transition">←</button>
                  <button onClick={() => { setAnchor(startOfDayLocal(new Date())); }} className="font-mono text-[10px] tracking-[0.15em] uppercase border border-zinc-700 text-zinc-400 hover:text-zinc-200 px-3 py-1 transition">Today</button>
                  <button onClick={() => shiftAnchor(1)} className="font-mono text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 px-2 py-1 transition">→</button>
                  <div className="flex bg-zinc-800 border border-zinc-700 ml-auto">
                    <button onClick={() => setMode("week")} className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 transition ${mode === "week" ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Week</button>
                    <button onClick={() => setMode("month")} className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 transition ${mode === "month" ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Month</button>
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {dayList.map((iso) => {
                    const isSelected = sameLocalDay(iso, selectedDay);
                    return (
                      <button key={iso} onClick={() => pickDay(iso)} className={`shrink-0 w-16 py-2 border text-center transition ${isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}>
                        <div className="font-mono text-[8px] tracking-[0.15em] uppercase">{fmtWeekday(iso)}</div>
                        <div className="text-sm font-medium mt-0.5">{fmtMonthDay(iso)}</div>
                      </button>
                    );
                  })}
                </div>
                {dayList.length > 0 && (
                  <div className="font-mono text-[10px] tracking-[0.15em] text-zinc-500 mt-2">
                    {fmtMonthDay(dayList[0])} — {fmtMonthDay(dayList[dayList.length - 1])}
                  </div>
                )}
              </div>

              {/* Selected date header */}
              <div className="text-sm text-zinc-300">
                <span className="text-zinc-500">Selected:</span>{" "}
                <span className="text-white font-medium">
                  {new Date(selectedDay).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>

              {availBusy && (
                <div className="text-center text-zinc-500 text-sm py-8">Loading availability…</div>
              )}

              {!pickedRoom ? (
                /* Room picker */
                <div className="space-y-px">
                  {allRooms.map((r) => {
                    const daySlots = r.slots.filter((s) => sameLocalDay(s.start, selectedDay));
                    const tone = roomDayTone(daySlots);
                    const label = roomDayLabel(daySlots);
                    const disabled = tone === "blocked" || tone === "full";
                    return (
                      <button
                        key={r.room.id}
                        onClick={() => !disabled && pickRoom(r.room.id)}
                        disabled={disabled}
                        className={`w-full text-left p-4 flex items-center justify-between gap-4 transition ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-zinc-800"}`}
                      >
                        <div className="min-w-0">
                          <div className="text-zinc-200 font-medium">{r.room.name}</div>
                          <div className={`font-mono text-[10px] tracking-[0.15em] uppercase mt-1 ${tone === "limited" ? "text-amber-400" : tone === "blocked" || tone === "full" ? "text-zinc-600" : "text-zinc-500"}`}>
                            {label}
                          </div>
                        </div>
                        {!disabled && <span className="text-emerald-500 text-sm">→</span>}
                      </button>
                    );
                  })}
                  {allRooms.length === 0 && !availBusy && (
                    <div className="text-center text-zinc-500 text-sm py-8">No rooms available for this period.</div>
                  )}
                </div>
              ) : (
                /* Slot picker for selected room */
                <div className="space-y-4">
                  <button onClick={unpickRoom} className="text-zinc-500 hover:text-zinc-300 text-sm">← Change Room</button>
                  <div className="text-zinc-200 font-medium">{pickedRoom.room.name} <span className="text-zinc-500">· ₱{pickedRoom.room.hourlyRate}/hr</span></div>

                  <AdminSlotGrid room={pickedRoom} selectedDay={selectedDay} selSlots={selSlots} onToggle={toggleSlot} />
                </div>
              )}

              {/* Selection summary */}
              {selSlots.length > 0 && pickedRoom && (
                <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4">
                  <div className="text-sm text-zinc-300">
                    <span className="text-zinc-500">Selected:</span> {pickedRoom.room.name} · {selSlots.length} hr{selSlots.length > 1 ? "s" : ""} · <span className="text-emerald-400 font-medium">₱{totalAmount.toFixed(0)}</span>
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-zinc-500 mt-1">
                    {fmtHourRange([...selSlots].sort()[0])} — {fmtHourRange(new Date(new Date([...selSlots].sort()[selSlots.length - 1]).getTime() + 3_600_000).toISOString())}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes (optional)</label>
                <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} rows={2} placeholder="Optional notes…" className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep("user"); setPickedRoomId(null); setSelSlots([]); }} className="flex-1 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium px-4 py-2 hover:bg-zinc-800 transition">← Back</button>
                <button
                  onClick={() => {
                    if (!pickedRoomId || selSlots.length === 0) {
                      setError("Select a room and at least one time slot.");
                      return;
                    }
                    setStep("payment");
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <div className="space-y-4">
              <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">Payment</div>

              {/* Booking summary */}
              {pickedRoom && selSlots.length > 0 && (
                <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 space-y-2">
                  <div className="text-sm text-zinc-300">
                    {pickedRoom.room.name} · {selSlots.length} hr{selSlots.length > 1 ? "s" : ""} · <span className="text-emerald-400 font-medium">₱{totalAmount.toFixed(0)}</span>
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-zinc-500">
                    {fmtHourRange([...selSlots].sort()[0])} — {fmtHourRange(new Date(new Date([...selSlots].sort()[selSlots.length - 1]).getTime() + 3_600_000).toISOString())}
                  </div>
                  {selectedUser && (
                    <div className="text-xs text-zinc-500">
                      Booked for: <span className="text-zinc-300">{selectedUser.firstName} {selectedUser.lastName}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                >
                  <option value="Cash">Cash (Walk-in)</option>
                  <option value="GCash">GCash</option>
                  <option value="OnlineBanking">Online Banking</option>
                </select>
              </div>

              {payMethod === "Cash" && (
                <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  Cash payment without reference will be marked as <strong>Outstanding</strong> (pay later).
                </div>
              )}

              {(payMethod === "GCash" || payMethod === "OnlineBanking") && (
                <div className="space-y-3">
                  <input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Reference / Transaction Number"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Proof Screenshot (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-zinc-400 file:rounded-lg file:bg-zinc-800 file:border file:border-zinc-700 file:text-zinc-300 file:px-3 file:py-1.5 file:mr-3"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Remarks (optional)</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Any additional notes…" className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("booking")} className="flex-1 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium px-4 py-2 hover:bg-zinc-800 transition">← Back</button>
                <button
                  onClick={submitBooking}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {busy ? "Creating…" : "Create Booking"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettleModal({
  booking,
  payment,
  onClose,
  onSettled,
}: {
  booking: AdminBookingListDto;
  payment: PaymentSummaryDto;
  onClose: () => void;
  onSettled: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    try {
      await apiClient(`/api/admin/bookings/${payment.id}/settle`, {
        method: "POST",
        body: JSON.stringify({
          method,
          referenceNumber: ref.trim() || null,
          remarks: remarks.trim() || null,
        }),
      });
      onSettled();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg text-zinc-100 font-medium">Settle Payment</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">{error}</div>
          )}

          <div className="text-sm text-zinc-300">
            Settling <span className="text-white font-medium">₱{payment.amount.toFixed(0)}</span> for {booking.bookerName}
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500">
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="OnlineBanking">Online Banking</option>
            </select>
          </div>

          {(method === "GCash" || method === "OnlineBanking") && (
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Reference / Transaction Number"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          )}

          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks (optional)"
            rows={2}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {busy ? "Processing…" : "Settle Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminSlotGrid({
  room,
  selectedDay,
  selSlots,
  onToggle,
}: {
  room: RoomAvailabilityDto;
  selectedDay: string;
  selSlots: string[];
  onToggle: (slot: RoomSlotDto) => void;
}) {
  const daySlots = room.slots.filter((s) => sameLocalDay(s.start, selectedDay));
  const nowMs = Date.now();
  const open = daySlots.filter((s) => s.status === "Open" && s.available && new Date(s.start).getTime() > nowMs);

  function fmtHour(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function isAm(iso: string): boolean {
    return new Date(iso).getHours() < 12;
  }

  const am = open.filter((s) => isAm(s.start));
  const pm = open.filter((s) => !isAm(s.start));

  if (open.length === 0) {
    return (
      <div className="border border-zinc-700 p-6 text-sm text-zinc-500 text-center">
        No available slots for this room on this date.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {am.length > 0 && (
        <div>
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500 mb-2">Morning · AM</div>
          <div className="grid grid-cols-2 gap-2">
            {am.map((s) => (
              <button
                key={s.start}
                onClick={() => onToggle(s)}
                className={`flex items-center justify-between px-4 py-3 border transition text-left ${selSlots.includes(s.start) ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:bg-zinc-800"}`}
              >
                <span className="font-medium">{fmtHour(s.start)}</span>
                <span className={`font-mono text-[9px] tracking-[0.15em] uppercase ${selSlots.includes(s.start) ? "text-white/70" : "text-zinc-500"}`}>60min</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {am.length > 0 && pm.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-zinc-600">Noon</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>
      )}

      {pm.length > 0 && (
        <div>
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500 mb-2">Afternoon &amp; Evening · PM</div>
          <div className="grid grid-cols-2 gap-2">
            {pm.map((s) => (
              <button
                key={s.start}
                onClick={() => onToggle(s)}
                className={`flex items-center justify-between px-4 py-3 border transition text-left ${selSlots.includes(s.start) ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:bg-zinc-800"}`}
              >
                <span className="font-medium">{fmtHour(s.start)}</span>
                <span className={`font-mono text-[9px] tracking-[0.15em] uppercase ${selSlots.includes(s.start) ? "text-white/70" : "text-zinc-500"}`}>60min</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function sameLocalDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }
}
