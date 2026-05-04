"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { createHub } from "@/lib/live";
import { useAuth } from "@/lib/auth-context";
import type {
  JoinOpenPlayResponse,
  OpenPlayWindowState,
} from "@/lib/types";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function OpenPlayWindowPage() {
  const { windowId } = useParams<{ windowId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [state, setState] = useState<OpenPlayWindowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient<OpenPlayWindowState>(`/api/openplay/windows/${windowId}`)
      .then(setState)
      .catch((e: Error) => setError(e.message));

    const conn = createHub();
    conn
      .start()
      .then(() => conn.invoke("SubscribeWindow", windowId))
      .catch((e) => console.warn("SignalR connect failed", e));

    conn.on("WindowState", (next: OpenPlayWindowState) => {
      if (next.summary.windowId === windowId) setState(next);
    });

    return () => {
      conn.invoke("UnsubscribeWindow", windowId).catch(() => {});
      conn.stop();
    };
  }, [windowId]);

  async function join(withPartner: boolean) {
    if (!user) {
      router.push(`/login?callbackUrl=/openplay/${windowId}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: { partnerUserId: string | null } = { partnerUserId: null };
      if (withPartner) {
        if (!partnerEmail) {
          setError("Enter partner email or user id.");
          return;
        }
        body.partnerUserId = partnerEmail; // backend currently expects user id; UX upgrade later
      }
      const resp = await apiClient<JoinOpenPlayResponse>(
        `/api/openplay/windows/${windowId}/join`,
        { method: "POST", body: JSON.stringify(body) }
      );
      // First booking is leader's; route to their checkout
      if (resp.bookings.length > 0) {
        router.push(`/checkout/${resp.bookings[0].id}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function leave() {
    setSubmitting(true);
    try {
      await apiClient<OpenPlayWindowState>(
        `/api/openplay/windows/${windowId}/leave`,
        { method: "POST" }
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !state) {
    return (
      <main className="min-h-screen bg-pitch pt-28 px-6">
        <div className="max-w-3xl mx-auto border border-rose-300/30 p-6 text-rose-200 font-mono text-xs">
          {error}
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-pitch pt-28 px-6">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/30 max-w-3xl mx-auto">
          Loading…
        </div>
      </main>
    );
  }

  const { summary, queue, activeMatches } = state;
  const inQueue = user
    ? queue.some(
        (q) => q.leaderUserId === user.id || q.partnerUserId === user.id
      )
    : false;
  const inMatch = user
    ? activeMatches.some((m) =>
        m.players.some((p) => p.userId === user.id)
      )
    : false;

  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <Link
          href="/openplay"
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 hover:text-ace transition mb-4 block"
        >
          ← All Open Play
        </Link>

        <div className="mb-12 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/30 block mb-3">
              {summary.gameName}
            </span>
            <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase tracking-[0.02em] text-chalk leading-none">
              {summary.roomName}
            </h1>
            <div className="font-mono text-[11px] tracking-[0.15em] text-chalk/50 mt-3">
              {fmtTime(summary.startTime)} — {fmtTime(summary.endTime)}
            </div>
          </div>
          <div className="flex gap-px bg-chalk/8">
            <div className="bg-pitch p-5 min-w-[110px]">
              <div className="font-mono text-[8px] tracking-[0.25em] uppercase text-chalk/35">
                Seat
              </div>
              <div className="font-display text-2xl text-ace">
                ₱{summary.seatRate.toFixed(0)}
              </div>
            </div>
            <div className="bg-pitch p-5 min-w-[110px]">
              <div className="font-mono text-[8px] tracking-[0.25em] uppercase text-chalk/35">
                Match
              </div>
              <div className="font-display text-2xl text-chalk">
                {summary.matchSize}
              </div>
            </div>
            <div className="bg-pitch p-5 min-w-[110px]">
              <div className="font-mono text-[8px] tracking-[0.25em] uppercase text-chalk/35">
                Queue
              </div>
              <div className="font-display text-2xl text-chalk">
                {summary.queueLength}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 border border-rose-300/30 p-5 text-rose-200 font-mono text-xs">
            {error}
          </div>
        )}

        {/* Active matches */}
        <section className="mb-10">
          <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/35 mb-4">
            Active Matches
          </div>
          {activeMatches.length === 0 ? (
            <div className="border border-chalk/10 p-6 font-sans text-sm text-chalk/50">
              No matches in progress.
            </div>
          ) : (
            <div className="space-y-px bg-chalk/8">
              {activeMatches.map((m) => (
                <div key={m.id} className="bg-pitch p-5">
                  <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35 mb-2">
                    Started {fmtTime(m.startedAt)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.players.map((p) => (
                      <span
                        key={p.userId}
                        className="font-mono text-[10px] tracking-[0.15em] uppercase border border-ace/30 text-ace bg-ace/5 px-3 py-1.5"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Queue */}
        <section className="mb-10">
          <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/35 mb-4">
            Queue
          </div>
          {queue.length === 0 ? (
            <div className="border border-chalk/10 p-6 font-sans text-sm text-chalk/50">
              Queue is empty.
            </div>
          ) : (
            <div className="space-y-px bg-chalk/8">
              {queue.map((q, i) => (
                <div
                  key={q.partyId}
                  className="bg-pitch p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-2xl text-chalk/40 w-8">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-mono text-[11px] tracking-[0.15em] text-chalk">
                        {q.leaderName}
                        {q.partnerName ? ` + ${q.partnerName}` : ""}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/35 mt-0.5">
                        {q.size === 2 ? "Duo" : "Solo"} ·{" "}
                        {new Date(q.enqueuedAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Action */}
        <section className="border border-chalk/10 p-7">
          {inMatch ? (
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ace">
              You&apos;re in a match — head to the court.
            </div>
          ) : inQueue ? (
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-ace mb-1">
                  In Queue
                </div>
                <div className="font-sans text-sm text-chalk/60">
                  Stay nearby — you&apos;ll be matched as soon as a slot opens.
                </div>
              </div>
              <button
                onClick={leave}
                disabled={submitting}
                className="font-mono text-[10px] tracking-[0.25em] uppercase border border-chalk/20 text-chalk/60 hover:border-chalk hover:text-chalk px-5 py-3 transition disabled:opacity-50"
              >
                Leave Queue
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/35">
                Join the Queue
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => join(false)}
                  disabled={submitting}
                  className="font-bold text-[11px] tracking-[0.15em] uppercase bg-ace text-pitch hover:bg-chalk transition px-7 py-3 disabled:opacity-50"
                >
                  Join Solo · ₱{summary.seatRate.toFixed(0)}
                </button>
              </div>
              <div className="border-t border-chalk/5 pt-5">
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-chalk/40 mb-3">
                  Or queue as a duo
                </div>
                <div className="flex gap-3 flex-wrap">
                  <input
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="Partner user id"
                    className="flex-1 min-w-[220px] bg-chalk/5 border border-chalk/10 px-4 py-3 text-chalk font-mono text-sm focus:outline-none focus:border-ace"
                  />
                  <button
                    onClick={() => join(true)}
                    disabled={submitting || !partnerEmail}
                    className="font-mono text-[10px] tracking-[0.25em] uppercase border border-ace/40 text-ace hover:bg-ace hover:text-pitch transition px-5 py-3 disabled:opacity-50"
                  >
                    Invite Duo · ₱{(summary.seatRate * 2).toFixed(0)}
                  </button>
                </div>
                <p className="font-sans text-xs text-chalk/40 leading-[1.7] mt-3">
                  Both players pay their own seat. Partner must accept the invite
                  before the duo enters the queue.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
