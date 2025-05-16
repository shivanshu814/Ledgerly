import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FiArrowUpRight,
  FiDollarSign,
  FiCalendar,
  FiList,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Transaction } from "@prisma/client";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
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
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalExpense(data.totalExpense || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const getMonthData = () => {
    const monthStart = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    );

    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const dailyData = Array.from({ length: monthEnd.getDate() }, (_, i) => {
      const day = i + 1;
      const dayTransactions = monthTransactions.filter(
        (t) => new Date(t.date).getDate() === day
      );
      return {
        day,
        amount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
      };
    });

    return {
      transactions: monthTransactions,
      dailyData,
      total: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
    };
  };

  const monthData = getMonthData();

  const chartData = {
    labels: monthData.dailyData.map((d) => d.day.toString()),
    datasets: [
      {
        label: "Daily Expenses",
        data: monthData.dailyData.map((d) => d.amount),
        backgroundColor: "#7289da",
        borderColor: "#7289da",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const newDate = new Date(selectedMonth);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete transaction");
        setTransactions(transactions.filter((t) => t.id !== id));
        toast.success("Transaction deleted successfully");
      } catch (err) {
        toast.error("Failed to delete transaction");
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/edit-transaction/${id}`);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#1a1b26] to-[#2d2e3a] py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto animate-pulse'>
          <div className='mb-8'>
            <div className='h-8 w-1/3 bg-gray-700/50 rounded-lg mb-2'></div>
            <div className='h-6 w-1/4 bg-gray-700/40 rounded-lg'></div>
          </div>
          <div className='mb-8 h-12 w-48 bg-[#7289da]/30 rounded-lg'></div>
          <div className='mb-8 h-32 bg-[#1f2937]/60 rounded-xl'></div>
          <div className='mb-8 h-64 bg-[#1f2937]/60 rounded-xl'></div>
          <div className='h-64 bg-[#1f2937]/60 rounded-xl'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-[#1a1b26] py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg'>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1a1b26] to-[#2d2e3a] py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h1 className='text-3xl font-bold text-[#7289da] mb-2'>Dashboard</h1>
          <p className='text-gray-400 text-lg'>
            Welcome back, {user?.firstName} 👋
          </p>
        </motion.div>

        {/* Add New Expense Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            setAddLoading(true);
            await router.push("/add-expense");
            setAddLoading(false);
          }}
          className={`w-full sm:w-auto mb-8 px-6 py-3 text-white bg-gradient-to-r from-[#7289da] to-[#5b6eae] rounded-lg font-medium hover:shadow-lg hover:shadow-[#7289da]/20 transition-all flex items-center gap-2 ${
            addLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={addLoading}
        >
          <FiPlus className='h-5 w-5' />
          {addLoading ? "Loading..." : "Add New Expense"}
        </motion.button>

        {/* Monthly Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-[#1f2937] rounded-xl p-6 mb-8 shadow-xl hover:shadow-2xl transition-all duration-300'
        >
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl text-gray-200 font-semibold'>
              Monthly Overview
            </h2>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => handleMonthChange("prev")}
                className='p-2 text-[#7289da] hover:bg-[#7289da]/10 rounded-lg transition-colors'
              >
                <FiChevronLeft className='h-5 w-5' />
              </button>
              <span className='text-gray-200 font-medium'>
                {selectedMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => handleMonthChange("next")}
                className='p-2 text-[#7289da] hover:bg-[#7289da]/10 rounded-lg transition-colors'
              >
                <FiChevronRight className='h-5 w-5' />
              </button>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <div className='bg-[#1a1b26] rounded-lg p-4'>
              <h3 className='text-sm text-gray-400 mb-1'>Monthly Total</h3>
              <p className='text-2xl font-bold text-red-400'>
                ₹{monthData.total.toLocaleString()}
              </p>
            </div>
            <div className='bg-[#1a1b26] rounded-lg p-4'>
              <h3 className='text-sm text-gray-400 mb-1'>Transactions</h3>
              <p className='text-2xl font-bold text-[#7289da]'>
                {monthData.transactions.length}
              </p>
            </div>
            <div className='bg-[#1a1b26] rounded-lg p-4'>
              <h3 className='text-sm text-gray-400 mb-1'>Daily Average</h3>
              <p className='text-2xl font-bold text-green-400'>
                ₹
                {(monthData.total / monthData.dailyData.length).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-[#1f2937] rounded-xl p-6 mb-8 shadow-xl hover:shadow-2xl transition-all duration-300'
        >
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl text-gray-200 font-semibold'>
              Daily Expenses
            </h2>
            <div className='p-3 bg-[#7289da]/10 rounded-full'>
              <FiCalendar className='h-6 w-6 text-[#7289da]' />
            </div>
          </div>
          <div className='h-64'>
            <Bar
              data={chartData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: "#1f2937",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                      label: (context) => `₹${context.raw}`,
                      title: (context) => `Day ${context[0].label}`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(75, 85, 99, 0.2)",
                    },
                    ticks: {
                      color: "#9CA3AF",
                      callback: (value) => `₹${value}`,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: "#9CA3AF",
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-[#1f2937] rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300'
        >
          <h2 className='text-xl text-gray-200 font-semibold mb-6'>
            Recent Transactions
          </h2>
          <div className='space-y-4'>
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  key={transaction.id}
                  className='flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#1a1b26] rounded-lg hover:bg-[#1f2937] transition-colors'
                >
                  <div className='space-y-1'>
                    <p className='font-medium text-gray-200'>
                      {transaction.description}
                    </p>
                    <div className='flex items-center text-sm text-gray-400'>
                      <FiCalendar className='h-4 w-4 mr-1' />
                      <span>{new Date(transaction.date).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className='mt-2 sm:mt-0 flex items-center space-x-3'>
                    <span className='text-red-400 font-semibold'>
                      ₹{transaction.amount.toLocaleString()}
                    </span>
                    <span className='px-2 py-1 text-xs rounded-full bg-[#7289da]/10 text-[#7289da]'>
                      {transaction.paymentMode}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='text-center py-8'
              >
                <p className='text-gray-400 text-lg mb-4'>
                  No transactions found
                </p>
                <button
                  onClick={() => router.push("/add-expense")}
                  className='px-6 py-3 text-white bg-gradient-to-r from-[#7289da] to-[#5b6eae] rounded-lg font-medium hover:shadow-lg hover:shadow-[#7289da]/20 transition-all flex items-center gap-2 mx-auto'
                >
                  <FiPlus className='h-5 w-5' />
                  Add Your First Expense
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
