"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/schedule", label: "Schedule", icon: "calendar" },
  { href: "/admin/games", label: "Games", icon: "game" },
  { href: "/admin/rooms", label: "Rooms", icon: "room" },
  { href: "/admin/payments", label: "Payments", icon: "payment" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  const c = className ?? "w-5 h-5";
  switch (name) {
    case "grid":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case "game":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 11h4M8 9v4" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <circle cx="17" cy="12" r="1" fill="currentColor" />
          <path d="M6.5 17.5l1-4.5a2 2 0 0 1 2-1.5h8a2 2 0 0 1 2 1.5v3a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "room":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 10h20" />
          <path d="M8 10v10" />
          <path d="M16 10v10" />
        </svg>
      );
    case "payment":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {/* Logo / brand */}
        <div className="flex items-center h-16 px-5 border-b border-zinc-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 grid place-items-center shrink-0">
              <span className="font-display text-base text-white leading-none">CC</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-display text-lg tracking-[0.1em] text-white uppercase leading-none">
                  Centre Court
                </div>
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500">
                  Admin Panel
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="absolute top-5 -right-3 z-50 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 grid place-items-center hover:bg-zinc-700 transition"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-3 h-3 text-zinc-400 transition-transform ${collapsed ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-emerald-600/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-zinc-800 p-3 shrink-0">
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
              title={user ? `${user.firstName} ${user.lastName}` : "Log out"}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-zinc-200 font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
                title="Log out"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-950 border-b border-zinc-800 h-14 flex items-center px-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 grid place-items-center">
            <span className="font-display text-sm text-white leading-none">CC</span>
          </div>
          <span className="font-display text-base tracking-[0.1em] text-white uppercase">
            Centre Court
          </span>
        </Link>
      </div>
    </>
  );
}
