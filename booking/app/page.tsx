"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Scroll-reveal hook ───────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Static data ─────────────────────────────────────────────────
const SPORTS = [
  {
    id: "pickleball",
    name: "Pickleball",
    tag: "Court Sport",
    price: 240,
    peakPrice: 276,
    status: "AVAILABLE",
    available: true,
    description: "Lit courts · Up to 4 players · Paddles available on-site",
  },
  {
    id: "billiards",
    name: "Billiards",
    tag: "Table Sport",
    price: 150,
    peakPrice: null,
    status: "AVAILABLE",
    available: true,
    description: "Full-size pool tables · All skill levels welcome",
  },
  {
    id: "darts",
    name: "Darts",
    tag: "Target Sport",
    price: 80,
    peakPrice: null,
    status: "AVAILABLE",
    available: true,
    description: "Electronic dartboards · Perfect for groups and walk-ins",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Browse",
    body: "Check real-time court availability. See capacity, pricing, and features at a glance.",
  },
  {
    num: "02",
    title: "Reserve",
    body: "Pick your date and time slot. Secure your court in under 60 seconds.",
  },
  {
    num: "03",
    title: "Play",
    body: "Show up and smash. Your court is ready and waiting when you arrive.",
  },
];

const MARQUEE_TEXT =
  "PICKLEBALL\u2002—\u2002BILLIARDS\u2002—\u2002DARTS\u2002—\u2002BOOK YOUR GAME\u2002—\u2002GENERAL SANTOS CITY\u2002—\u2002";

