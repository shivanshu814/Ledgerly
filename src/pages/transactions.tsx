import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Transaction } from "@prisma/client";
import { FiEdit2, FiTrash2, FiArrowLeft, FiFilter } from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function Transactions() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setTransactions(data.transactions);
    };
    fetchTransactions();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== id));
        toast.success("Transaction deleted successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingTransaction),
      });

      if (response.ok) {
        setTransactions(
          transactions.map((t) =>
            t.id === editingTransaction.id ? editingTransaction : t
          )
        );
        setEditingTransaction(null);
        toast.success("Transaction updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update transaction");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true;
    return transaction.paymentMode === filter;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f6,transparent)] opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-400 hover:text-white transition-colors duration-200 group"
            >
              <FiArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform duration-200" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Transactions
            </h1>
          </div>
          <div className="flex items-center space-x-3 bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-2 border border-white/5">
            <FiFilter className="text-gray-400 ml-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none focus:ring-0 border-0"
            >
              <option value="all" className="bg-[#1a1a1a]">All Transactions</option>
              <option value="CASH" className="bg-[#1a1a1a]">💵 Cash</option>
              <option value="CARD" className="bg-[#1a1a1a]">💳 Card</option>
              <option value="UPI" className="bg-[#1a1a1a]">📱 UPI</option>
              <option value="NET_BANKING" className="bg-[#1a1a1a]">🏦 Net Banking</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-white/5">
              <thead>
                <tr className="bg-black/20">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Payment Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                      {new Date(transaction.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-400 text-sm">
                      ₹{transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                      {transaction.paymentMode === "CASH" && "💵 Cash"}
                      {transaction.paymentMode === "CARD" && "💳 Card"}
                      {transaction.paymentMode === "UPI" && "📱 UPI"}
                      {transaction.paymentMode === "NET_BANKING" && "🏦 Net Banking"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200 p-1 hover:bg-blue-400/10 rounded-lg"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-400/10 rounded-lg"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-white/5">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-white/5 transition-colors duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="text-gray-300 font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(transaction.date).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-red-400 font-medium">₹{transaction.amount}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                    {transaction.paymentMode === "CASH" && "💵 Cash"}
                    {transaction.paymentMode === "CARD" && "💳 Card"}
                    {transaction.paymentMode === "UPI" && "📱 UPI"}
                    {transaction.paymentMode === "NET_BANKING" && "🏦 Net Banking"}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-200 p-2 hover:bg-blue-400/10 rounded-lg"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 hover:bg-red-400/10 rounded-lg"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        {editingTransaction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-6 w-full max-w-md">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Edit Transaction
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={editingTransaction.amount}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    className="block w-full px-4 py-3.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editingTransaction.description}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        description: e.target.value,
                      })
                    }
                    className="block w-full px-4 py-3.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={editingTransaction.paymentMode}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        paymentMode: e.target.value,
                      })
                    }
                    className="block w-full px-4 py-3.5 rounded-xl bg-black/30 border border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  >
                    <option value="CASH" className="bg-[#1a1a1a]">💵 Cash</option>
                    <option value="CARD" className="bg-[#1a1a1a]">💳 Card</option>
                    <option value="UPI" className="bg-[#1a1a1a]">📱 UPI</option>
                    <option value="NET_BANKING" className="bg-[#1a1a1a]">🏦 Net Banking</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-500/20"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 