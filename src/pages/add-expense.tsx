import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiDollarSign,
  FiFileText,
  FiCreditCard,
  FiUsers,
  FiTag,
  FiChevronDown,
} from "react-icons/fi";

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
        className='block w-full pl-12 pr-10 py-3.5 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 flex items-center justify-between'
      >
        <div className='flex items-center'>
          <Icon className='h-5 w-5 text-gray-400 absolute left-4' />
          <span className='ml-2'>
            {selectedOption?.icon} {selectedOption?.label || placeholder}
          </span>
        </div>
        <FiChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden'>
          <div className='max-h-60 overflow-auto'>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-200 
                  ${
                    value === option.value
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-900"
                  } 
                  hover:bg-blue-100`}
              >
                <span className='mr-2 text-lg'>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  const categories = [
    { value: "FOOD", label: "Food & Dining", icon: "🍽️" },
    { value: "TRANSPORT", label: "Transportation", icon: "🚗" },
    { value: "SHOPPING", label: "Shopping", icon: "🛍️" },
    { value: "ENTERTAINMENT", label: "Entertainment", icon: "🎮" },
    { value: "BILLS", label: "Bills & Utilities", icon: "💡" },
    { value: "HEALTH", label: "Health & Fitness", icon: "💪" },
    { value: "TRAVEL", label: "Travel", icon: "✈️" },
    { value: "OTHER", label: "Other", icon: "📦" },
  ];

  const paymentModes = [
    { value: "CASH", label: "Cash", icon: "💵" },
    { value: "CARD", label: "Card", icon: "💳" },
    { value: "UPI", label: "UPI", icon: "📱" },
    { value: "NET_BANKING", label: "Net Banking", icon: "🏦" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Expense added successfully!");
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
    <div className='min-h-screen bg-black text-white'>
      {/* Animated background */}
      <div className='fixed inset-0 -z-10'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]'></div>
        <div className='absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f6,transparent)] opacity-20'></div>
      </div>

      <div className='relative max-w-4xl mx-auto p-4 sm:p-6 lg:p-8'>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className='mb-6 flex items-center text-gray-400 hover:text-white transition-colors duration-200 group'
        >
          <FiArrowLeft className='mr-2 group-hover:-translate-x-1 transition-transform duration-200' />
          Back to Dashboard
        </button>

        <div className='bg-[#1a1a1a]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-6 sm:p-8'>
          <h2 className='text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
            Add New Expense
          </h2>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Amount */}
            <div className='relative group'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Amount (₹)
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <span className='text-gray-400 text-lg'>₹</span>
                </div>
                <input
                  type='number'
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className='block w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                  required
                  min='0'
                  step='0.01'
                  placeholder='0.00'
                />
              </div>
            </div>

            {/* Description */}
            <div className='relative group'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Description
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <FiFileText className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='text'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className='block w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                  required
                  placeholder='What was this expense for?'
                />
              </div>
            </div>

            {/* Two columns for Category and Payment Mode */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
              {/* Category */}
              <div className='relative group'>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Category
                </label>
                <CustomDropdown
                  options={categories}
                  value={formData.category}
                  onChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  icon={FiTag}
                  placeholder='Select category'
                />
              </div>

              {/* Payment Mode */}
              <div className='relative group'>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Payment Mode
                </label>
                <CustomDropdown
                  options={paymentModes}
                  value={formData.paymentMode}
                  onChange={(value) =>
                    setFormData({ ...formData, paymentMode: value })
                  }
                  icon={FiCreditCard}
                  placeholder='Select payment mode'
                />
              </div>
            </div>

            {/* Split Expense */}
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={formData.isSplit}
                  onChange={(e) =>
                    setFormData({ ...formData, isSplit: e.target.checked })
                  }
                  className='h-5 w-5 rounded border-white/10 bg-white text-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                />
                <label className='text-sm text-gray-300'>
                  Split this expense with others
                </label>
              </div>

              {formData.isSplit && (
                <div className='relative group'>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                      <FiUsers className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      type='text'
                      value={formData.splitWith}
                      onChange={(e) =>
                        setFormData({ ...formData, splitWith: e.target.value })
                      }
                      className='block w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                      placeholder='Enter Name (comma separated)'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              className='w-full py-4 px-6 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-500/20'
            >
              Add Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
