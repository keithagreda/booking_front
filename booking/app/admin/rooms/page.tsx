"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, apiUpload } from "@/lib/api";
import type { GameDto, RoomDto } from "@/lib/types";

interface FormState {
  gameId: string;
  name: string;
  description: string;
  capacity: number;
  hourlyRate: number;
}

const empty: FormState = {
  gameId: "",
  name: "",
  description: "",
  capacity: 4,
  hourlyRate: 0,
};

export default function AdminRoomsPage() {
  const [games, setGames] = useState<GameDto[]>([]);
  const [rooms, setRooms] = useState<RoomDto[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [imageEditingId, setImageEditingId] = useState<string | null>(null);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);

  async function uploadImage(roomId: string, file: File) {
    setImageBusyId(roomId);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await apiUpload<RoomDto>(`/api/admin/rooms/${roomId}/image`, fd);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImageBusyId(null);
    }
  }

  async function removeImage(roomId: string) {
    if (!confirm("Remove this room's image?")) return;
    setImageBusyId(roomId);
    setError(null);
    try {
      await apiClient<RoomDto>(`/api/admin/rooms/${roomId}/image`, {
        method: "DELETE",
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImageBusyId(null);
    }
  }

  async function load() {
    try {
      const [g, r] = await Promise.all([
        apiClient<GameDto[]>("/api/games"),
        apiClient<RoomDto[]>(
          filter ? `/api/admin/rooms?gameId=${filter}` : "/api/admin/rooms"
        ),
      ]);
      setGames(g);
      setRooms(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function startEdit(r: RoomDto) {
    setEditingId(r.id);
    setForm({
      gameId: r.gameId,
      name: r.name,
      description: r.description ?? "",
      capacity: r.capacity,
      hourlyRate: r.hourlyRate,
    });
  }

  function startNew() {
    setEditingId("new");
    setForm({ ...empty, gameId: filter || games[0]?.id || "" });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const base = {
        name: form.name,
        description: form.description || null,
        capacity: form.capacity,
        hourlyRate: form.hourlyRate,
      };
      if (editingId === "new") {
        await apiClient<RoomDto>("/api/admin/rooms", {
          method: "POST",
          body: JSON.stringify({ ...base, gameId: form.gameId }),
        });
      } else if (editingId) {
        await apiClient<RoomDto>(`/api/admin/rooms/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(base),
        });
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
    if (!confirm("Delete this room?")) return;
    setBusy(true);
    try {
      await apiClient<void>(`/api/admin/rooms/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function gameName(id: string): string {
    return games.find((g) => g.id === id)?.name ?? "—";
  }

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <Link
          href="/admin"
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
        >
          ← Admin
        </Link>

        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase tracking-[0.02em] text-chalk leading-none">
            Rooms
          </h1>
          {editingId !== "new" && games.length > 0 && (
            <button
              onClick={startNew}
              className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-5 py-3"
            >
              + New Room
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/40">
            Filter:
          </span>
          <button
            onClick={() => setFilter("")}
            className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 transition ${
              filter === "" ? "bg-ace text-pitch" : "border border-chalk/15 text-chalk/60"
            }`}
          >
            All
          </button>
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 transition ${
                filter === g.id
                  ? "bg-ace text-pitch"
                  : "border border-chalk/15 text-chalk/60 hover:border-chalk"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 border border-rose-300/30 p-4 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {editingId === "new" && (
          <RoomForm
            form={form}
            setForm={setForm}
            games={games}
            allowGameSelect
            onSave={save}
            onCancel={cancel}
            busy={busy}
            label="New Room"
          />
        )}

        {!rooms ? (
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
            Loading…
          </div>
        ) : rooms.length === 0 && editingId !== "new" ? (
          <div className="border border-chalk/10 p-7 font-sans text-sm text-chalk/50">
            No rooms yet.
          </div>
        ) : (
          <div className="space-y-px bg-chalk/8 mt-6">
            {rooms.map((r) =>
              editingId === r.id ? (
                <RoomForm
                  key={r.id}
                  form={form}
                  setForm={setForm}
                  games={games}
                  allowGameSelect={false}
                  onSave={save}
                  onCancel={cancel}
                  busy={busy}
                  label="Edit Room"
                />
              ) : (
                <div key={r.id} className="bg-pitch p-6">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="flex items-center gap-5 min-w-0">
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          className="w-20 h-20 object-cover border border-chalk/15 shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 grid place-items-center border border-dashed border-chalk/15 font-mono text-[8px] tracking-[0.25em] uppercase text-chalk/30 shrink-0">
                          No Image
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/40 mb-1">
                          {gameName(r.gameId)}
                        </div>
                        <div className="font-display text-2xl text-chalk truncate">
                          {r.name}
                        </div>
                        <div className="font-mono text-[10px] tracking-[0.15em] text-chalk/50 mt-1">
                          Capacity {r.capacity} · ₱{r.hourlyRate.toFixed(0)}/hr
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/admin/rooms/${r.id}/schedule`}
                        className="font-mono text-[10px] tracking-[0.15em] uppercase border border-ace/40 text-ace hover:bg-ace hover:text-pitch px-4 py-2 transition"
                      >
                        Schedule
                      </Link>
                      <button
                        onClick={() =>
                          setImageEditingId(imageEditingId === r.id ? null : r.id)
                        }
                        className={`font-mono text-[10px] tracking-[0.15em] uppercase border px-4 py-2 transition ${
                          imageEditingId === r.id
                            ? "bg-ace text-pitch border-ace"
                            : "border-chalk/20 text-chalk/60 hover:border-chalk hover:text-chalk"
                        }`}
                      >
                        Image
                      </button>
                      <button
                        onClick={() => startEdit(r)}
                        className="font-mono text-[10px] tracking-[0.15em] uppercase border border-chalk/20 text-chalk/60 hover:border-chalk hover:text-chalk px-4 py-2 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="font-mono text-[10px] tracking-[0.15em] uppercase border border-rose-300/30 text-rose-200 hover:bg-rose-300/10 px-4 py-2 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {imageEditingId === r.id && (
                    <div className="mt-5 pt-5 border-t border-chalk/10 flex flex-col gap-3">
                      <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace">
                        Room Image
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(r.id, f);
                            e.currentTarget.value = "";
                          }}
                          disabled={imageBusyId === r.id}
                          className="block text-chalk/70 font-mono text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ace file:text-pitch file:font-bold file:tracking-[0.15em] file:uppercase"
                        />
                        {r.imageUrl && (
                          <button
                            onClick={() => removeImage(r.id)}
                            disabled={imageBusyId === r.id}
                            className="font-mono text-[10px] tracking-[0.15em] uppercase border border-rose-300/30 text-rose-200 hover:bg-rose-300/10 px-4 py-2 transition disabled:opacity-50"
                          >
                            Remove Image
                          </button>
                        )}
                        {imageBusyId === r.id && (
                          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-chalk/50">
                            Working…
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function RoomForm({
  form,
  setForm,
  games,
  allowGameSelect,
  onSave,
  onCancel,
  busy,
  label,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  games: GameDto[];
  allowGameSelect: boolean;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  label: string;
}) {
  return (
    <div className="bg-court p-6 border border-ace/30 mb-6">
      <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace mb-5">
        {label}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {allowGameSelect && (
          <Field label="Game" required>
            <select
              value={form.gameId}
              onChange={(e) => setForm({ ...form, gameId: e.target.value })}
              className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
            >
              <option value="">Select a game…</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Name" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
        <Field label="Capacity" required>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
        <Field label="Hourly Rate (₱)" required>
          <input
            type="number"
            min={0}
            step="1"
            value={form.hourlyRate}
            onChange={(e) =>
              setForm({ ...form, hourlyRate: Number(e.target.value) })
            }
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={onSave}
          disabled={busy || !form.name || (allowGameSelect && !form.gameId)}
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/50 block mb-2">
        {label}
        {required && <span className="text-ace"> *</span>}
      </span>
      {children}
    </label>
  );
}
