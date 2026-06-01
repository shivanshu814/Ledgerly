import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiChevronDown,
  FiCoffee,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiFilm,
  FiGlobe,
  FiHeart,
  FiNavigation,
  FiPackage,
  FiShoppingCart,
  FiSmartphone,
  FiTag,
  FiTruck,
  FiUsers,
  FiZap,
} from "react-icons/fi";

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
type Option = { value: string; label: string; icon?: IconComponent };

const categories: Option[] = [
  { value: "FOOD", label: "Food & Dining", icon: FiCoffee },
  { value: "TRANSPORT", label: "Transportation", icon: FiTruck },
  { value: "SHOPPING", label: "Shopping", icon: FiShoppingCart },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: FiFilm },
  { value: "BILLS", label: "Bills & Utilities", icon: FiZap },
  { value: "HEALTH", label: "Health & Fitness", icon: FiHeart },
  { value: "TRAVEL", label: "Travel", icon: FiNavigation },
  { value: "OTHER", label: "Other", icon: FiPackage },
];

const paymentModes: Option[] = [
  { value: "CASH", label: "Cash", icon: FiDollarSign },
  { value: "CARD", label: "Card", icon: FiCreditCard },
  { value: "UPI", label: "UPI", icon: FiSmartphone },
  { value: "NET_BANKING", label: "Net Banking", icon: FiDatabase },
];

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="field flex items-center justify-between text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" style={{ color: "var(--teal-dark)" }} />
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 shrink-0" style={{ color: "var(--teal)" } as React.CSSProperties} />}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <FiChevronDown className={`h-5 w-5 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} style={{ color: "var(--ink-3)" }} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card-solid)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition"
              style={
                value === option.value
                  ? { backgroundColor: "var(--teal-light)", color: "var(--teal-text)" }
                  : { color: "var(--ink-2)" }
              }
            >
              {option.icon && <option.icon className="h-4 w-4 shrink-0" style={{ color: "var(--teal)" } as React.CSSProperties} />}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddExpense() {
  const { user } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    paymentMode: "UPI",
    isSplit: false,
    splitWith: "",
    category: "OTHER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount greater than ₹0");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Add a description so you remember this later");
      return;
    }

    const submit = fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, amount, date: new Date().toISOString() }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    });

    toast.promise(submit, {
      loading: "Saving expense…",
      success: () => {
        router.push("/dashboard");
        return `₹${amount.toLocaleString("en-IN")} logged successfully 🎉`;
      },
      error: (err) => err?.message || "Something went wrong. Try again.",
    });
  };

  return (
    <main className="app-shell">
      <div className="app-container max-w-5xl">
        <button onClick={() => router.back()} className="btn-secondary mb-6 px-4 py-2.5">
          <FiArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <section className="panel p-6 sm:p-7">
            <p className="eyebrow">New entry</p>
            <h1 className="page-title mt-3">Add an expense.</h1>
            <p className="mt-5 text-base font-medium leading-7" style={{ color: "var(--ink-3)" }}>
              Keep the ledger fresh while the detail is still in your head. Category and
              payment mode make reports cleaner later.
            </p>
            <div
              className="mt-8 rounded-2xl p-5"
              style={{ backgroundColor: "var(--bg-invert)", color: "var(--ink-invert)" }}
            >
              <p className="text-sm font-bold" style={{ opacity: 0.7 }}>Current amount</p>
              <p className="mt-2 text-4xl font-black">
                ₹{Number(formData.amount || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </section>

          <section className="panel p-5 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Amount</label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute text-lg font-black"
                    style={{ color: "var(--teal-dark)", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="field pl-11"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <div className="relative">
                  <FiFileText
                    className="pointer-events-none absolute h-5 w-5"
                    style={{ color: "var(--teal-dark)", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="field pl-12"
                    required
                    placeholder="What was this for?"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label">Category</label>
                  <CustomDropdown
                    options={categories}
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    icon={FiTag}
                    placeholder="Select category"
                  />
                </div>

                <div>
                  <label className="label">Payment mode</label>
                  <CustomDropdown
                    options={paymentModes}
                    value={formData.paymentMode}
                    onChange={(value) => setFormData({ ...formData, paymentMode: value })}
                    icon={FiCreditCard}
                    placeholder="Select payment mode"
                  />
                </div>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-pill)" }}
              >
                <label className="flex cursor-pointer items-center gap-3 text-sm font-extrabold" style={{ color: "var(--ink-2)" }}>
                  <span
                    className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{
                      border: formData.isSplit ? "none" : "2px solid var(--border-strong)",
                      backgroundColor: formData.isSplit ? "var(--teal)" : "var(--bg-input)",
                      transition: "all 150ms",
                    }}
                  >
                    {formData.isSplit && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <input
                      type="checkbox"
                      checked={formData.isSplit}
                      onChange={(e) => setFormData({ ...formData, isSplit: e.target.checked })}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </span>
                  Split this expense
                </label>

                {formData.isSplit && (
                  <div className="relative mt-4">
                    <FiUsers
                      className="pointer-events-none absolute h-5 w-5"
                      style={{ color: "var(--teal-dark)", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="text"
                      value={formData.splitWith}
                      onChange={(e) => setFormData({ ...formData, splitWith: e.target.value })}
                      className="field pl-12"
                      placeholder="Names, comma separated"
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary w-full py-4">
                Add expense
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
