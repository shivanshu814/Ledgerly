import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import React from "react";
import { GetServerSideProps } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Transaction } from "@prisma/client";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiGlobe,
  FiSearch,
  FiSmartphone,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
type Option = { value: string; label: string; icon?: IconComponent };

const LIMIT = 15;

const monthsOptions: Option[] = [
  { value: "0", label: "Jan" }, { value: "1", label: "Feb" }, { value: "2", label: "Mar" },
  { value: "3", label: "Apr" }, { value: "4", label: "May" }, { value: "5", label: "Jun" },
  { value: "6", label: "Jul" }, { value: "7", label: "Aug" }, { value: "8", label: "Sep" },
  { value: "9", label: "Oct" }, { value: "10", label: "Nov" }, { value: "11", label: "Dec" },
];

const paymentModesOptions: Option[] = [
  { value: "all", label: "All modes", icon: FiGlobe },
  { value: "CASH", label: "Cash", icon: FiDollarSign },
  { value: "CARD", label: "Card", icon: FiCreditCard },
  { value: "UPI", label: "UPI", icon: FiSmartphone },
  { value: "NET_BANKING", label: "Net Banking", icon: FiDatabase },
];

const sortOptions: Option[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Highest amount" },
  { value: "amount_asc", label: "Lowest amount" },
];

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function getStartOfMonth(month: number, year: number) {
  return new Date(year, month, 1).toISOString();
}
function getEndOfMonth(month: number, year: number) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
}

