import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Transaction } from "@prisma/client";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiGlobe,
  FiSmartphone,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type IconComponent = React.ComponentType<{ className?: string }>;
type Option = { value: string; label: string; icon?: IconComponent };

const monthsOptions: Option[] = [
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

const paymentModesOptions: Option[] = [
  { value: "all", label: "All modes", icon: FiGlobe },
  { value: "CASH", label: "Cash", icon: FiDollarSign },
  { value: "CARD", label: "Card", icon: FiCreditCard },
  { value: "UPI", label: "UPI", icon: FiSmartphone },
  { value: "NET_BANKING", label: "Net Banking", icon: FiDatabase },
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getDateFromMonthYear(month: number, year: number, isEnd = false) {
  return isEnd ? new Date(year, month + 1, 0, 23, 59, 59, 999) : new Date(year, month, 1);
}

function paymentLabel(value: string) {
  return paymentModesOptions.find((mode) => mode.value === value)?.label || value;
}

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
  const startDateObj = new Date(startYear, startMonth, 1);
  const endDateObj = new Date(endYear, endMonth + 1, 0);

  doc.setFillColor(23, 33, 29);
  doc.rect(0, 0, 210, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#fffbf2");
  doc.text("Ledgerly Expense Report", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor("#222222");
  doc.text(`Range: ${startDateObj.toLocaleDateString("en-GB")} to ${endDateObj.toLocaleDateString("en-GB")}`, 14, 42);
  doc.text(`Payment mode: ${paymentMode === "all" ? "All" : paymentLabel(paymentMode)}`, 14, 50);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: INR ${totalAmount.toLocaleString("en-IN")}`, 14, 58);

  autoTable(doc, {
    startY: 68,
    head: [["Date", "Description", "Category", "Amount", "Payment Mode"]],
    body: transactions.map((t) => [
      new Date(t.date).toLocaleString(),
      t.description,
      t.category,
      `INR ${t.amount.toLocaleString("en-IN")}`,
      paymentLabel(t.paymentMode),
    ]),
    styles: { fontSize: 9, font: "helvetica", textColor: 34 },
    headStyles: { fillColor: [23, 33, 29], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 242, 233] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`Ledgerly_Report_${monthsOptions[startMonth].label}_${startYear}_to_${monthsOptions[endMonth].label}_${endYear}.pdf`);
}

function CustomDropdown({
  options,
  value,
  onChange,
  icon: Icon,
  placeholder,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon: any;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="field flex items-center justify-between gap-3 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-teal-800" />
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 shrink-0 text-teal-700" />}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <FiChevronDown className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 min-w-full overflow-hidden rounded-2xl border border-stone-300/80 bg-[#fffbf2] shadow-2xl shadow-stone-900/12">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold transition ${
                value === option.value ? "bg-[#cbe7dc] text-teal-950" : "text-stone-700 hover:bg-white"
              }`}
            >
              {option.icon && <option.icon className="h-4 w-4 shrink-0 text-teal-700" />}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Transactions() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [paymentMode, setPaymentMode] = useState<"all" | "CASH" | "CARD" | "UPI" | "NET_BANKING">("all");
  const [loading, setLoading] = useState(true);
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
      setTransactions(data.transactions || []);
      setLoading(false);
    };
    fetchTransactions();
  }, [user]);

  const yearsOptions = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });
  const startDate = getDateFromMonthYear(startMonth, startYear);
  const endDate = getDateFromMonthYear(endMonth, endYear, true);
  const filteredTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    const inDateRange = date >= startDate && date <= endDate;
    return inDateRange && (paymentMode === "all" || transaction.paymentMode === paymentMode);
  });
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTransaction),
      });
      if (response.ok) {
        setTransactions(transactions.map((t) => (t.id === editingTransaction.id ? editingTransaction : t)));
        setEditingTransaction(null);
        toast.success("Transaction updated");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update transaction");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== id));
        setDeletingTransaction(null);
        toast.success("Transaction deleted");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction");
    }
  };

  if (loading) {
    return (
      <main className="app-shell">
        <div className="app-container animate-pulse space-y-5">
          <div className="h-28 rounded-[1.35rem] bg-white/50" />
          <div className="h-20 rounded-[1.35rem] bg-white/50" />
          <div className="h-96 rounded-[1.35rem] bg-white/50" />
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-container">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button onClick={() => router.back()} className="btn-secondary mb-6 px-4 py-2.5">
              <FiArrowLeft className="h-5 w-5" />
              Back
            </button>
            <p className="eyebrow">History</p>
            <h1 className="page-title mt-3 text-stone-950">Transactions</h1>
          </div>
          <button
            onClick={() => downloadPDF(filteredTransactions, startMonth, startYear, endMonth, endYear, paymentMode, totalAmount)}
            className="btn-primary"
          >
            <FiDownload className="h-5 w-5" />
            Download report
          </button>
        </section>

        <section className="panel mt-7 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <label className="label">From</label>
              <div className="grid grid-cols-2 gap-2">
                <CustomDropdown options={monthsOptions} value={startMonth.toString()} onChange={(v) => setStartMonth(Number(v))} icon={FiCalendar} placeholder="Month" />
                <CustomDropdown options={yearsOptions} value={startYear.toString()} onChange={(v) => setStartYear(Number(v))} icon={FiCalendar} placeholder="Year" />
              </div>
            </div>
            <div>
              <label className="label">To</label>
              <div className="grid grid-cols-2 gap-2">
                <CustomDropdown options={monthsOptions} value={endMonth.toString()} onChange={(v) => setEndMonth(Number(v))} icon={FiCalendar} placeholder="Month" />
                <CustomDropdown options={yearsOptions} value={endYear.toString()} onChange={(v) => setEndYear(Number(v))} icon={FiCalendar} placeholder="Year" />
              </div>
            </div>
            <div>
              <label className="label">Payment mode</label>
              <CustomDropdown options={paymentModesOptions} value={paymentMode} onChange={(v) => setPaymentMode(v as any)} icon={FiCreditCard} placeholder="Mode" />
            </div>
            <div className="rounded-2xl bg-[#17211d] px-5 py-4 text-[#fffbf2]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-300">Total</p>
              <p className="mt-1 text-2xl font-black">{currency.format(totalAmount)}</p>
            </div>
          </div>
        </section>

        <section className="panel mt-6 overflow-hidden">
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-stone-200/90">
              <thead className="bg-white/45">
                <tr>
                  {["Date", "Description", "Category", "Amount", "Payment", "Actions"].map((header) => (
                    <th key={header} className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-white/45">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-stone-600">
                      {new Date(transaction.date).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-stone-900">{transaction.description}</td>
                    <td className="px-5 py-4 text-sm font-bold text-stone-600">{transaction.category}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-black text-[#c2413a]">
                      {currency.format(transaction.amount)}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-stone-600">{paymentLabel(transaction.paymentMode)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTransaction(transaction)} className="icon-btn" aria-label="Edit transaction">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingTransaction(transaction)} className="icon-btn text-red-700" aria-label="Delete transaction">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-stone-200/80 md:hidden">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-stone-900">{transaction.description}</p>
                    <p className="mt-1 text-xs font-bold text-stone-500">{new Date(transaction.date).toLocaleString()}</p>
                  </div>
                  <p className="font-black text-[#c2413a]">{currency.format(transaction.amount)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="chip">{transaction.category}</span>
                    <span className="chip">{paymentLabel(transaction.paymentMode)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTransaction(transaction)} className="icon-btn" aria-label="Edit transaction">
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeletingTransaction(transaction)} className="icon-btn text-red-700" aria-label="Delete transaction">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-lg font-black text-stone-900">No transactions in this range</p>
              <p className="mt-2 text-sm font-semibold text-stone-500">Try widening the filter or add a new expense.</p>
            </div>
          )}
        </section>

        <AnimatePresence>
          {editingTransaction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="panel w-full max-w-md p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-stone-950">Edit transaction</h3>
                  <button onClick={() => setEditingTransaction(null)} className="icon-btn" aria-label="Close edit modal">
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="label">Amount</label>
                    <input
                      type="number"
                      value={editingTransaction.amount}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input
                      type="text"
                      value={editingTransaction.description}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="label">Payment mode</label>
                    <CustomDropdown
                      options={paymentModesOptions.filter((mode) => mode.value !== "all")}
                      value={editingTransaction.paymentMode}
                      onChange={(value) => setEditingTransaction({ ...editingTransaction, paymentMode: value })}
                      icon={FiCreditCard}
                      placeholder="Select payment mode"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setEditingTransaction(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Update
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deletingTransaction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="panel w-full max-w-md p-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-700">
                  <FiAlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-stone-950">Delete transaction?</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">This entry will be removed from your ledger permanently.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => setDeletingTransaction(null)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(deletingTransaction.id)} className="inline-flex items-center justify-center rounded-2xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-red-800">
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
