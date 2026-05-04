"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { GameDto } from "@/lib/types";

interface FormState {
  name: string;
  description: string;
  iconUrl: string;
}

const empty: FormState = { name: "", description: "", iconUrl: "" };

export default function AdminGamesPage() {
  const [games, setGames] = useState<GameDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setGames(await apiClient<GameDto[]>("/api/games"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(g: GameDto) {
    setEditingId(g.id);
    setForm({
      name: g.name,
      description: g.description ?? "",
      iconUrl: g.iconUrl ?? "",
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
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        iconUrl: form.iconUrl || null,
      };
      if (editingId === "new") {
        await apiClient<GameDto>("/api/admin/games", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else if (editingId) {
        await apiClient<GameDto>(`/api/admin/games/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
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
    if (!confirm("Delete this game? Rooms must be removed first.")) return;
    setBusy(true);
    try {
      await apiClient<void>(`/api/admin/games/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <Link
            href="/admin"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 hover:text-zinc-300 transition mb-2 block"
          >
            ← Admin
          </Link>
          <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
            Games
          </h1>
        </div>
        {editingId !== "new" && (
          <button
            onClick={startNew}
            className="rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition px-4 py-2.5"
          >
            + New Game
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {editingId === "new" && (
        <Form
          form={form}
          setForm={setForm}
          onSave={save}
          onCancel={cancel}
          busy={busy}
          label="New Game"
        />
      )}

      {!games ? (
        <div className="text-sm text-zinc-500">Loading…</div>
      ) : games.length === 0 && editingId !== "new" ? (
        <div className="rounded-lg border border-zinc-800 p-6 text-sm text-zinc-500">
          No games yet.
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {games.map((g) =>
            editingId === g.id ? (
              <Form
                key={g.id}
                form={form}
                setForm={setForm}
                onSave={save}
                onCancel={cancel}
                busy={busy}
                label="Edit Game"
              />
            ) : (
              <div
                key={g.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 flex items-center justify-between gap-6 flex-wrap"
              >
                <div>
                  <div className="font-medium text-lg text-zinc-100">{g.name}</div>
                  {g.description && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {g.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(g)}
                    className="rounded-md font-mono text-[10px] tracking-[0.15em] uppercase border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 px-3.5 py-2 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    className="rounded-md font-mono text-[10px] tracking-[0.15em] uppercase border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 px-3.5 py-2 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

function Form({
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
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-zinc-900 p-5 mb-6">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-emerald-400 mb-4">
        {label}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Name" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
          />
        </Field>
        <Field label="Icon URL">
          <input
            value={form.iconUrl}
            onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
          />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
          />
        </Field>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onSave}
          disabled={busy || !form.name}
          className="rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition px-5 py-2.5 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="rounded-md font-mono text-[10px] tracking-[0.2em] uppercase border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 px-4 py-2.5 transition"
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
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 block mb-1.5">
        {label}
        {required && <span className="text-emerald-400"> *</span>}
      </span>
      {children}
    </label>
  );
}
