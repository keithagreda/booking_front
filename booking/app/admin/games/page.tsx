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
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <Link
          href="/admin"
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
        >
          ← Admin
        </Link>

        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase tracking-[0.02em] text-chalk leading-none">
            Games
          </h1>
          {editingId !== "new" && (
            <button
              onClick={startNew}
              className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-5 py-3"
            >
              + New Game
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 border border-rose-300/30 p-4 text-rose-200 font-mono text-xs">
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
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30">
            Loading…
          </div>
        ) : games.length === 0 && editingId !== "new" ? (
          <div className="border border-chalk/10 p-7 font-sans text-sm text-chalk/50">
            No games yet.
          </div>
        ) : (
          <div className="space-y-px bg-chalk/8 mt-6">
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
                  className="bg-pitch p-6 flex items-center justify-between gap-6 flex-wrap"
                >
                  <div>
                    <div className="font-display text-2xl text-chalk">{g.name}</div>
                    {g.description && (
                      <div className="font-sans text-xs text-chalk/50 mt-1">
                        {g.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(g)}
                      className="font-mono text-[10px] tracking-[0.15em] uppercase border border-chalk/20 text-chalk/60 hover:border-chalk hover:text-chalk px-4 py-2 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(g.id)}
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
    <div className="bg-court p-6 border border-ace/30 mb-6">
      <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-ace mb-5">
        {label}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Name" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-sans text-sm focus:outline-none focus:border-ace"
          />
        </Field>
        <Field label="Icon URL">
          <input
            value={form.iconUrl}
            onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
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
          disabled={busy || !form.name}
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
