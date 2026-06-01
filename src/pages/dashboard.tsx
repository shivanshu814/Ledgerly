import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiList, FiPlus, FiTrendingUp } from "react-icons/fi";
import { useRouter } from "next/router";
import { Transaction } from "@prisma/client";

import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { GetServerSideProps } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { useUser } from "@clerk/nextjs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const DELAY_CLASSES = ["animate-fade-up", "animate-fade-up-1", "animate-fade-up-2"];

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard = React.memo(function StatCard({ label, value, hint, index }: { label: string; value: string; hint: string; index: number }) {
  return (
    <div className={`panel-tight p-5 ${DELAY_CLASSES[index]}`}>
      <p className="text-sm font-extrabold" style={{ color: "var(--ink-3)" }}>{label}</p>
      <p className="mt-3 text-3xl font-black" style={{ color: "var(--ink)" }}>{value}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: "var(--ink-3)" }}>{hint}</p>
    </div>
  );
});

const RecentEntry = React.memo(function RecentEntry({ t }: { t: Transaction }) {
  const formatted = useMemo(() => new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), [t.date]);
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-pill)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black" style={{ color: "var(--ink)" }}>{t.description}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--ink-3)" }}>
            <FiCalendar className="h-3.5 w-3.5" />{formatted}
          </p>
        </div>
        <p className="font-black" style={{ color: "var(--rose)" }}>{currency.format(t.amount)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip">{t.paymentMode}</span>
        <span className="chip">{t.category}</span>
      </div>
    </div>
  );
});

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialMonthTransactions: Transaction[];
  initialRecentTransactions: Transaction[];
  initialMonthlyTotal: number;
  initialTopCategory: string;
  initialYear: number;
  initialMonth: number;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard({ initialMonthTransactions, initialRecentTransactions, initialMonthlyTotal, initialTopCategory, initialYear, initialMonth }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();

  const [selectedMonth, setSelectedMonth] = useState(() => new Date(initialYear, initialMonth, 1));
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>(initialMonthTransactions);
  const [recentTransactions] = useState<Transaction[]>(initialRecentTransactions);
  const [addLoading, setAddLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // Track if this is the initial server-provided month
  const isInitialMonth = useMemo(() => {
    return selectedMonth.getFullYear() === initialYear && selectedMonth.getMonth() === initialMonth;
  }, [selectedMonth, initialYear, initialMonth]);

  const { monthStart, monthEnd } = useMemo(() => {
    const y = selectedMonth.getFullYear(), m = selectedMonth.getMonth();
    return { monthStart: new Date(y, m, 1), monthEnd: new Date(y, m + 1, 0, 23, 59, 59, 999) };
  }, [selectedMonth]);

  // Only fetch when month changes away from the server-provided initial
  useEffect(() => {
    if (isInitialMonth) return;
    let cancelled = false;
    setChartLoading(true);
    const params = new URLSearchParams({ startDate: monthStart.toISOString(), endDate: monthEnd.toISOString(), limit: "100", sortBy: "date", sortOrder: "desc" });
    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setMonthTransactions(data.transactions || []); setChartLoading(false); } })
      .catch(() => { if (!cancelled) setChartLoading(false); });
    return () => { cancelled = true; };
  }, [isInitialMonth, monthStart, monthEnd]);

  useEffect(() => { router.prefetch("/add-expense"); router.prefetch("/transactions"); }, [router]);

  const dailyData = useMemo(() => {
    const dayMap: Record<number, number> = {};
    for (const t of monthTransactions) { const d = new Date(t.date).getDate(); dayMap[d] = (dayMap[d] || 0) + t.amount; }
    return Array.from({ length: monthEnd.getDate() }, (_, i) => ({ day: i + 1, amount: dayMap[i + 1] || 0 }));
  }, [monthTransactions, monthEnd]);

  const monthlyTotal = useMemo(() => {
    if (isInitialMonth) return initialMonthlyTotal;
    return monthTransactions.reduce((s, t) => s + t.amount, 0);
  }, [monthTransactions, isInitialMonth, initialMonthlyTotal]);

  const topCategory = useMemo(() => {
    if (isInitialMonth) return initialTopCategory;
    const acc: Record<string, number> = {};
    for (const t of monthTransactions) acc[t.category] = (acc[t.category] || 0) + t.amount;
    return Object.entries(acc).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace("_", " ") || "None";
  }, [monthTransactions, isInitialMonth, initialTopCategory]);

  const chartColors = useMemo(() => ({
    bar: theme === "dark" ? "#14b8a6" : "#0f766e",
    muted: theme === "dark" ? "#8a9a93" : "#69736d",
    grid: theme === "dark" ? "rgba(60,80,70,0.3)" : "rgba(23,33,29,0.08)",
    tooltipBg: theme === "dark" ? "#e8e2d8" : "#17211d",
    tooltipText: theme === "dark" ? "#17211d" : "#fffbf2",
  }), [theme]);

  const chartData = useMemo(() => ({
    labels: dailyData.map((d) => String(d.day)),
    datasets: [{ label: "Daily Expenses", data: dailyData.map((d) => d.amount), backgroundColor: chartColors.bar, borderRadius: 8, borderSkipped: false as const }],
  }), [dailyData, chartColors.bar]);

  const chartOptions = useMemo(() => ({
    maintainAspectRatio: false, responsive: true, animation: { duration: 250 } as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartColors.tooltipBg, titleColor: chartColors.tooltipText, bodyColor: chartColors.tooltipText,
        padding: 12, cornerRadius: 12, displayColors: false,
        callbacks: { label: (ctx: any) => currency.format(Number(ctx.raw || 0)), title: (ctx: any) => `Day ${ctx[0].label}` },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: chartColors.grid }, ticks: { color: chartColors.muted, callback: (v: any) => `₹${v}` } },
      x: { grid: { display: false }, ticks: { color: chartColors.muted, maxTicksLimit: 12 } },
    },
  }), [chartColors]);

  const handleMonthChange = useCallback((dir: "prev" | "next") => {
    setSelectedMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() + (dir === "prev" ? -1 : 1)); return d; });
  }, []);

  const handleAddExpense = useCallback(async () => { setAddLoading(true); await router.push("/add-expense"); setAddLoading(false); }, [router]);

  const monthLabel = useMemo(() => selectedMonth.toLocaleString("default", { month: "long", year: "numeric" }), [selectedMonth]);

  const stats = useMemo(() => [
    { label: "Monthly total", value: currency.format(monthlyTotal), hint: "Your selected month spend" },
    { label: "Transactions", value: String(monthTransactions.length), hint: "Entries captured" },
    { label: "Top category", value: topCategory, hint: "Highest spend bucket" },
  ], [monthlyTotal, monthTransactions.length, topCategory]);

  return (
    <main className="app-shell">
      <div className="app-container">
        <section className="animate-fade-up grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="page-title mt-3">Welcome back, {user?.firstName || "there"}.</h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7" style={{ color: "var(--ink-3)" }}>
              Your month at a glance, with the recent expenses that deserve attention.
            </p>
          </div>
          <div className="flex items-end">
            <button onClick={handleAddExpense} disabled={addLoading} className="btn-primary w-full sm:w-auto">
              <FiPlus className="h-5 w-5" />{addLoading ? "Opening…" : "Add expense"}
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="animate-fade-up-2 panel p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Daily flow</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--ink)" }}>Spending pattern</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleMonthChange("prev")} className="icon-btn" aria-label="Previous month"><FiChevronLeft className="h-5 w-5" /></button>
                <span className="min-w-36 text-center text-sm font-black" style={{ color: "var(--ink-2)" }}>{monthLabel}</span>
                <button onClick={() => handleMonthChange("next")} className="icon-btn" aria-label="Next month"><FiChevronRight className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="relative h-72">
              {chartLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "3px solid var(--border)", borderTopColor: "var(--teal)" }} />
                </div>
              )}
              {!chartLoading && monthTransactions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl" style={{ backgroundColor: "var(--bg-pill)" }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="32" width="8" height="10" rx="2" fill="var(--border)" />
                    <rect x="20" y="22" width="8" height="20" rx="2" fill="var(--border)" />
                    <rect x="34" y="14" width="8" height="28" rx="2" fill="var(--border)" />
                  </svg>
                  <p className="text-sm font-black" style={{ color: "var(--ink-3)" }}>No spending this month</p>
                  <p className="text-xs font-semibold" style={{ color: "var(--ink-4)" }}>Add an expense to see your daily flow</p>
                </div>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          <div className="animate-fade-up-3 panel p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Recent</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--ink)" }}>Last entries</h2>
              </div>
              <FiTrendingUp className="h-6 w-6" style={{ color: "var(--teal-dark)" }} />
            </div>
            <div className="space-y-3">
              {recentTransactions.length > 0
                ? recentTransactions.map((t) => <RecentEntry key={t.id} t={t} />)
                : (
                  <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: "var(--line)" }}>
                    <FiList className="mx-auto h-7 w-7" style={{ color: "var(--teal-dark)" }} />
                    <p className="mt-3 font-black" style={{ color: "var(--ink)" }}>No entries yet</p>
                    <button onClick={() => router.push("/add-expense")} className="btn-primary mt-4"><FiPlus className="h-5 w-5" />Add first expense</button>
                  </div>
                )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─── Server-side data fetch ────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);
  if (!userId) return { redirect: { destination: "/", permanent: false } };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return {
        props: {
          initialMonthTransactions: [],
          initialRecentTransactions: [],
          initialMonthlyTotal: 0,
          initialTopCategory: "None",
          initialYear: now.getFullYear(),
          initialMonth: now.getMonth(),
        },
      };
    }

    const where = { userId: user.id, date: { gte: monthStart, lte: monthEnd } };

    // Single round-trip: month data + recent 5 + aggregate
    const [monthTransactions, recentTransactions, aggregate] = await prisma.$transaction([
      prisma.transaction.findMany({ where, orderBy: { date: "desc" }, take: 100 } as any),
      prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 5 }),
      prisma.transaction.aggregate({ where, _sum: { amount: true } } as any),
    ]);

    const monthlyTotal = (aggregate as any)._sum?.amount ?? 0;

    // Compute top category server-side
    const catMap: Record<string, number> = {};
    for (const t of monthTransactions as Transaction[]) catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace("_", " ") || "None";

    ctx.res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    return {
      props: {
        initialMonthTransactions: JSON.parse(JSON.stringify(monthTransactions)),
        initialRecentTransactions: JSON.parse(JSON.stringify(recentTransactions)),
        initialMonthlyTotal: monthlyTotal,
        initialTopCategory: topCategory,
        initialYear: now.getFullYear(),
        initialMonth: now.getMonth(),
      },
    };
  } catch (err) {
    console.error("Dashboard SSR error:", err);
    return {
      props: {
        initialMonthTransactions: [],
        initialRecentTransactions: [],
        initialMonthlyTotal: 0,
        initialTopCategory: "None",
        initialYear: now.getFullYear(),
        initialMonth: now.getMonth(),
      },
    };
  }
};
