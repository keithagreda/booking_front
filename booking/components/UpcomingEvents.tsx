"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { UpcomingEventDto } from "@/lib/types";

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  OpenPlay: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", label: "Open Play", icon: "🎮" },
  Tournament: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", label: "Tournament", icon: "🏆" },
  Maintenance: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Maintenance", icon: "🔧" },
  Closed: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", label: "Closed", icon: "🔒" },
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function UpcomingEvents({ hours = 48 }: { hours?: number }) {
  const [events, setEvents] = useState<UpcomingEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    apiClient<UpcomingEventDto[]>(`/api/admin/schedule/upcoming-events?hours=${hours}`)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [hours]);

  const filtered = filter ? events.filter((e) => e.status === filter) : events;

  const grouped = filtered.reduce<Record<string, UpcomingEventDto[]>>((acc, e) => {
    const key = fmtDate(e.startTime);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h2 className="font-display text-lg tracking-[0.05em] text-white uppercase">
            Upcoming Events
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Scheduled windows for the next {hours} hours.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "" : key)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition ${
                filter === key
                  ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="text-sm text-zinc-500 text-center py-8">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-8">
            {events.length === 0 ? "No upcoming events scheduled." : "No events match the selected filter."}
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date} className="mb-6 last:mb-0">
              <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-zinc-500 mb-3">
                {date}
              </div>
              <div className="space-y-2">
                {dayEvents.map((e) => {
                  const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.Closed;
                  const isActive = new Date(e.startTime) <= new Date() && new Date(e.endTime) > new Date();

                  return (
                    <div
                      key={e.id}
                      className={`flex items-center gap-4 rounded-lg border p-4 transition ${
                        isActive
                          ? `${cfg.bg} ${cfg.border}`
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Status badge */}
                      <div className={`shrink-0 w-20 text-center`}>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Room + Game */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-zinc-200 font-medium truncate">
                          {e.roomName}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {e.gameName}
                          {e.notes && <span className="text-zinc-600"> · {e.notes}</span>}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="shrink-0 text-right">
                        <div className="text-sm text-zinc-300 font-mono">
                          {fmtTime(e.startTime)} – {fmtTime(e.endTime)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {fmtDuration(e.startTime, e.endTime)}
                          {e.seatRate && <span className="ml-2">· ₱{e.seatRate}/seat</span>}
                          {e.matchSize && <span className="ml-2">· {e.matchSize}v{e.matchSize}</span>}
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="shrink-0">
                          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
