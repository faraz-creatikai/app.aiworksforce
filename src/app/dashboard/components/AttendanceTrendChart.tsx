"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";
import { getAttendanceTrendData } from "@/store/attendance/attendance";

// Utilities to get local timezone dates safely
const getLocalDateString = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().split("T")[0];
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7; // Treat Sunday as 7 to make Monday the start
  d.setDate(d.getDate() - day + 1);
  return d;
};

interface TrendDataPoint {
  name: string;
  date: string;
  Present: number;
  Absent: number;
}

export default function AttendanceTrendChart() {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [timeFilter, setTimeFilter] = useState("this_week");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrend = async () => {
      setIsLoading(true);
      
      const now = new Date();
      let startDateStr = "";
      let endDateStr = "";

      if (timeFilter === "this_week") {
        const startOfWeek = getStartOfWeek(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        startDateStr = getLocalDateString(startOfWeek);
        endDateStr = getLocalDateString(endOfWeek);
      } else if (timeFilter === "last_week") {
        const startOfLastWeek = getStartOfWeek(now);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        
        startDateStr = getLocalDateString(startOfLastWeek);
        endDateStr = getLocalDateString(endOfLastWeek);
      }

      const res = await getAttendanceTrendData(startDateStr, endDateStr);
      if (res?.success) {
        setData(res.data);
      }
      setIsLoading(false);
    };

    fetchTrend();
  }, [timeFilter]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col w-full h-full min-h-[350px]">
      
      {/* HEADER & DROPDOWN */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Attendance Trend</h2>
        
        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer hover:border-gray-300 transition-colors focus:ring-2 focus:ring-[var(--color-primary-light)]"
          >
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* CUSTOM LEGEND */}
      <div className="flex items-center justify-end gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="text-sm font-semibold text-gray-700">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-sm font-semibold text-gray-700">Absent</span>
        </div>
      </div>

      {/* CHART AREA */}
      <div className="flex-1 w-full min-h-[250px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              
              {/* GRADIENT DEFINITIONS */}
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>

              {/* GRID */}
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f3f4f6" />
              
              {/* AXES */}
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} 
                dx={-10} 
              />
              
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
              />

              {/* RED LINE (ABSENT) */}
              <Area 
                type="monotone" 
                dataKey="Absent" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAbsent)" 
                activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                dot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 1.5 }}
              />

              {/* BLUE LINE (PRESENT) */}
              <Area 
                type="monotone" 
                dataKey="Present" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPresent)" 
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 1.5 }}
              />
              
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}