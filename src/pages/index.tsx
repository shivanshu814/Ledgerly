import { useUser, SignUpButton, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { FiArrowUpRight, FiClock, FiList, FiPlus, FiShield } from "react-icons/fi";

const features = [
  {
    icon: FiClock,
    title: "Daily spending rhythm",
    description: "Spot busy days, quiet days, and where your money actually goes.",
  },
  {
    icon: FiPlus,
    title: "Fast expense capture",
    description: "Amount, category, mode, split details. No spreadsheet ceremony.",
  },
  {
    icon: FiList,
    title: "Clean history",
    description: "Filter, edit, delete, and export reports when you need proof.",
  },
];

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl text-xl font-black shadow-xl"
              style={{ backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)" }}
            >
              L
            </div>
            <div>
              <p className="text-xl font-black leading-none" style={{ color: "var(--ink)" }}>Ledgerly</p>
              <p className="mt-1 text-xs font-bold uppercase" style={{ color: "var(--ink-3)", letterSpacing: "0.2em" }}>
                Expense clarity
              </p>
            </div>
          </div>
          {!user && (
            <SignInButton mode="modal">
              <button className="btn-secondary px-4 py-2.5">Sign in</button>
            </SignInButton>
          )}
        </header>

        <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.04fr_0.96fr] lg:py-12">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5">Built for everyday money decisions</p>
            <h1 className="display-title">
              Track expenses without making finance feel heavy.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 sm:text-xl" style={{ color: "var(--ink-3)" }}>
              Ledgerly turns day-to-day spending into a calm, readable ledger with
              monthly summaries, smart filters, and quick entry for Indian payment modes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <button onClick={() => router.push("/dashboard")} className="btn-primary">
                  Open dashboard
                  <FiArrowUpRight className="h-5 w-5" />
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button className="btn-primary">
                    Start tracking
                    <FiArrowUpRight className="h-5 w-5" />
                  </button>
                </SignUpButton>
              )}
              <button onClick={() => router.push(user ? "/add-expense" : "/")} className="btn-secondary">
                <FiPlus className="h-5 w-5" />
                Quick add
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="panel overflow-hidden p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">June snapshot</p>
                  <p className="mt-3 text-4xl font-black" style={{ color: "var(--ink)" }}>₹24,860</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: "var(--ink-3)" }}>Tracked this month</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg-accent)", color: "var(--teal-dark)" }}>
                  <FiShield className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-8 flex h-44 items-end justify-between gap-2">
                {[38, 62, 44, 82, 55, 72, 48].map((height, index) => (
                  <div
                    key={index}
                    className="relative flex-1 h-full flex items-end"
                  >
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{ backgroundColor: "rgba(214, 211, 208, 0.5)" }}
                    />
                    <div
                      className="relative w-full rounded-lg"
                      style={{ height: `${height}%`, backgroundColor: "var(--teal)" }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                {[
                  ["Food & Dining", "UPI", "₹840"],
                  ["Metro recharge", "Card", "₹500"],
                  ["Movie night", "Cash", "₹1,200"],
                ].map(([label, mode, amount]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl p-4"
                    style={{ backgroundColor: "var(--bg-pill)" }}
                  >
                    <div>
                      <p className="font-extrabold" style={{ color: "var(--ink)" }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: "var(--ink-3)" }}>{mode}</p>
                    </div>
                    <p className="font-black" style={{ color: "var(--rose)" }}>{amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="panel-tight p-5">
                <Icon className="h-6 w-6" style={{ color: "var(--teal-dark)" }} />
                <h2 className="mt-4 text-lg font-black" style={{ color: "var(--ink)" }}>{feature.title}</h2>
                <p className="mt-2 text-sm font-medium leading-6" style={{ color: "var(--ink-3)" }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
