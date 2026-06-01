import { useUser, useClerk } from "@clerk/nextjs";
import { FiHome, FiPlus, FiList, FiLogOut } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: FiHome },
  { path: "/add-expense", label: "Add Expense", shortLabel: "Add", icon: FiPlus },
  { path: "/transactions", label: "Transactions", shortLabel: "History", icon: FiList },
];

export default function Navigation() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : user.emailAddresses[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-stone-200/60 bg-[#f6f2e9]/90 shadow-sm backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => router.push("/dashboard")}
              className="group flex shrink-0 items-center gap-3 text-left"
              aria-label="Go to dashboard"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17211d] text-sm font-black text-[#fffbf2] shadow-md shadow-stone-900/20 transition group-hover:scale-105">
                L
              </span>
              <span className="hidden sm:block">
                <span className="block text-base font-black leading-none text-stone-950">
                  Ledgerly
                </span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Money clarity
                </span>
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 rounded-2xl border border-stone-300/70 bg-white/50 p-1.5 shadow-sm backdrop-blur-xl sm:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all duration-200 ${
                      active
                        ? "bg-[#17211d] text-[#fffbf2] shadow-md shadow-stone-900/20"
                        : "text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-[#a3d4be]" : ""}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right — user + sign out */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <div className="flex items-center gap-2.5 rounded-xl border border-stone-300/70 bg-white/50 px-3 py-2 shadow-sm">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#cbe7dc] text-[10px] font-black text-teal-900">
                  {initials}
                </span>
                <span className="max-w-[180px] truncate text-xs font-bold text-stone-600">
                  {user.emailAddresses[0]?.emailAddress}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="grid h-10 w-10 place-items-center rounded-xl border border-stone-300/70 bg-white/50 text-stone-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
      <div className="fixed bottom-3 left-3 right-3 z-50 rounded-[1.4rem] border border-stone-300/80 bg-[#fffbf2]/95 p-2 shadow-2xl shadow-stone-900/15 backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-4 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-2xl text-[11px] font-black transition-all duration-200 ${
                  active
                    ? "bg-[#17211d] text-[#fffbf2] shadow-md shadow-stone-900/20"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[#a3d4be]" : ""}`} />
                {item.shortLabel}
              </button>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-2xl text-[11px] font-black text-stone-400 transition hover:text-red-500"
            aria-label="Sign out"
          >
            <FiLogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
