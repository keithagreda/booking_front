"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { UserDto } from "@/lib/types";

const ROLE_STYLES: Record<string, string> = {
  Admin: "bg-violet-500/15 text-violet-400",
  Player: "bg-zinc-800 text-zinc-400",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState<string>("");
  const [banFilter, setBanFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (banFilter) params.set("isBanned", banFilter);

      const res = await apiClient<{ items: UserDto[]; total: number }>(
        `/api/admin/users?${params}`
      );
      setUsers(res.items);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, banFilter]);

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
    setRole("");
    setBanFilter("");
    setPage(1);
  }

  async function toggleBan(user: UserDto) {
    setBusyId(user.id);
    setError(null);
    try {
      await apiClient(
        `/api/admin/users/${user.id}/${user.isBanned ? "unban" : "ban"}`,
        { method: "POST" }
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(userId: string, newRole: string) {
    setRoleBusyId(userId);
    setError(null);
    try {
      await apiClient(`/api/admin/users/${userId}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRoleBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
            Users
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage accounts, roles, and bans.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          {total} user{total !== 1 ? "s" : ""}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search name, email, phone…"
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 w-56"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Player">Player</option>
        </select>
        <select
          value={banFilter}
          onChange={(e) => { setBanFilter(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>
        {(role || banFilter || search) && (
          <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            Clear
          </button>
        )}
        <button onClick={applyFilters} className="ml-auto rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition">
          Search
        </button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Joined</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Banned At</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 grid place-items-center text-xs font-medium text-zinc-400 shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-zinc-200 font-medium truncate">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">{u.email}</div>
                          {u.phoneNumber && (
                            <div className="text-xs text-zinc-600">{u.phoneNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={roleBusyId === u.id}
                        className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                      >
                        <option value="Player">Player</option>
                        <option value="Admin">Admin</option>
                      </select>
                      {roleBusyId === u.id && (
                        <span className="ml-2 text-[10px] text-zinc-500">Saving…</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        u.isBanned ? "bg-rose-500/15 text-rose-400" : ROLE_STYLES[u.role]
                      }`}>
                        {u.isBanned ? "Banned" : u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 font-mono">
                      {fmtDate(u.creationTime)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 font-mono">
                      {fmtTime(u.bannedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={busyId === u.id}
                        className={`rounded-md text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 transition disabled:opacity-50 ${
                          u.isBanned
                            ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/25"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
                        }`}
                      >
                        {busyId === u.id ? "…" : u.isBanned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
