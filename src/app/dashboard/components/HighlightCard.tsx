"use client";

import Link from "next/link";
import { Cake, CalendarDays, Trophy } from "lucide-react";

type HighlightType = "joiners" | "birthdays" | "anniversaries";

interface HighlightItem {
  id: string;
  name: string;
  image: any;
  date: string;
  role?: string;
  department?: string;
  years?: number;
  isToday?: boolean;
  isTomorrow?: boolean;
}

interface HighlightCardProps {
  title: string;
  type: HighlightType;
  data: HighlightItem[];
  viewAllLink: string;
  isLoading?: boolean;
  limit?: number;
}

// Failsafe Date Formatter
const safeFormatDate = (d?: string | null, short: boolean = false) => {
  if (!d) return "N/A";
  try {
    const dateObj = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
    if (isNaN(dateObj.getTime())) return "N/A";
    
    if (short) return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch (error) {
    return "N/A";
  }
};

const parseImage = (imgData: any) => {
  if (!imgData) return null;
  try {
    const parsed = typeof imgData === "string" ? JSON.parse(imgData) : imgData;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
  } catch (e) {
    return null;
  }
};

export default function HighlightCard({ title, type, data, viewAllLink, isLoading, limit = 4 }: HighlightCardProps) {
  
  // Guarantee data is an array to prevent crashes
  const safeData = Array.isArray(data) ? data : [];
  const displayData = safeData.slice(0, limit);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">{title}</h2>
        <Link href={viewAllLink} className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-darker)] transition-colors">
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {isLoading ? (
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
              <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/2"></div><div className="h-2 bg-gray-200 rounded w-1/3"></div></div>
            </div>
          ))
        ) : displayData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-400">
            {type === "joiners" ? "No recent joiners found." : "No upcoming events in the next 30 days."}
          </div>
        ) : (
          displayData.map((item) => {
            const avatar = parseImage(item.image);
            const safeName = item.name || "Unknown";

            return (
              <div key={item.id} className="flex items-center justify-between gap-3 group">
                
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* AVATAR */}
                  {avatar ? (
                    <img src={avatar} alt={safeName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-lighter)] flex items-center justify-center text-[var(--color-primary-darker)] font-bold text-sm shrink-0 shadow-sm">
                      {safeName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* ICONS */}
                  {type === "birthdays" && (
                    <div className={`p-1.5 rounded-lg shrink-0 ${item.isToday || item.isTomorrow ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-400'}`}>
                      {item.isToday || item.isTomorrow ? <Cake size={20} /> : <CalendarDays size={20} />}
                    </div>
                  )}
                  {type === "anniversaries" && (
                    <div className={`p-1.5 rounded-lg shrink-0 ${item.isToday || item.isTomorrow ? 'bg-yellow-100 text-yellow-600' : 'bg-red-50 text-red-400'}`}>
                      {item.isToday || item.isTomorrow ? <Trophy size={16} /> : <CalendarDays size={16} />}
                    </div>
                  )}

                  <div className="truncate">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[var(--color-primary)] transition-colors">{safeName}</p>
                    {type === "joiners" && (
                      <p className="text-xs font-medium text-gray-500 truncate">{item.role}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {type === "joiners" && (
                    <>
                      <p className="text-xs font-semibold text-gray-600">{safeFormatDate(item.date)}</p>
                      <p className="text-[11px] font-medium text-gray-400">{item.department}</p>
                    </>
                  )}
                  
                  {type === "birthdays" && (
                    <>
                      <p className="text-xs font-bold text-gray-900">{safeName.split(" ")[0]}</p>
                      <p className={`text-[11px] font-semibold ${item.isToday ? 'text-orange-600' : 'text-gray-500'}`}>
                        {safeFormatDate(item.date, true)} {item.isTomorrow ? "(Tomorrow)" : item.isToday ? "(Today)" : ""}
                      </p>
                    </>
                  )}

                  {type === "anniversaries" && (
                    <>
                      <p className="text-xs font-bold text-gray-900">{item.years} {item.years === 1 ? "year" : "years"}</p>
                      <p className={`text-[11px] font-semibold ${item.isToday ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {safeFormatDate(item.date, true)} {item.isTomorrow ? "(Tomorrow)" : item.isToday ? "(Today)" : ""}
                      </p>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}