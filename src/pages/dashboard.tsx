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
import { FiArrowUpRight, FiTrendingUp, FiDollarSign, FiCalendar, FiList } from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Transaction } from "@prisma/client";

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

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch("/api/transactions");
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalExpense(data.totalExpense || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const chartData = {
    labels: transactions?.map((t) => new Date(t.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: "Expenses",
        data: transactions?.map((t) => t.amount) || [],
        backgroundColor: "#7289da",
        borderColor: "#7289da",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b26] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700/50 rounded-lg w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1f2937] p-6 rounded-lg h-32"></div>
              <div className="bg-[#1f2937] p-6 rounded-lg h-32"></div>
            </div>
            <div className="bg-[#1f2937] p-6 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1b26] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b26] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#7289da] mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">Welcome back, {user?.firstName}</p>
        </div>

        {/* Add New Expense Button */}
        <button
          onClick={() => router.push("/add-expense")}
          className="w-full sm:w-auto mb-8 px-6 py-3 text-white bg-[#7289da] rounded-lg font-medium hover:bg-[#7289da]/90 transition-colors"
        >
          Add New Expense
        </button>

        {/* Stats Card */}
        <div className="bg-[#1f2937] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-gray-200">Total Expense</h2>
            <div className="p-3 bg-[#7289da]/10 rounded-full">
            ₹
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400 mb-4">₹{totalExpense}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-400">
              <FiList className="h-4 w-4 mr-1" />
              <span>Transactions</span>
            </div>
            <button
              onClick={() => router.push("/transactions")}
              className="flex items-center text-sm text-[#7289da] hover:text-[#7289da]/80 transition-colors"
            >
              <span>View all transactions</span>
              <FiArrowUpRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-[#1f2937] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-gray-200">Expense Chart</h2>
            <div className="p-3 bg-[#7289da]/10 rounded-full">
              <FiCalendar className="h-6 w-6 text-[#7289da]" />
            </div>
          </div>
          <div className="h-64">
            <Bar 
              data={chartData} 
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                      label: (context) => `₹${context.raw}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(75, 85, 99, 0.2)'
                    },
                    ticks: {
                      color: '#9CA3AF',
                      callback: (value) => `₹${value}`
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: '#9CA3AF'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#1f2937] rounded-lg p-6">
          <h2 className="text-xl text-gray-200 mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#1a1b26] rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-200">{transaction.description}</p>
                    <div className="flex items-center text-sm text-gray-400">
                      <FiCalendar className="h-4 w-4 mr-1" />
                      <span>{new Date(transaction.date).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center space-x-3">
                    <span className="text-red-400 font-semibold">₹{transaction.amount}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-[#7289da]/10 text-[#7289da]">
                      {transaction.paymentMode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No transactions found</p>
                <button
                  onClick={() => router.push("/add-expense")}
                  className="mt-4 px-6 py-2 text-white bg-[#7289da] rounded-lg font-medium hover:bg-[#7289da]/90 transition-colors"
                >
                  Add Your First Expense
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 