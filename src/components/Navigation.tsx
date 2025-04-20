import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { FiHome, FiPlus, FiList, FiLogOut, FiUser } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navigation() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 sm:hidden z-50">
      <div className="flex justify-around items-center h-16 px-4 bg-[#000000]">
        <button
          onClick={() => handleNavigation("/dashboard")}
          className={`flex flex-col items-center space-y-1 w-16 py-1 ${
            isActive("/dashboard")
              ? "text-[#7289da]"
              : "text-gray-400"
          }`}
        >
          <FiHome className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </button>

        <button
          onClick={() => handleNavigation("/add-expense")}
          className="flex flex-col items-center justify-center -mt-8 w-20 h-20 rounded-full bg-green-500 text-white transform transition-transform active:scale-95 border-4 border-green-600 shadow-lg shadow-green-500/50"
        >
          <FiPlus className="h-8 w-8" />
          <span className="text-xs mt-1">Add</span>
        </button>

        <button
          onClick={() => handleNavigation("/transactions")}
          className={`flex flex-col items-center space-y-1 w-16 py-1 ${
            isActive("/transactions")
              ? "text-[#7289da]"
              : "text-gray-400"
          }`}
        >
          <FiList className="h-6 w-6" />
          <span className="text-xs">History</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "bg-black border-b border-gray-800" 
          : "bg-black"
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className="text-xl font-bold text-[#7289da]"
                >
                  Expense Tracker
                </button>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className={`${
                    isActive("/dashboard")
                      ? "text-[#7289da] bg-[#7289da]/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300`}
                >
                  <FiHome className="mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation("/add-expense")}
                  className={`${
                    isActive("/add-expense")
                      ? "text-[#7289da] bg-[#7289da]/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300`}
                >
                  <FiPlus className="mr-2" />
                  Add Expense
                </button>
                <button
                  onClick={() => handleNavigation("/transactions")}
                  className={`${
                    isActive("/transactions")
                      ? "text-[#7289da] bg-[#7289da]/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300`}
                >
                  <FiList className="mr-2" />
                  Transactions
                </button>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-[#1f2937] px-4 py-2 rounded-lg">
                    <FiUser className="text-[#7289da]" />
                    <span className="text-gray-300">{user.emailAddresses[0].emailAddress}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-white hover:bg-[#1f2937] px-4 py-2 rounded-lg transition-all duration-300 flex items-center"
                  >
                    <FiLogOut className="mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Add padding to bottom of page content for mobile */}
      <div className="pb-16 sm:pb-0" />
    </>
  );
} 