// ─── Page ─────────────────────────────────────────────────────────
export default function Home() {
  const courtsSection = useReveal();
  const venueSection = useReveal();
  const howSection = useReveal();
  const contactSection = useReveal(0.08);

  return (
    <>
      {/* ════════════════════════════════════════════════════
          01 — HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen bg-pitch flex flex-col justify-end overflow-hidden">

        {/* Subtle dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #f0ebe1 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top-right: court count badge */}
        <div className="absolute top-28 right-6 lg:right-10 text-right select-none">
          <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 mb-1">
            Available
          </div>
          <div className="font-display text-[4.5rem] leading-none text-ace">03</div>
          <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 mt-1">
            Sports
          </div>
        </div>

        {/* Section label */}
        <div className="absolute top-28 left-6 lg:left-10 select-none">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-chalk/25">
            01&nbsp;/&nbsp;Home
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 px-6 lg:px-10 max-w-7xl mx-auto w-full pb-28 lg:pb-36">

          {/* Kicker */}
          <p
            className="enter font-mono text-[10px] tracking-[0.45em] uppercase text-ace mb-8"
            style={{ animationDelay: "0.05s" }}
          >
            Triangle SportHub&nbsp;&nbsp;—&nbsp;&nbsp;Bula, General Santos City
          </p>

          {/* Oversized headline */}
          <h1 className="font-display uppercase leading-[0.88] tracking-[0.02em] text-chalk">
            <span className="enter block text-[clamp(4.5rem,14vw,13rem)]" style={{ animationDelay: "0.15s" }}>PLAY</span>
            <span className="enter block text-[clamp(4.5rem,14vw,13rem)] text-ace" style={{ animationDelay: "0.25s" }}>HARD.</span>
            <span className="enter block text-[clamp(4.5rem,14vw,13rem)]" style={{ animationDelay: "0.35s" }}>BOOK</span>
            <span className="enter block text-[clamp(4.5rem,14vw,13rem)]" style={{ animationDelay: "0.45s" }}>FAST.</span>
          </h1>

          {/* Sub-row */}
          <div
            className="enter mt-10 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-14"
            style={{ animationDelay: "0.6s" }}
          >
            <p className="max-w-[22rem] text-chalk/45 text-sm leading-[1.75] font-sans">
              Premium pickleball courts. Real-time availability,
              instant online booking — no calls, no walk-ins required.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/booking"
                className="group inline-flex items-center gap-3 bg-ace text-pitch font-bold text-[11px] tracking-[0.18em] uppercase px-7 py-4 transition-all duration-300 hover:bg-chalk"
              >
                Reserve a Court
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                  →
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-chalk/40 transition-colors hover:text-chalk"
              >
                How it works&nbsp;↓
              </a>
            </div>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-chalk/8">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex flex-wrap justify-between gap-y-1">
            <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-chalk/25">
              Mon – Sun&nbsp;&nbsp;·&nbsp;&nbsp;7:00 AM – 10:00 PM
            </span>
            <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-chalk/25">
              &nbsp;₱240&nbsp;/&nbsp;hr
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          MARQUEE STRIP
      ════════════════════════════════════════════════════ */}
      <div className="bg-ace overflow-hidden py-3.5 select-none">
        <div className="marquee-inner">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="inline-block px-6 font-display text-xl tracking-[0.15em] uppercase text-pitch"
            >
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          02 — COURTS
      ════════════════════════════════════════════════════ */}
      <section className="bg-chalk py-24 lg:py-36">
        <div
          ref={courtsSection.ref}
          className={`max-w-7xl mx-auto px-6 lg:px-10 reveal ${courtsSection.visible ? "visible" : ""}`}
        >
          {/* Section header */}
          <div className="flex items-end justify-between mb-16 lg:mb-20">
            <div>
              <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-pitch/35 block mb-4">
                02&nbsp;/&nbsp;What We Offer
              </span>
              <h2 className="font-display text-[clamp(2.5rem,7vw,6.5rem)] uppercase tracking-[0.02em] text-pitch leading-[0.9]">
                Pick Your
                <br />
                <span className="text-pitch/15">Game</span>
              </h2>
            </div>
            <Link
              href="/booking"
              className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-pitch/40 hover:text-pitch transition-colors"
            >
              View all&nbsp;→
            </Link>
          </div>

          {/* Sport cards */}
          <div className="grid md:grid-cols-3 gap-px bg-pitch/10">
            {SPORTS.map((sport, i) => (
              <div
                key={sport.id}
                className={`
                  bg-chalk p-8 lg:p-10 flex flex-col gap-7
                  transition-all duration-300
                  hover:-translate-y-1 hover:shadow-[5px_5px_0_0_#0a0a0a] hover:z-10 relative cursor-pointer
                  reveal ${courtsSection.visible ? "visible" : ""}
                `}
                style={{ transitionDelay: `${i * 0.12 + 0.1}s` }}
              >
                {/* Card top */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-pitch/35 block mb-2">
                      {sport.tag}
                    </span>
                    <h3 className="font-display text-[1.75rem] uppercase tracking-wide text-pitch leading-none">
                      {sport.name}
                    </h3>
                  </div>
                  <span className="shrink-0 font-mono text-[8px] tracking-[0.25em] uppercase px-2.5 py-1 bg-ace text-pitch">
                    {sport.status}
                  </span>
                </div>

                {/* Description */}
                <p className="font-sans text-[11px] text-pitch/50 leading-[1.8]">
                  {sport.description}
                </p>

                {/* Card bottom */}
                <div className="mt-auto pt-6 border-t border-pitch/10 flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-[2.25rem] text-pitch leading-none">
                        ₱{sport.price}
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-pitch/35">
                        / hr
                      </span>
                    </div>
                    {sport.peakPrice && (
                      <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-pitch/40 mt-1">
                        ₱{sport.peakPrice} peak hrs
                      </div>
                    )}
                  </div>
                  <Link
                    href="/booking"
                    className="group inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-pitch font-bold transition-all hover:gap-3"
                  >
                    Book&nbsp;
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile view-all */}
          <div className="mt-8 md:hidden">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-pitch/50 hover:text-pitch transition-colors"
            >
              View all courts&nbsp;→
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          03 — THE VENUE
      ════════════════════════════════════════════════════ */}
      <section id="venue" className="bg-pitch py-24 lg:py-36">
        <div
          ref={venueSection.ref}
          className={`max-w-7xl mx-auto px-6 lg:px-10 reveal ${venueSection.visible ? "visible" : ""}`}
        >
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 lg:mb-18">
            <div>
              <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 block mb-4">
                03&nbsp;/&nbsp;The Venue
              </span>
              <h2 className="font-display text-[clamp(2.5rem,7vw,6.5rem)] uppercase tracking-[0.02em] text-chalk leading-[0.9]">
                Step
                <br />
                <span className="text-ace">Inside.</span>
              </h2>
            </div>
            <p className="max-w-xs font-sans text-sm text-chalk/40 leading-[1.8] md:text-right">
              Three dedicated spaces under one roof in Bula, General Santos City.
              Whether you're here to compete or unwind — there's a game for you.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-2 grid-rows-2 md:grid-cols-3 gap-3 h-[400px] md:h-[520px]">

            {/* Pickleball — large */}
            <div className="col-span-2 row-span-2 md:col-span-2 bg-court border border-chalk/8 p-8 lg:p-10 flex flex-col justify-between transition-colors duration-300 hover:border-ace/25">
              <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/25">
                Court Sport
              </span>
              <div>
                <div className="font-display text-[clamp(2.25rem,5.5vw,4.5rem)] uppercase tracking-wide text-chalk leading-[0.9] mb-3">
                  Pickleball
                  <br />
                  Courts
                </div>
                <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-ace">
                  — Court lights included
                </div>
              </div>
            </div>

            {/* Billiards */}
            <div className="col-span-1 row-span-1 bg-court border border-chalk/8 p-6 flex flex-col justify-between transition-colors duration-300 hover:border-ace/25">
              <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/25">
                Table Sport
              </span>
              <div className="font-display text-[1.6rem] uppercase tracking-wide text-chalk leading-none">
                Billiards
              </div>
            </div>

            {/* Darts */}
            <div className="col-span-1 row-span-1 bg-court border border-chalk/8 p-6 flex flex-col justify-between transition-colors duration-300 hover:border-ace/25">
              <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/25">
                Target Sport
              </span>
              <div className="font-display text-[1.6rem] uppercase tracking-wide text-chalk leading-none">
                Darts
              </div>
            </div>
          </div>

          {/* Quick facts strip */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-px bg-chalk/8">
            {[
              { value: "7AM – 10PM", label: "Open daily" },
              { value: "Lit Courts", label: "Night games welcome" },
              { value: "Walk-ins OK", label: "No booking required off-peak" },
              { value: "Bula, GenSan", label: "General Santos City" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-pitch px-6 py-7">
                <div className="font-display text-xl uppercase tracking-wide text-chalk mb-1.5">
                  {value}
                </div>
                <div className="font-mono text-[8px] tracking-[0.25em] uppercase text-chalk/30">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          04 — HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-pitch py-24 lg:py-36">
        <div
          ref={howSection.ref}
          className={`max-w-7xl mx-auto px-6 lg:px-10 reveal ${howSection.visible ? "visible" : ""}`}
        >
          {/* Section header */}
          <div className="mb-16 lg:mb-24">
            <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 block mb-4">
              04&nbsp;/&nbsp;Process
            </span>
            <h2 className="font-display text-[clamp(2.5rem,7vw,6.5rem)] uppercase tracking-[0.02em] text-chalk leading-[0.9]">
              As Easy As
              <br />
              <span className="text-ace">01&nbsp;&nbsp;02&nbsp;&nbsp;03</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-chalk/8">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`
                  py-10 md:py-0 md:px-12 first:md:pl-0 last:md:pr-0
                  reveal ${howSection.visible ? "visible" : ""}
                `}
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className="font-display text-[5rem] text-ace/20 leading-none mb-8 select-none">
                  {step.num}
                </div>
                <h3 className="font-display text-3xl uppercase tracking-wider text-chalk mb-4">
                  {step.title}
                </h3>
                <p className="font-sans text-sm text-chalk/45 leading-[1.8]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 pt-12 border-t border-chalk/8">
            <Link
              href="/booking"
              className="group inline-flex items-center gap-5 font-display text-[clamp(1.5rem,4vw,3rem)] uppercase tracking-wider text-chalk hover:text-ace transition-colors duration-300"
            >
              Start Booking
              <span className="text-ace transition-transform duration-300 group-hover:translate-x-2">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          04 — CONTACT
      ════════════════════════════════════════════════════ */}
      <section id="contact" className="bg-chalk py-24 lg:py-36">
        <div
          ref={contactSection.ref}
          className={`max-w-7xl mx-auto px-6 lg:px-10 reveal ${contactSection.visible ? "visible" : ""}`}
        >
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-28">

            {/* Left: info */}
            <div>
              <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-pitch/35 block mb-4">
                05&nbsp;/&nbsp;Contact
              </span>
              <h2 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] uppercase tracking-[0.02em] text-pitch leading-[0.9] mb-14">
                Find Us.
                <br />
                <span className="text-pitch/15">Play Here.</span>
              </h2>

              <div className="space-y-9">
                {[
                  {
                    label: "Address",
                    value: "Bula, General Santos City\nSouth Cotabato, Philippines",
                  },
                  {
                    label: "Hours",
                    value: "Monday – Sunday\n7:00 AM – 10:00 PM",
                  },
                  { label: "Phone", value: "+63 912 345 6789" },
                  { label: "Email", value: "play@trianglesportshub.ph" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="font-mono text-[8px] tracking-[0.35em] uppercase text-pitch/35 mb-1.5">
                      {label}
                    </div>
                    <div className="font-sans text-sm text-pitch/75 leading-[1.8] whitespace-pre-line">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[8px] tracking-[0.35em] uppercase text-pitch/35">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="border border-pitch/18 bg-transparent text-pitch text-sm px-4 py-3.5 outline-none transition-colors focus:border-pitch placeholder:text-pitch/25 font-sans"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[8px] tracking-[0.35em] uppercase text-pitch/35">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="border border-pitch/18 bg-transparent text-pitch text-sm px-4 py-3.5 outline-none transition-colors focus:border-pitch placeholder:text-pitch/25 font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[8px] tracking-[0.35em] uppercase text-pitch/35">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Ask about court availability, group bookings, or memberships…"
                  className="border border-pitch/18 bg-transparent text-pitch text-sm px-4 py-3.5 outline-none transition-colors focus:border-pitch placeholder:text-pitch/25 resize-none font-sans"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="group inline-flex items-center gap-3 bg-pitch text-chalk font-bold text-[11px] tracking-[0.18em] uppercase px-7 py-4 transition-all duration-300 hover:bg-ace hover:text-pitch"
                >
                  Send Message
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer className="bg-pitch border-t border-chalk/8 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div>
            <div className="font-display text-xl tracking-[0.2em] uppercase text-chalk">
              Triangle SportHub
            </div>
            <div className="font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/25 mt-1">
              Pickleball Courts
            </div>
          </div>

          {/* Footer nav */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {[
              { label: "Home", href: "/" },
              { label: "Booking", href: "/booking" },
              { label: "Contact", href: "#contact" },
              { label: "Log in", href: "/login" },
              { label: "Register", href: "/register" },
            ].map((item) => (
              <Link
                key={item.label + item.href}
                href={item.href}
                className="font-mono text-[9px] tracking-[0.22em] uppercase text-chalk/25 hover:text-chalk transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-chalk/18 shrink-0">
            © {new Date().getFullYear()} Triangle SportHub
          </div>
        </div>
      </footer>
    </>
  );
}
