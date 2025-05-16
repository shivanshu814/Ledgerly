import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { Transaction } from "@prisma/client";
import {
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiFilter,
  FiX,
  FiAlertTriangle,
  FiCreditCard,
  FiChevronDown,
  FiCalendar,
} from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function getMonthRangeFromSelection(month: number, year: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

const monthsOptions = [
  { value: "0", label: "Jan" },
  { value: "1", label: "Feb" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Apr" },
  { value: "4", label: "May" },
  { value: "5", label: "Jun" },
  { value: "6", label: "Jul" },
  { value: "7", label: "Aug" },
  { value: "8", label: "Sep" },
  { value: "9", label: "Oct" },
  { value: "10", label: "Nov" },
  { value: "11", label: "Dec" },
];

const paymentModesOptions = [
  { value: "all", label: "All", icon: "🌐" },
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "CARD", label: "Card", icon: "💳" },
  { value: "UPI", label: "UPI", icon: "📱" },
];

function downloadPDF(
  transactions: Transaction[],
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  paymentMode: string,
  totalAmount: number
) {
  const doc = new jsPDF();

  // Header Bar
  doc.setFillColor(114, 137, 218); // #7289da
  doc.rect(0, 0, 210, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor("#fff");
  doc.text("Expense Report", 14, 19);

  // Watermark (faded rupee symbol using Helvetica)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(70);
  // Use a very light gray for the watermark
  doc.setTextColor(240, 240, 240);
  doc.text("INR", 150, 70, { angle: 20 });

  // Calculate exact start and end dates
  const startDateObj = new Date(startYear, startMonth, 1);
  const endDateObj = new Date(endYear, endMonth + 1, 0);
  const startDateStr = startDateObj.toLocaleDateString("en-GB");
  const endDateStr = endDateObj.toLocaleDateString("en-GB");

  // Summary Section
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#222");
  let y = 38;
  doc.setFont("helvetica", "bold");
  doc.text("Summary:", 14, y);
  doc.setFont("helvetica", "normal");
  y += 9;
  doc.text("Range:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${monthsOptions[startMonth].label} ${startYear} (${startDateStr}) to ${monthsOptions[endMonth].label} ${endYear} (${endDateStr})`,
    36,
    y
  );
  doc.setFont("helvetica", "normal");
  y += 8;
  doc.text("Payment Mode:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    paymentMode === "all"
      ? "All"
      : paymentModesOptions.find((m: any) => m.value === paymentMode)?.label ||
          "",
    48,
    y
  );
  doc.setFont("helvetica", "normal");
  y += 8;
  doc.text("Total:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 29, 72); // #e11d48
  doc.text(`INR ${totalAmount.toLocaleString()}`, 32, y);
  doc.setTextColor("#222");

  // Table
  autoTable(doc, {
    startY: y + 12,
    head: [["Date", "Description", "Amount", "Payment Mode"]],
    body: transactions.map((t) => [
      new Date(t.date).toLocaleString(),
      t.description,
      t.amount.toLocaleString(),
      paymentModesOptions.find((m: any) => m.value === t.paymentMode)?.label ||
        t.paymentMode,
    ]),
    styles: { fontSize: 10, font: "helvetica", textColor: 34 },
    headStyles: {
      fillColor: [114, 137, 218],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);
  doc.setFontSize(11);
  doc.setTextColor("#888");
  doc.setFont("helvetica", "bold");
  doc.text("Made with love by Shivanshu", 14, pageHeight - 10);

  doc.save(
    `Expense_Report_${monthsOptions[startMonth].label}_${startYear}_to_${monthsOptions[endMonth].label}_${endYear}.pdf`
  );
}

// Custom Dropdown Component
const CustomDropdown = ({
  options,
  value,
  onChange,
  icon: Icon,
  placeholder,
}: {
  options: { value: string; label: string; icon?: string }[];
  value: string;
  onChange: (value: string) => void;
  icon: any;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='block pl-4 pr-3 py-2 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 flex items-center space-x-2'
      >
        <Icon className='h-4 w-4 text-gray-300' />
        <span className='text-sm truncate'>
          {selectedOption?.icon} {selectedOption?.label || placeholder}
        </span>
        <FiChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute z-10 w-full mt-2 bg-black rounded-xl border border-zinc-700 overflow-hidden'>
          <div className='max-h-60 overflow-auto scrollbar-none'>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center transition-colors duration-200
            ${
              value === option.value
                ? "bg-zinc-700 text-blue-400 font-semibold"
                : "text-gray-300"
            }
            hover:bg-zinc-800`}
              >
                <span className='mr-2 text-base'>{option.icon}</span>
                <span className='text-sm'>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Transactions() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"all" | "month">("all");
  const [paymentMode, setPaymentMode] = useState<
    "all" | "CASH" | "CARD" | "UPI" | "NET_BANKING"
  >("all");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth());
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      setLoading(true);
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setTransactions(data.transactions);
      setLoading(false);
    };
    fetchTransactions();
  }, [user]);

  const { start, end } = getMonthRangeFromSelection(
    selectedMonth,
    selectedYear
  );
  const startDate = getDateFromMonthYear(startMonth, startYear);
  const endDate = getDateFromMonthYear(endMonth, endYear, true);
  let filteredTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date >= startDate && date <= endDate;
  });
  if (paymentMode !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.paymentMode === paymentMode
    );
  }
  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // Skeleton loader
  if (loading) {
    return (
      <div className='min-h-screen bg-black text-white'>
        <div className='fixed inset-0 -z-10'>
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]'></div>
          <div className='absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f6,transparent)] opacity-20'></div>
        </div>
        <div className='relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse'>
          <div className='mb-8 h-8 w-1/3 bg-gray-700/50 rounded-lg'></div>
          <div className='mb-8 h-12 w-48 bg-[#7289da]/30 rounded-lg'></div>
          <div className='mb-8 h-32 bg-[#1f2937]/60 rounded-xl'></div>
          <div className='mb-8 h-64 bg-[#1f2937]/60 rounded-xl'></div>
          <div className='h-64 bg-[#1f2937]/60 rounded-xl'></div>
        </div>
      </div>
    );
  }

  const yearsOptions = Array.from({ length: 6 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y.toString(), label: y.toString() };
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    try {
      const response = await fetch(
        `/api/transactions/${editingTransaction.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingTransaction),
        }
      );
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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== id));
        setDeletingTransaction(null);
        toast.success("Transaction deleted successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction");
    }
  };

  function getDateFromMonthYear(month: number, year: number, isEnd = false) {
    if (isEnd) {
      return new Date(year, month + 1, 0, 23, 59, 59, 999);
    }
    return new Date(year, month, 1);
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Animated background */}
      <div className='fixed inset-0 -z-10'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]'></div>
        <div className='absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f6,transparent)] opacity-20'></div>
      </div>

      <div
        className='relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 lg:pt-20'
        style={{ marginBottom: "100px" }}
      >
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8'>
          <div className='flex items-center mb-4 sm:mb-0'>
            <button
              onClick={() => router.back()}
              className='mr-4 text-gray-400 hover:text-white transition-colors duration-200 group'
            >
              <FiArrowLeft className='h-6 w-6 group-hover:-translate-x-1 transition-transform duration-200' />
            </button>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
              Transactions
            </h1>
          </div>
          <div className='flex flex-wrap items-center gap-2 bg-[#1a1a1a] rounded-xl p-2 border border-white/5'>
            <div className='flex items-center gap-1 min-w-[120px]'>
              <span className='text-gray-400 text-sm'>From:</span>
              <CustomDropdown
                options={monthsOptions}
                value={startMonth.toString()}
                onChange={(v) => setStartMonth(Number(v))}
                icon={FiCalendar}
                placeholder='Month'
              />
              <CustomDropdown
                options={yearsOptions}
                value={startYear.toString()}
                onChange={(v) => setStartYear(Number(v))}
                icon={FiCalendar}
                placeholder='Year'
              />
            </div>
            <div className='flex items-center gap-1 min-w-[120px]'>
              <span className='text-gray-400 text-sm'>To:</span>
              <CustomDropdown
                options={monthsOptions}
                value={endMonth.toString()}
                onChange={(v) => setEndMonth(Number(v))}
                icon={FiCalendar}
                placeholder='Month'
              />
              <CustomDropdown
                options={yearsOptions}
                value={endYear.toString()}
                onChange={(v) => setEndYear(Number(v))}
                icon={FiCalendar}
                placeholder='Year'
              />
            </div>
            <div className='flex items-center gap-1 min-w-[120px]'>
              <span className='text-gray-400 text-sm'>Mode:</span>
              <CustomDropdown
                options={paymentModesOptions}
                value={paymentMode}
                onChange={(v) => setPaymentMode(v as any)}
                icon={FiCreditCard}
                placeholder='Mode'
              />
            </div>
            <button
              onClick={() =>
                downloadPDF(
                  filteredTransactions,
                  startMonth,
                  startYear,
                  endMonth,
                  endYear,
                  paymentMode,
                  totalAmount
                )
              }
              className='ml-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7289da] to-[#5b6eae] text-white font-medium hover:shadow-lg hover:shadow-[#7289da]/20 transition-all'
            >
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Total Amount */}
        <div className='mb-4 text-lg font-semibold text-[#7289da]'>
          Total: ₹{totalAmount.toLocaleString()}
        </div>

        {/* Transactions List */}
        <div className='bg-[#1a1a1a]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 overflow-hidden'>
          {/* Desktop View */}
          <div className='hidden md:block'>
            <table className='min-w-full divide-y divide-white/5'>
              <thead>
                <tr className='bg-black/20'>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                    Description
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                    Payment Mode
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/5'>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className='hover:bg-white/5 transition-colors duration-200'
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-gray-300 text-sm'>
                      {new Date(transaction.date).toLocaleString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-gray-300 text-sm'>
                      {transaction.description}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-red-400 text-sm font-medium'>
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-gray-300 text-sm'>
                      {transaction.paymentMode === "CASH" && "💵 Cash"}
                      {transaction.paymentMode === "CARD" && "💳 Card"}
                      {transaction.paymentMode === "UPI" && "📱 UPI"}
                      {transaction.paymentMode === "NET_BANKING" &&
                        "🏦 Net Banking"}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex space-x-3'>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className='text-blue-400 hover:text-blue-300 transition-colors duration-200 p-1 hover:bg-blue-400/10 rounded-lg'
                        >
                          <FiEdit2 className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => setDeletingTransaction(transaction)}
                          className='text-red-400 hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-400/10 rounded-lg'
                        >
                          <FiTrash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className='md:hidden divide-y divide-white/5'>
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className='p-4 hover:bg-white/5 transition-colors duration-200'
              >
                <div className='flex justify-between items-start mb-2'>
                  <div className='space-y-1'>
                    <p className='text-gray-300 font-medium'>
                      {transaction.description}
                    </p>
                    <p className='text-sm text-gray-400'>
                      {new Date(transaction.date).toLocaleString()}
                    </p>
                  </div>
                  <p className='text-red-400 font-medium'>
                    ₹{transaction.amount.toLocaleString()}
                  </p>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full'>
                    {transaction.paymentMode === "CASH" && "💵 Cash"}
                    {transaction.paymentMode === "CARD" && "💳 Card"}
                    {transaction.paymentMode === "UPI" && "📱 UPI"}
                    {transaction.paymentMode === "NET_BANKING" &&
                      "🏦 Net Banking"}
                  </span>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => handleEdit(transaction)}
                      className='text-blue-400 hover:text-blue-300 transition-colors duration-200 p-2 hover:bg-blue-400/10 rounded-lg'
                    >
                      <FiEdit2 className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => setDeletingTransaction(transaction)}
                      className='text-red-400 hover:text-red-300 transition-colors duration-200 p-2 hover:bg-red-400/10 rounded-lg'
                    >
                      <FiTrash2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingTransaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50'
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className='bg-black rounded-2xl border border-gray-900 p-6 w-full max-w-md'
              >
                <div className='flex justify-between items-center mb-6'>
                  <h3 className='text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                    Edit Transaction
                  </h3>
                  <button
                    onClick={() => setEditingTransaction(null)}
                    className='text-gray-400 hover:text-white transition-colors duration-200'
                  >
                    <FiX className='h-6 w-6' />
                  </button>
                </div>
                <form onSubmit={handleUpdate} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Amount
                    </label>
                    <input
                      type='number'
                      value={editingTransaction.amount}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          amount: parseFloat(e.target.value),
                        })
                      }
                      className='block w-full px-4 py-3.5 rounded-xl bg-white text-black placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Description
                    </label>
                    <input
                      type='text'
                      value={editingTransaction.description}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          description: e.target.value,
                        })
                      }
                      className='block w-full px-4 py-3.5 rounded-xl bg-white text-black placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Payment Mode
                    </label>
                    <CustomDropdown
                      options={paymentModesOptions}
                      value={editingTransaction.paymentMode}
                      onChange={(value) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          paymentMode: value,
                        })
                      }
                      icon={FiCreditCard}
                      placeholder='Select payment mode'
                    />
                  </div>
                  <div className='flex justify-end space-x-4 pt-4'>
                    <button
                      type='button'
                      onClick={() => setEditingTransaction(null)}
                      className='px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='px-6 py-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-500/20'
                    >
                      Update
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingTransaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50'
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className='bg-black rounded-2xl border border-gray-900 p-6 w-full max-w-md'
              >
                <div className='flex items-center justify-center mb-6'>
                  <div className='p-3 bg-red-500/10 rounded-full'>
                    <FiAlertTriangle className='h-8 w-8 text-red-500' />
                  </div>
                </div>
                <h3 className='text-xl font-bold text-center text-white mb-2'>
                  Delete Transaction
                </h3>
                <p className='text-gray-400 text-center mb-6'>
                  Are you sure you want to delete this transaction? This action
                  cannot be undone.
                </p>
                <div className='flex justify-center space-x-4'>
                  <button
                    onClick={() => setDeletingTransaction(null)}
                    className='px-6 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deletingTransaction.id)}
                    className='px-6 py-2 rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform hover:scale-[1.02] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-lg shadow-red-500/20'
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
