"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient, setToken } from "@/lib/api";
import type { UserDto, TrustHistoryDto } from "@/lib/types";

const TRUST_COLORS = [
  { max: 20, bg: "bg-rose-500/15", text: "text-rose-400", label: "Critical" },
  { max: 40, bg: "bg-orange-500/15", text: "text-orange-400", label: "Low" },
  { max: 60, bg: "bg-amber-500/15", text: "text-amber-400", label: "Fair" },
  { max: 80, bg: "bg-lime-500/15", text: "text-lime-400", label: "Good" },
  { max: 100, bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Excellent" },
];

function getTrustInfo(score: number) {
  return TRUST_COLORS.find((c) => score <= c.max) ?? TRUST_COLORS[TRUST_COLORS.length - 1];
}

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
  const [selected, setSelected] = useState<UserDto | null>(null);
  const [trustHistory, setTrustHistory] = useState<TrustHistoryDto[]>([]);
  const [trustPage, setTrustPage] = useState(1);
  const [trustTotal, setTrustTotal] = useState(0);
  const [trustLoading, setTrustLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

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

  const loadTrustHistory = useCallback(async (userId: string, p: number) => {
    setTrustLoading(true);
    try {
      const res = await apiClient<{ items: TrustHistoryDto[]; total: number }>(
        `/api/admin/users/${userId}/trust-history?page=${p}&pageSize=20`
      );
      setTrustHistory(res.items);
      setTrustTotal(res.total);
    } catch {
      setTrustHistory([]);
    } finally {
      setTrustLoading(false);
    }
  }, []);

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

  async function impersonate(user: UserDto) {
    setBusyAction("impersonate");
    setError(null);
    try {
      const res = await apiClient<{ token: string }>(
        `/api/admin/users/${user.id}/impersonate`,
        { method: "POST" }
      );
      setToken(res.token);
      window.open("/", "_blank");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }

  async function forceSetPassword(userId: string) {
    if (!newPassword.trim() || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusyAction("setPassword");
    setError(null);
    try {
      await apiClient(`/api/admin/users/${userId}/set-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      setNewPassword("");
      setError("Password changed. User notified via email.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }

  async function triggerResetPassword(userId: string) {
    setBusyAction("resetPassword");
    setError(null);
    try {
      await apiClient(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      setError("Password reset email sent.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }

  async function adjustTrust(userId: string) {
    const val = parseFloat(adjustValue);
    if (isNaN(val)) {
      setError("Enter a valid number.");
      return;
    }
    setBusyAction("adjustTrust");
    setError(null);
    try {
      await apiClient(`/api/admin/users/${userId}/trust`, {
        method: "POST",
        body: JSON.stringify({ adjustment: val, reason: adjustReason.trim() || null }),
      });
      setAdjustValue("");
      setAdjustReason("");
      await load();
      await loadTrustHistory(userId, trustPage);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }

  function openDetail(user: UserDto) {
    setSelected(user);
    setTrustPage(1);
    loadTrustHistory(user.id, 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const trustTotalPages = Math.max(1, Math.ceil(trustTotal / 20));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
            Users
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage accounts, roles, bans, and trust scores.
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
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Trust</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Joined</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">Loading…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">No users found.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const trust = getTrustInfo(u.trustScore);
                  return (
                    <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition">
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => openDetail(u)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 grid place-items-center text-xs font-medium text-zinc-400 shrink-0">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-zinc-200 font-medium truncate">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${trust.bg} ${trust.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {Math.round(u.trustScore)}
                        </span>
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
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.isBanned ? "bg-rose-500/15 text-rose-400" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {u.isBanned ? "Banned" : u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 font-mono">
                        {fmtDate(u.creationTime)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetail(u)}
                            className="rounded-md text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 transition bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
                          >
                            Detail
                          </button>
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 grid place-items-center text-lg font-medium text-zinc-400">
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div>
                  <div className="text-lg text-zinc-100 font-medium">{selected.firstName} {selected.lastName}</div>
                  <div className="text-sm text-zinc-500">{selected.email}{selected.phoneNumber ? ` · ${selected.phoneNumber}` : ""}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300 text-lg">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Trust Score" value={`${Math.round(selected.trustScore)} / 100`} color={getTrustInfo(selected.trustScore).text} />
                <StatCard label="Role" value={selected.role} />
                <StatCard label="Status" value={selected.isBanned ? "Banned" : "Active"} color={selected.isBanned ? "text-rose-400" : "text-emerald-400"} />
                <StatCard label="Joined" value={fmtDate(selected.creationTime)} />
              </div>

              {/* Trust Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500">Trust Level</span>
                  <span className={`text-xs font-semibold ${getTrustInfo(selected.trustScore).text}`}>
                    {getTrustInfo(selected.trustScore).label}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-emerald-500"
                    style={{ width: `${selected.trustScore}%`, backgroundColor: selected.trustScore < 40 ? "#f43f5e" : selected.trustScore < 60 ? "#f59e0b" : selected.trustScore < 80 ? "#84cc16" : "#10b981" }}
                  />
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="grid grid-cols-2 gap-4">
                {/* Impersonate */}
                <ActionCard title="Impersonate" desc="Browse as this user">
                  <button
                    onClick={() => impersonate(selected)}
                    disabled={busyAction === "impersonate" || selected.isBanned}
                    className="w-full rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2 hover:bg-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busyAction === "impersonate" ? "Generating…" : "Open as User"}
                  </button>
                </ActionCard>

                {/* Force Set Password */}
                <ActionCard title="Force Set Password" desc="Admin overrides password">
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                    <button
                      onClick={() => forceSetPassword(selected.id)}
                      disabled={busyAction === "setPassword"}
                      className="w-full rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 text-sm font-medium px-4 py-2 hover:bg-amber-600/30 transition disabled:opacity-50"
                    >
                      {busyAction === "setPassword" ? "Saving…" : "Set Password"}
                    </button>
                  </div>
                </ActionCard>

                {/* Reset Password via Email */}
                <ActionCard title="Reset Password" desc="Send reset link via email">
                  <button
                    onClick={() => triggerResetPassword(selected.id)}
                    disabled={busyAction === "resetPassword"}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 hover:bg-zinc-700 transition disabled:opacity-50"
                  >
                    {busyAction === "resetPassword" ? "Sending…" : "Send Reset Email"}
                  </button>
                </ActionCard>

                {/* Audit Logs */}
                <ActionCard title="Audit Logs" desc="View user's activity logs">
                  <a
                    href={`/admin/audit-logs?search=${encodeURIComponent(selected.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 hover:bg-zinc-700 transition"
                  >
                    Open Audit Logs
                  </a>
                </ActionCard>
              </div>

              {/* ── Trust Adjustment ── */}
              <div className="rounded-lg border border-zinc-800 p-4">
                <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-3">Manual Trust Adjustment</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(e.target.value)}
                    placeholder="+5 or -10"
                    step="1"
                    className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 w-32"
                  />
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 flex-1"
                  />
                  <button
                    onClick={() => adjustTrust(selected.id)}
                    disabled={busyAction === "adjustTrust"}
                    className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition disabled:opacity-50 shrink-0"
                  >
                    {busyAction === "adjustTrust" ? "…" : "Adjust"}
                  </button>
                </div>
              </div>

              {/* ── Trust History ── */}
              <div>
                <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-3">
                  Trust History ({trustTotal} entries)
                </div>
                {trustLoading ? (
                  <div className="text-sm text-zinc-500">Loading…</div>
                ) : trustHistory.length === 0 ? (
                  <div className="text-sm text-zinc-500">No trust history yet.</div>
                ) : (
                  <div className="space-y-1">
                    {trustHistory.map((h) => (
                      <div key={h.id} className="flex items-center gap-3 text-xs py-2 border-b border-zinc-800/50">
                        <span className={`font-mono font-semibold w-12 ${h.adjustment > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {h.adjustment > 0 ? "+" : ""}{h.adjustment.toFixed(0)}
                        </span>
                        <span className="text-zinc-500 font-mono w-16 text-right">
                          {h.previousScore.toFixed(0)} → {h.newScore.toFixed(0)}
                        </span>
                        <span className="text-zinc-400 flex-1">{h.reason}</span>
                        {h.details && <span className="text-zinc-600 truncate max-w-[150px]">{h.details}</span>}
                        <span className="text-zinc-600 font-mono shrink-0">{new Date(h.creationTime).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {trustTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-zinc-500">Page {trustPage} of {trustTotalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setTrustPage((p) => Math.max(1, p - 1)); loadTrustHistory(selected.id, trustPage - 1); }} disabled={trustPage <= 1} className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition disabled:opacity-30">Prev</button>
                      <button onClick={() => { setTrustPage((p) => Math.min(trustTotalPages, p + 1)); loadTrustHistory(selected.id, trustPage + 1); }} disabled={trustPage >= trustTotalPages} className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition disabled:opacity-30">Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/50 border border-zinc-800 p-3">
      <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">{label}</div>
      <div className={`text-sm font-medium ${color ?? "text-zinc-200"}`}>{value}</div>
    </div>
  );
}

function ActionCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-1">{title}</div>
      <div className="text-xs text-zinc-500 mb-3">{desc}</div>
      {children}
    </div>
  );
}
