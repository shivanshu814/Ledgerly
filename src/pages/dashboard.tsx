import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiPlus,
  FiTrendingUp,
} from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Transaction } from "@prisma/client";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch("/api/transactions");
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  const monthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date >= monthStart && date <= monthEnd;
  });
  const dailyData = Array.from({ length: monthEnd.getDate() }, (_, index) => {
    const day = index + 1;
    const amount = monthTransactions
      .filter((transaction) => new Date(transaction.date).getDate() === day)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return { day, amount };
  });
  const monthlyTotal = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const topCategory =
    Object.entries(
      monthTransactions.reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const chartData = {
    labels: dailyData.map((d) => d.day.toString()),
    datasets: [
      {
        label: "Daily Expenses",
        data: dailyData.map((d) => d.amount),
        backgroundColor: "#0f766e",
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const nextDate = new Date(selectedMonth);
    nextDate.setMonth(nextDate.getMonth() + (direction === "prev" ? -1 : 1));
    setSelectedMonth(nextDate);
  };

  if (loading) {
    return (
      <main className="app-shell">
        <div className="app-container animate-pulse space-y-6">
          <div className="h-32 rounded-[1.35rem] bg-white/50" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-2xl bg-white/50" />
            <div className="h-32 rounded-2xl bg-white/50" />
            <div className="h-32 rounded-2xl bg-white/50" />
          </div>
          <div className="h-80 rounded-[1.35rem] bg-white/50" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <div className="app-container">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-container">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1fr_auto]"
        >
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="page-title mt-3 text-stone-950">
              Welcome back, {user?.firstName || "there"}.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-stone-600">
              Your month at a glance, with the recent expenses that deserve attention.
            </p>
          </div>
          <div className="flex items-end">
            <button
              onClick={async () => {
                setAddLoading(true);
                await router.push("/add-expense");
                setAddLoading(false);
              }}
              disabled={addLoading}
              className="btn-primary w-full sm:w-auto"
            >
              <FiPlus className="h-5 w-5" />
              {addLoading ? "Opening..." : "Add expense"}
            </button>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Monthly total", currency.format(monthlyTotal), "Your selected month spend"],
            ["Transactions", monthTransactions.length.toString(), "Entries captured"],
            ["Top category", topCategory.replace("_", " "), "Highest spend bucket"],
          ].map(([label, value, hint], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="panel-tight p-5"
            >
              <p className="text-sm font-extrabold text-stone-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-stone-950">{value}</p>
              <p className="mt-2 text-sm font-semibold text-stone-500">{hint}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="panel p-5 sm:p-6"
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Daily flow</p>
                <h2 className="mt-2 text-2xl font-black text-stone-950">Spending pattern</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleMonthChange("prev")} className="icon-btn" aria-label="Previous month">
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-36 text-center text-sm font-black text-stone-700">
                  {selectedMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => handleMonthChange("next")} className="icon-btn" aria-label="Next month">
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="h-72">
              <Bar
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "#17211d",
                      titleColor: "#fffbf2",
                      bodyColor: "#fffbf2",
                      padding: 12,
                      cornerRadius: 12,
                      displayColors: false,
                      callbacks: {
                        label: (context) => currency.format(Number(context.raw || 0)),
                        title: (context) => `Day ${context[0].label}`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: "rgba(23, 33, 29, 0.08)" },
                      ticks: {
                        color: "#69736d",
                        callback: (value) => `₹${value}`,
                      },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: "#69736d", maxTicksLimit: 12 },
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="panel p-5 sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Recent</p>
                <h2 className="mt-2 text-2xl font-black text-stone-950">Last entries</h2>
              </div>
              <FiTrendingUp className="h-6 w-6 text-teal-800" />
            </div>

            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="rounded-2xl bg-white/58 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-stone-900">{transaction.description}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-stone-500">
                          <FiCalendar className="h-3.5 w-3.5" />
                          {new Date(transaction.date).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-black text-[#c2413a]">
                        {currency.format(transaction.amount)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="chip">{transaction.paymentMode}</span>
                      <span className="chip">{transaction.category}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center">
                  <FiList className="mx-auto h-7 w-7 text-teal-800" />
                  <p className="mt-3 font-black text-stone-900">No entries yet</p>
                  <button onClick={() => router.push("/add-expense")} className="btn-primary mt-4">
                    <FiPlus className="h-5 w-5" />
                    Add first expense
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
