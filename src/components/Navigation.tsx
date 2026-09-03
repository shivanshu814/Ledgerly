import { useUser, useClerk } from "@clerk/nextjs";
import { FiHome, FiPlus, FiList, FiLogOut, FiSun, FiMoon } from "react-icons/fi";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import toast from "react-hot-toast";

const navItems = [
  { path: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: FiHome },
  { path: "/add-expense", label: "Add Expense", shortLabel: "Add", icon: FiPlus },
  { path: "/transactions", label: "Transactions", shortLabel: "History", icon: FiList },
];

export default function Navigation() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = router.pathname;
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prefetch all app routes on mount
  useEffect(() => {
    navItems.forEach((item) => router.prefetch(item.path));
  }, [router]);

  const handleSignOut = useCallback(async () => {
    toast.promise(
      signOut().then(() => router.push("/")),
      { loading: "Signing out…", success: "Signed out. See you soon!", error: "Sign out failed. Try again." }
    );
  }, [signOut, router]);

  const navStyle = useMemo(() => scrolled ? {
    borderBottom: "1px solid var(--nav-border)",
    backgroundColor: "var(--nav-bg)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    backdropFilter: "blur(20px)",
  } : {}, [scrolled]);

  if (!user) return null;

  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : user.emailAddresses[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-40 transition-all duration-300"
        style={navStyle}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => router.push("/dashboard")}
              className="group flex shrink-0 items-center gap-3 text-left"
              aria-label="Go to dashboard"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-sm font-black transition group-hover:scale-105"
                style={{ backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)", boxShadow: "0 4px 12px rgba(23,33,29,0.2)" }}
              >
                L
              </span>
              <span className="hidden sm:block">
                <span className="block text-base font-black leading-none" style={{ color: "var(--ink)" }}>
                  Ledgerly
                </span>
                <span className="mt-0.5 block text-xs font-bold uppercase" style={{ color: "var(--ink-3)", letterSpacing: "0.2em" }}>
                  Money clarity
                </span>
              </span>
            </button>

            {/* Desktop nav */}
            <div
              className="hidden items-center gap-1 rounded-2xl p-1.5 shadow-sm sm:flex"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-pill)", backdropFilter: "blur(20px)" }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all duration-200"
                    style={active
                      ? { backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)", boxShadow: "0 4px 12px rgba(23,33,29,0.2)" }
                      : { color: "var(--ink-3)" }
                    }
                  >
                    <Icon className="h-4 w-4" style={{ color: active ? "#a3d4be" : "currentColor" }} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right — theme toggle + user + sign out */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="grid h-10 w-10 place-items-center rounded-xl shadow-sm transition"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-pill)", color: "var(--ink-3)" }}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
              </button>

              <div
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 shadow-sm"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-pill)" }}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg text-xs font-black" style={{ backgroundColor: "var(--bg-accent)", color: "var(--teal-dark)" }}>
                  {initials}
                </span>
                <span className="max-w-[180px] truncate text-xs font-bold" style={{ color: "var(--ink-3)" }}>
                  {user.emailAddresses[0]?.emailAddress}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="grid h-10 w-10 place-items-center rounded-xl shadow-sm transition hover:text-red-600"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-pill)", color: "var(--ink-3)" }}
                aria-label="Sign out"
                title="Sign out"
              >
                <FiLogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <div
        className="fixed bottom-3 left-3 right-3 z-50 rounded-2xl p-1.5 shadow-2xl sm:hidden"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card-solid)", backdropFilter: "blur(20px)" }}
      >
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black transition-all duration-200"
                style={active
                  ? { backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)" }
                  : { color: "var(--ink-3)" }
                }
              >
                <Icon className="h-5 w-5" style={{ color: active ? "#a3d4be" : "currentColor" }} />
                {item.shortLabel}
              </button>
            );
          })}
          {/* Mobile theme toggle */}
          <button
            onClick={toggle}
            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black transition"
            style={{ color: "var(--ink-3)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </>
  );
}
