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

type IconComponent = React.ComponentType<{ className?: string }>;
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
          <Icon className="h-5 w-5 shrink-0 text-teal-800" />
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 shrink-0 text-teal-700" />}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <FiChevronDown className={`h-5 w-5 shrink-0 text-stone-500 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-stone-300/80 bg-[#fffbf2] shadow-2xl shadow-stone-900/12">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition ${
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

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Expense added");
        router.push("/dashboard");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add expense");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
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
            <h1 className="page-title mt-3 text-stone-950">Add an expense.</h1>
            <p className="mt-5 text-base font-medium leading-7 text-stone-600">
              Keep the ledger fresh while the detail is still in your head. Category and
              payment mode make reports cleaner later.
            </p>
            <div className="mt-8 rounded-2xl bg-[#17211d] p-5 text-[#fffbf2]">
              <p className="text-sm font-bold text-stone-300">Current amount</p>
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
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-black text-teal-800">
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
                  <FiFileText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-800" />
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

              <div className="rounded-2xl border border-stone-300/80 bg-white/45 p-4">
                <label className="flex items-center gap-3 text-sm font-extrabold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.isSplit}
                    onChange={(e) => setFormData({ ...formData, isSplit: e.target.checked })}
                    className="h-5 w-5 rounded border-stone-300 text-teal-700 focus:ring-teal-700"
                  />
                  Split this expense
                </label>

                {formData.isSplit && (
                  <div className="relative mt-4">
                    <FiUsers className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-800" />
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
