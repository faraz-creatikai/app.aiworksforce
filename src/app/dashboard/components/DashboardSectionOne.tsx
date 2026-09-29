"use client";

import { useEffect, useRef, useState } from "react";
import { getDashboardStatsCount } from "@/store/customer";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  CheckCircle2,
  Home,
  AlertCircle,
  Calendar,
  XCircle,
  ListChecks,
  Banknote,
  TrendingUp,
  Contact,
  UserCheck,
  Briefcase
} from "lucide-react";

// --- TYPES ---
interface DashboardCard {
  name: string;
  value: number;
  prefix?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  extraDetail?: React.ReactNode;
}

export default function DashboardSectionOne() {
  const { admin } = useAuth();
  
  // Using local state to manage the dynamic array of cards
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [counts, setCounts] = useState<number[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const countersRef = useRef<HTMLDivElement | null>(null);
  const [countersInView, setCountersInView] = useState<boolean>(false);

  // Observe section visibility for the counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setCountersInView(entry.isIntersecting),
      { threshold: 0.2 }
    );

    if (countersRef.current) observer.observe(countersRef.current);
    return () => {
      if (countersRef.current) observer.unobserve(countersRef.current);
    };
  }, []);

  // Fetch the data on mount
  useEffect(() => {
    DashboardSectionOneDataFetch();
  }, []);

  const DashboardSectionOneDataFetch = async () => {
    try {
      const response = await getDashboardStatsCount();
      const data = response?.data || {};

      // Safe parser for totalEmployees just in case the backend returns an array from findMany() instead of count()
      const employeeCount = typeof data.totalEmployees === 'number' 
        ? data.totalEmployees 
        : (data.totalEmployees?.length || 0);

      // Build the comprehensive 10-card Business & HR grid
      const newCards: DashboardCard[] = [
        // --- CRM & BUSINESS STATS (Top Row) ---
        {
          name: "Total Customers",
          value: data.totalCustomers || 0,
          icon: <Users size={22} />,
          iconBgColor: "bg-blue-100",
          iconColor: "text-blue-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Unique By Contact</div>
        },
        {
          name: "Converted Leads",
          value: data.convertedLeads || 0,
          icon: <UserCheck size={22} />,
          iconBgColor: "bg-emerald-100",
          iconColor: "text-emerald-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">From followups</div>
        },
        {
          name: "Total Tasks",
          value: data.totalTasks || 0,
          icon: <ListChecks size={22} />,
          iconBgColor: "bg-indigo-100",
          iconColor: "text-indigo-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Active & Assigned</div>
        },
        {
          name: "Total Revenue",
          value: data.totalIncome || 0,
          prefix: "₹",
          icon: <Banknote size={22} />,
          iconBgColor: "bg-green-100",
          iconColor: "text-green-700",
          extraDetail: (
            <div className="text-xs text-green-600 flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1 font-bold">
                <TrendingUp size={12} /> Generated
              </div>
            </div>
          )
        },
        {
          name: "Total Employees",
          value: employeeCount,
          icon: <Briefcase size={22} />,
          iconBgColor: "bg-orange-100",
          iconColor: "text-orange-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Active Staff Directory</div>
        },
        // --- DAILY ATTENDANCE STATS (Bottom Row) ---
        {
          name: "Present Today",
          value: data.todayPresent || 0,
          icon: <CheckCircle2 size={22} />,
          iconBgColor: "bg-emerald-100",
          iconColor: "text-emerald-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">In office</div>
        },
        {
          name: "Work From Home",
          value: data.todayWFH || 0,
          icon: <Home size={22} />,
          iconBgColor: "bg-teal-100",
          iconColor: "text-teal-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Remote working</div>
        },
        {
          name: "Partial / Late",
          value: data.todayHalfDay || 0,
          icon: <AlertCircle size={22} />,
          iconBgColor: "bg-yellow-100",
          iconColor: "text-yellow-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Half-day shifts</div>
        },
        {
          name: "On Leave",
          value: data.todayLeave || 0,
          icon: <Calendar size={22} />,
          iconBgColor: "bg-purple-100",
          iconColor: "text-purple-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Approved time off</div>
        },
        {
          name: "Absent",
          value: data.todayAbsent || 0,
          icon: <XCircle size={22} />,
          iconBgColor: "bg-red-100",
          iconColor: "text-red-700",
          extraDetail: <div className="text-xs text-gray-500 font-medium">Unplanned absence</div>
        }
      ];

      setCards(newCards);
      setCounts(new Array(newCards.length).fill(0));
      setDataLoading(true);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
  };

  // Start counter animation when in view and data is loaded
  useEffect(() => {
    if (!countersInView || !dataLoading || cards.length === 0) return;

    const intervals: number[] = [];

    cards.forEach((item, index) => {
      const increment = item.value < 10 ? 1 : Math.ceil(item.value / 30); // Faster counting for larger numbers
      const intervalTime = item.value < 10 ? 150 : 40;

      const intervalId = window.setInterval(() => {
        setCounts((prev) => {
          const newCounts = [...prev];
          if (newCounts[index] < item.value) {
            newCounts[index] = Math.min(newCounts[index] + increment, item.value);
          }
          return newCounts;
        });
      }, intervalTime);

      intervals.push(intervalId);
    });

    return () => intervals.forEach((id) => clearInterval(id));
  }, [countersInView, dataLoading, cards]);

  return (
    <div ref={countersRef} className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[var(--color-primary-darker)]">
          Good Morning, {admin?.name}! 👋
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Here is the overview of your CRM, HR, and Operations today.
        </p>
      </div>

      {/* Grid structure beautifully fits 10 cards in 2 rows on large monitors */}
      <section className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 w-full">
        {cards.length > 0 ? (
          cards.map((item, index) => (
            <div
              key={index}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow group"
            >
              {/* Top part: Icon and Name */}
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.iconBgColor} ${item.iconColor}`}
                >
                  {item.icon}
                </div>
                <p className="text-sm font-bold text-gray-600">{item.name}</p>
              </div>

              {/* Bottom part: Value and Extra Details */}
              <div className="flex items-end justify-between gap-3 mt-1">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  {item.prefix || ""}
                  {counts[index] !== undefined ? counts[index].toLocaleString() : 0}
                </h2>
                
                <div className="text-right">
                  {item.extraDetail}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Skeleton loading state increased to 10
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between items-end mt-1">
                <div className="w-16 h-8 bg-gray-200 rounded" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}