function paymentLabel(value: string) {
  return paymentModesOptions.find((m) => m.value === value)?.label || value;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CustomDropdown = React.memo(function CustomDropdown({ options, value, onChange, icon: Icon, placeholder }: {
  options: Option[]; value: string; onChange: (v: string) => void; icon: any; placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="field flex items-center justify-between gap-3 px-3 py-2.5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--teal-dark)" }} />
          <span className="flex items-center gap-2 truncate text-sm font-bold" style={{ color: "var(--ink)" }}>
            {selected?.icon && <selected.icon className="h-4 w-4 shrink-0" style={{ color: "var(--teal)" } as any} />}
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <FiChevronDown className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} style={{ color: "var(--ink-3)" }} />
      </button>
      {isOpen && (
        <div
          className="absolute z-50 mt-2 min-w-full rounded-2xl"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card-solid)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "14rem", overflowY: "auto" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold transition"
              style={value === opt.value ? { backgroundColor: "var(--teal-light)", color: "var(--teal-text)" } : { color: "var(--ink-2)" }}
            >
              {opt.icon && <opt.icon className="h-4 w-4 shrink-0" style={{ color: "var(--teal)" } as any} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

interface ApiResponse {
  transactions: Transaction[];
  total: number;
  totalAmount: number;
  page: number;
  totalPages: number;
}

interface Props { initialData: ApiResponse; initialMonth: number; initialYear: number; }

export default function Transactions({ initialData, initialMonth, initialYear }: Props) {
  const { user } = useUser();
  const router = useRouter();

  const now = new Date();
  const [startMonth, setStartMonth] = useState(initialMonth);
  const [startYear, setStartYear] = useState(initialYear);
  const [endMonth, setEndMonth] = useState(initialMonth);
  const [endYear, setEndYear] = useState(initialYear);
  const [paymentMode, setPaymentMode] = useState("all");
  const [sortKey, setSortKey] = useState("date_desc");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ApiResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const yearsOptions = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const y = now.getFullYear() - i;
    return { value: y.toString(), label: y.toString() };
  }), []);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sortBy, sortOrder] = sortKey.split("_");
      const params = new URLSearchParams({
        startDate: getStartOfMonth(startMonth, startYear),
        endDate: getEndOfMonth(endMonth, endYear),
        paymentMode,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: LIMIT.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user, startMonth, startYear, endMonth, endYear, paymentMode, sortKey, search, page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [startMonth, startYear, endMonth, endYear, paymentMode, sortKey, search]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => { e.preventDefault(); }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const req = fetch(`/api/transactions/${editingTransaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingTransaction),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Could not save changes");
      return res.json();
    });

    toast.promise(req, {
      loading: "Saving changes…",
      success: () => {
        setEditingTransaction(null);
        fetchTransactions();
        return "Transaction updated";
      },
      error: (err) => err?.message || "Failed to update. Try again.",
    });
  };

  const handleDelete = async (id: string) => {
    const req = fetch(`/api/transactions/${id}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error("Could not delete");
      return res.json();
    });

    toast.promise(req, {
      loading: "Deleting…",
      success: () => {
        setDeletingTransaction(null);
        fetchTransactions();
        return "Transaction removed from your ledger";
      },
      error: (err) => err?.message || "Failed to delete. Try again.",
    });
  };

  const handleDownloadPDF = async () => {
    if (data.total === 0) {
      toast.error("No transactions to export for this range");
      return;
    }

    const generate = (async () => {
    // Fetch all (no pagination) for the current filters to export
    const [sortBy, sortOrder] = sortKey.split("_");
    const params = new URLSearchParams({
      startDate: getStartOfMonth(startMonth, startYear),
      endDate: getEndOfMonth(endMonth, endYear),
      paymentMode,
      sortBy,
      sortOrder,
      page: "1",
      limit: "1000",
    });
    if (search) params.set("search", search);

    const res = await fetch(`/api/transactions?${params}`);
    const json: ApiResponse = await res.json();

    const doc = new jsPDF();
    doc.setFillColor(23, 33, 29);
    doc.rect(0, 0, 210, 30, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor("#fffbf2");
    doc.text("Ledgerly Expense Report", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor("#222222");
    doc.text(`Range: ${monthsOptions[startMonth].label} ${startYear} – ${monthsOptions[endMonth].label} ${endYear}`, 14, 42);
    doc.text(`Payment mode: ${paymentMode === "all" ? "All" : paymentLabel(paymentMode)}`, 14, 50);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: INR ${json.totalAmount.toLocaleString("en-IN")}`, 14, 58);

    autoTable(doc, {
      startY: 68,
      head: [["Date", "Description", "Category", "Amount", "Payment"]],
      body: json.transactions.map((t) => [
        new Date(t.date).toLocaleDateString("en-IN"),
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

    doc.save(`Ledgerly_${monthsOptions[startMonth].label}${startYear}_${monthsOptions[endMonth].label}${endYear}.pdf`);
    return json.transactions.length;
    })();

    toast.promise(generate, {
      loading: "Preparing your report…",
      success: (count) => `Report saved — ${count} transactions exported`,
      error: "Failed to generate report",
    });
  };

  const { transactions, total, totalAmount, totalPages } = data;

  return (
    <main className="app-shell">
      <div className="app-container">
        {/* Header */}
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button onClick={() => router.back()} className="btn-secondary mb-6 px-4 py-2.5">
              <FiArrowLeft className="h-5 w-5" />
              Back
            </button>
            <p className="eyebrow">History</p>
            <h1 className="page-title mt-3">Transactions</h1>
          </div>
          <button onClick={handleDownloadPDF} className="btn-primary">
            <FiDownload className="h-5 w-5" />
            Download report
          </button>
        </section>

        {/* Filters */}
        <section className="panel mt-7 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
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
              <CustomDropdown options={paymentModesOptions} value={paymentMode} onChange={setPaymentMode} icon={FiCreditCard} placeholder="Mode" />
            </div>
            <div>
              <label className="label">Sort by</label>
              <CustomDropdown options={sortOptions} value={sortKey} onChange={setSortKey} icon={FiChevronDown} placeholder="Sort" />
            </div>
            <div
              className="rounded-2xl px-5 py-4"
              style={{ backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)" }}
            >
              <p className="text-xs font-bold uppercase" style={{ opacity: 0.6, letterSpacing: "0.16em" }}>Total</p>
              <p className="mt-1 text-2xl font-black">{currency.format(totalAmount)}</p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <FiSearch
                className="pointer-events-none absolute h-4 w-4"
                style={{ color: "var(--ink-3)", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search description…"
                className="field pl-9 py-2.5 text-sm"
              />
            </div>
            <button type="submit" className="btn-primary px-4 py-2.5 text-sm">
              Search
            </button>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                <FiX className="h-4 w-4" />
                Clear
              </button>
            )}
          </form>
        </section>

        {/* Table */}
        <section className="panel mt-6 overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-pill)" }} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-black" style={{ color: "var(--ink)" }}>No transactions found</p>
              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--ink-3)" }}>
                {search ? "Try a different search term." : "Try widening the date range or filter."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "var(--bg-pill)" }}>
                    <tr>
                      {["Date", "Description", "Category", "Amount", "Payment", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-black uppercase" style={{ color: "var(--ink-3)", letterSpacing: "0.16em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        style={{ borderTop: "1px solid var(--line)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-pill)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold" style={{ color: "var(--ink-3)" }}>
                          {new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-sm font-black" style={{ color: "var(--ink)" }}>{t.description}</td>
                        <td className="px-5 py-4">
                          <span className="chip">{t.category}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-black" style={{ color: "var(--rose)" }}>
                          {currency.format(t.amount)}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold" style={{ color: "var(--ink-3)" }}>{paymentLabel(t.paymentMode)}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => setEditingTransaction(t)} className="icon-btn" aria-label="Edit">
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeletingTransaction(t)} className="icon-btn" style={{ color: "var(--rose)" }} aria-label="Delete">
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden">
                {transactions.map((t) => (
                  <div key={t.id} className="p-4" style={{ borderTop: "1px solid var(--line)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black" style={{ color: "var(--ink)" }}>{t.description}</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--ink-3)" }}>
                          {new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <p className="font-black" style={{ color: "var(--rose)" }}>{currency.format(t.amount)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="chip">{t.category}</span>
                        <span className="chip">{paymentLabel(t.paymentMode)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTransaction(t)} className="icon-btn" aria-label="Edit">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingTransaction(t)} className="icon-btn" style={{ color: "var(--rose)" }} aria-label="Delete">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--ink-3)" }}>
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="icon-btn"
                  aria-label="Previous page"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className="h-9 min-w-9 rounded-xl text-sm font-black transition px-2"
                        style={
                          page === pageNum
                            ? { backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)" }
                            : { color: "var(--ink-3)" }
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="icon-btn"
                  aria-label="Next page"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Edit modal */}
        {editingTransaction && (
          <div
            className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <div className="animate-fade-up panel w-full max-w-md p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black" style={{ color: "var(--ink)" }}>Edit transaction</h3>
                <button onClick={() => setEditingTransaction(null)} className="icon-btn"><FiX className="h-5 w-5" /></button>
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
                    options={paymentModesOptions.filter((m) => m.value !== "all")}
                    value={editingTransaction.paymentMode}
                    onChange={(v) => setEditingTransaction({ ...editingTransaction, paymentMode: v })}
                    icon={FiCreditCard}
                    placeholder="Payment mode"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingTransaction(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete modal */}
        {deletingTransaction && (
          <div
            className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <div className="animate-fade-up panel w-full max-w-md p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
                <FiAlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-black" style={{ color: "var(--ink)" }}>Delete transaction?</h3>
              <p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--ink-3)" }}>
                This entry will be removed from your ledger permanently.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => setDeletingTransaction(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => handleDelete(deletingTransaction.id)}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);
  if (!userId) return { redirect: { destination: "/", permanent: false } };

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return { props: { initialData: { transactions: [], total: 0, totalAmount: 0, page: 1, totalPages: 1 }, initialMonth: month, initialYear: year } };
    }

    const where = { userId: user.id, date: { gte: startDate, lte: endDate } };
    const [total, transactions, aggregate] = await prisma.$transaction([
      prisma.transaction.count({ where } as any),
      prisma.transaction.findMany({ where, orderBy: { date: "desc" }, skip: 0, take: LIMIT } as any),
      prisma.transaction.aggregate({ where, _sum: { amount: true } } as any),
    ]);

    return {
      props: {
        initialData: {
          transactions: JSON.parse(JSON.stringify(transactions)),
          total,
          totalAmount: (aggregate as any)._sum?.amount ?? 0,
          page: 1,
          totalPages: Math.ceil((total as number) / LIMIT),
        },
        initialMonth: month,
        initialYear: year,
      },
    };
  } catch (err) {
    console.error("Transactions SSR error:", err);
    return { props: { initialData: { transactions: [], total: 0, totalAmount: 0, page: 1, totalPages: 1 }, initialMonth: month, initialYear: year } };
  }
};
