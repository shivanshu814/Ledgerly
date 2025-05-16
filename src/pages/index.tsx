import { useUser, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { Inter } from "next/font/google";
import { FiClock, FiPlus, FiList } from "react-icons/fi";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  const features = [
    {
      icon: <FiClock className='w-7 h-7' />,
      title: "Track Expenses",
      description: "Monitor your spending with detailed analytics and charts",
      color: "text-[#e879f9]",
      bgColor: "bg-[#e879f9]",
      glowColor: "shadow-[#e879f9]",
    },
    {
      icon: <FiPlus className='w-7 h-7' />,
      title: "Add Expenses",
      description: "Quickly add new expenses with multiple payment modes",
      color: "text-[#818cf8]",
      bgColor: "bg-[#818cf8]",
      glowColor: "shadow-[#818cf8]",
    },
    {
      icon: <FiList className='w-7 h-7' />,
      title: "View History & Download",
      description: "Access your complete transaction history anytime",
      color: "text-[#4ade80]",
      bgColor: "bg-[#4ade80]",
      glowColor: "shadow-[#4ade80]",
    },
  ];

  return (
    <div className={`${inter.className} min-h-screen bg-black text-white`}>
      {/* Animated background */}
      <div className='fixed inset-0 -z-10'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]'></div>
        <div className='absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#8b5cf6,transparent)] opacity-20'></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center' style={{ paddingTop: "100px" }}>
          <h1 className='text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight'>
            <span className='relative inline-block'>
              <span className='absolute -inset-2 blur-3xl bg-[#8b5cf6] opacity-20 animate-pulse'></span>
              <span className='relative text-[#8b5cf6] mt-10 animate-text-glow'>
                Track Your Expense
              </span>
            </span>
          </h1>
          <p className='mt-12 text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto'>
            A simple and powerful expense tracker to help you manage your
            finances better.
          </p>
          <div className='mt-16 max-w-md mx-auto'>
            {user ? (
              <button
                onClick={() => router.push("/dashboard")}
                className='w-full group relative flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-[#8b5cf6] text-white overflow-hidden shadow-lg shadow-[#8b5cf6]/30 hover:shadow-[#8b5cf6]/50 transition-all duration-300 hover:scale-[1.02]'
              >
                <span className='absolute inset-0 bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#8b5cf6] animate-gradient-x'></span>
                <span className='relative'>Go to Dashboard</span>
              </button>
            ) : (
              <SignUpButton mode='modal'>
                <button className='w-full group relative flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-[#8b5cf6] text-white overflow-hidden shadow-lg shadow-[#8b5cf6]/30 hover:shadow-[#8b5cf6]/50 transition-all duration-300 hover:scale-[1.02]'>
                  <span className='absolute inset-0 bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#8b5cf6] animate-gradient-x'></span>
                  <span className='relative'>Get Started</span>
                </button>
              </SignUpButton>
            )}
          </div>
        </div>

        <div className='mt-10'>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature, index) => (
              <div key={index} className='group relative'>
                <div className='relative overflow-hidden bg-black backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-8 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:scale-[1.02]'>
                  <div
                    className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  ></div>
                  <div className='relative'>
                    <span
                      className={`inline-flex items-center justify-center p-4 rounded-xl ${feature.color} shadow-lg ${feature.glowColor}/20`}
                    >
                      {feature.icon}
                    </span>
                    <h3
                      className={`mt-8 text-xl font-medium tracking-tight ${feature.color}`}
                    >
                      {feature.title}
                    </h3>
                    <p className='mt-4 text-base text-gray-400'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes text-glow {
          0%,
          100% {
            text-shadow: 0 0 30px #8b5cf6;
          }
          50% {
            text-shadow: 0 0 60px #8b5cf6;
          }
        }
        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}
