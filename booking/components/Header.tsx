"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Venue", href: "/#venue" },
  { label: "Booking", href: "/booking" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
        ? "bg-pitch border-b border-chalk/10 py-3"
        : "bg-pitch py-5"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">

        {/* ── Logo ── */}
        <Link href="/" className="flex flex-col leading-none group">
          <span className="font-display text-2xl tracking-[0.15em] text-chalk uppercase transition-colors group-hover:text-ace">
            Centre Court
          </span>
          <span className="font-mono text-[8px] tracking-[0.35em] text-ace/80 uppercase">
            Book · Play · Repeat
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-sm lg:text-base uppercase tracking-[0.02em] text-chalk/85 leading-none transition-colors hover:text-chalk"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Auth ── */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? null : user ? (
            <>
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-chalk/40">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-chalk/50 transition-colors hover:text-chalk"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-chalk/50 transition-colors hover:text-chalk"
              >
                Log in
              </Link>
              <Link
                href="/booking"
                className="bg-ace text-pitch font-bold text-[10px] tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-chalk"
              >
                Book Now
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile menu toggle ── */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-px bg-chalk transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
          />
          <span
            className={`block w-6 h-px bg-chalk transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-px bg-chalk transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
          />
        </button>
      </div>

      {/* ── Mobile menu panel ── */}
      {menuOpen && (
        <div className="md:hidden bg-pitch border-t border-chalk/10 px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-sm uppercase tracking-[0.02em] text-chalk/85 leading-none hover:text-chalk transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-chalk/10 flex flex-col gap-3">
            {isLoading ? null : user ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="font-mono text-xs tracking-[0.2em] uppercase text-chalk/40 text-left hover:text-chalk transition-colors"
              >
                Log out ({user.firstName})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="font-mono text-xs tracking-[0.2em] uppercase text-chalk/60 hover:text-chalk transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/booking"
                  onClick={() => setMenuOpen(false)}
                  className="inline-block bg-ace text-pitch font-bold text-xs tracking-[0.15em] uppercase px-5 py-3 text-center"
                >
                  Book Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
