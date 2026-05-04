"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type {
  RoomDto,
  RoomStatus,
  ScheduleWindowDto,
  ScheduleWindowRequest,
} from "@/lib/types";

const STATUSES: RoomStatus[] = [
  "Open",
  "OpenPlay",
  "Tournament",
  "Closed",
  "Maintenance",
];

interface FormState {
  status: RoomStatus;
  startTime: string;
  endTime: string;
  notes: string;
  seatRate: string;
  matchSize: string;
  queueCap: string;
}

const empty: FormState = {
  status: "Open",
  startTime: "",
  endTime: "",
  notes: "",
  seatRate: "",
  matchSize: "",
  queueCap: "",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Convert API ISO (UTC) to a value usable by <input type="datetime-local">
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  // datetime-local has no timezone — treat as user's local time
  return new Date(value).toISOString();
}

export default function RoomSchedulePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<RoomDto | null>(null);
  const [windows, setWindows] = useState<ScheduleWindowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [rooms, ws] = await Promise.all([
        apiClient<RoomDto[]>("/api/admin/rooms"),
        apiClient<ScheduleWindowDto[]>(`/api/admin/rooms/${roomId}/schedule`),
      ]);
      setRoom(rooms.find((r) => r.id === roomId) ?? null);
      setWindows(ws);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function startEdit(w: ScheduleWindowDto) {
    setEditingId(w.id);
    setForm({
      status: w.status,
      startTime: isoToLocalInput(w.startTime),
      endTime: isoToLocalInput(w.endTime),
      notes: w.notes ?? "",
      seatRate: w.seatRate?.toString() ?? "",
      matchSize: w.matchSize?.toString() ?? "",
      queueCap: w.queueCap?.toString() ?? "",
    });
  }

  function startNew() {
    setEditingId("new");
    setForm(empty);
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
    setError(null);
  }

  async function save() {
    if (!form.startTime || !form.endTime) {
      setError("Start and end times are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: ScheduleWindowRequest = {
        status: form.status,
        startTime: localInputToIso(form.startTime),
        endTime: localInputToIso(form.endTime),
        notes: form.notes || null,
        seatRate:
          form.status === "OpenPlay" && form.seatRate
            ? Number(form.seatRate)
            : null,
        matchSize:
          form.status === "OpenPlay" && form.matchSize
            ? Number(form.matchSize)
            : null,
        queueCap:
          form.status === "OpenPlay" && form.queueCap
            ? Number(form.queueCap)
            : null,
      };
      if (editingId === "new") {
        await apiClient<ScheduleWindowDto>(
          `/api/admin/rooms/${roomId}/schedule`,
          { method: "POST", body: JSON.stringify(body) }
        );
      } else if (editingId) {
        await apiClient<ScheduleWindowDto>(
          `/api/admin/schedule/${editingId}`,
          { method: "PUT", body: JSON.stringify(body) }
        );
      }
      cancel();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this window?")) return;
    setBusy(true);
    try {
      await apiClient<void>(`/api/admin/schedule/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <Link
          href="/admin/rooms"
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
        >
          ← Rooms
        </Link>

        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 block mb-3">
              Schedule
            </span>
            <h1 className="font-display text-[clamp(2rem,6vw,4rem)] uppercase tracking-[0.02em] text-chalk leading-none">
              {room?.name ?? "—"}
            </h1>
          </div>
          {editingId !== "new" && (
            <button
              onClick={startNew}
              className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-5 py-3"
            >
              + New Window
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 border border-rose-300/30 p-4 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {editingId === "new" && (
          <WindowForm
            form={form}
            setForm={setForm}
            onSave={save}
            onCancel={cancel}
            busy={busy}
            label="New Window"
          />
        )}

        {!windows ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
            Loading…
          </div>
        ) : windows.length === 0 && editingId !== "new" ? (
          <div className="border border-chalk/10 p-7 font-sans text-sm text-chalk/50">
            No windows configured. The room defaults to{" "}
            <span className="text-ace font-mono uppercase tracking-wider">
              Open
            </span>{" "}
            outside any window.
          </div>
        ) : (
          <div className="space-y-px bg-chalk/8 mt-6">
            {windows.map((w) =>
              editingId === w.id ? (
                <WindowForm
                  key={w.id}
                  form={form}
                  setForm={setForm}
                  onSave={save}
                  onCancel={cancel}
                  busy={busy}
                  label="Edit Window"
                />
              ) : (
                <div
                  key={w.id}
                  className="bg-pitch p-6 flex items-start justify-between gap-6 flex-wrap"
                >
                  <div>
                    <span
                      className={`font-mono text-[9px] tracking-[0.25em] uppercase border px-3 py-1.5 inline-block ${statusClass(
                        w.status
                      )}`}
                    >
                      {w.status}
                    </span>
                    <div className="font-mono text-[11px] tracking-[0.15em] text-chalk/70 mt-3">
                      {fmt(w.startTime)} → {fmt(w.endTime)}
                    </div>
                    {w.status === "OpenPlay" && (
                      <div className="font-mono text-[10px] tracking-[0.15em] text-chalk/50 mt-2">
                        ₱{w.seatRate?.toFixed(0)} · MatchSize {w.matchSize}
                        {w.queueCap ? ` · Cap ${w.queueCap}` : ""}
                      </div>
                    )}
                    {w.notes && (
                      <div className="font-sans text-xs text-chalk/40 mt-2">
                        {w.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(w)}
                      className="font-mono text-[10px] tracking-[0.15em] uppercase border border-chalk/20 text-chalk/60 hover:border-chalk hover:text-chalk px-4 py-2 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(w.id)}
                      className="font-mono text-[10px] tracking-[0.15em] uppercase border border-rose-300/30 text-rose-200 hover:bg-rose-300/10 px-4 py-2 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function statusClass(status: RoomStatus): string {
  switch (status) {
    case "Open":
      return "border-chalk/30 text-chalk";
    case "OpenPlay":
      return "border-emerald/40 text-emerald";
    case "Tournament":
      return "border-amber-300/40 text-amber-200";
    case "Closed":
      return "border-chalk/15 text-chalk/40";
    case "Maintenance":
      return "border-rose-300/30 text-rose-200";
  }
}

function WindowForm({
  form,
  setForm,
  onSave,
  onCancel,
  busy,
  label,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  label: string;
}) {
  const isOpenPlay = form.status === "OpenPlay";
  return (
    <div className="bg-court p-6 border border-ace/30 mb-6">
      <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace mb-5">
        {label}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Status" required>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as RoomStatus })
            }
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
        <Field label="Start Time (local)" required>
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
        <Field label="End Time (local)" required>
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>

        {isOpenPlay && (
          <>
            <Field label="Seat Rate (₱)" required>
              <input
                type="number"
                min={0}
                value={form.seatRate}
                onChange={(e) =>
                  setForm({ ...form, seatRate: e.target.value })
                }
                className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
              />
            </Field>
            <Field label="Match Size" required>
              <input
                type="number"
                min={2}
                value={form.matchSize}
                onChange={(e) =>
                  setForm({ ...form, matchSize: e.target.value })
                }
                className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
              />
            </Field>
            <Field label="Queue Cap (optional)">
              <input
                type="number"
                min={2}
                value={form.queueCap}
                onChange={(e) =>
                  setForm({ ...form, queueCap: e.target.value })
                }
                placeholder="Unlimited"
                className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
              />
            </Field>
          </>
        )}
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={onSave}
          disabled={busy}
          className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-6 py-3 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="font-mono text-[10px] tracking-[0.25em] uppercase border border-chalk/20 text-chalk/60 hover:text-chalk hover:border-chalk px-5 py-3 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/50 block mb-2">
        {label}
        {required && <span className="text-ace"> *</span>}
      </span>
      {children}
    </label>
  );
}
