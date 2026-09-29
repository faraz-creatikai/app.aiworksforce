"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDown } from "lucide-react";

// The exact color palette from your reference image
const CHART_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#fbbf24", // Yellow
  "#f43f5e", // Red/Pink
  "#d946ef", // Purple
  "#6366f1", // Indigo
  "#64748b", // Slate (Fallback for Others)
];

interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
}

interface DropdownOption {
  label: string;
  value: string;
}

interface DonutChartCardProps {
  title: string;
  data: ChartDataPoint[];
  totalLabel: string;
  totalCount: number;
  dropdownOptions?: DropdownOption[];
  selectedValue?: string;
  onDropdownChange?: (value: string) => void;
  isLoading?: boolean;
}

export default function DonutChartCard({
  title,
  data,
  totalLabel,
  totalCount,
  dropdownOptions,
  selectedValue,
  onDropdownChange,
  isLoading = false,
}: DonutChartCardProps) {
  
  // Assign colors consistently
  const displayData = data.map((item, index) => ({
    ...item,
    color: item.name === "Others" ? "#94a3b8" : CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col w-full h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        
        {dropdownOptions && dropdownOptions.length > 0 && (
          <div className="relative">
            <select
              value={selectedValue}
              onChange={(e) => onDropdownChange?.(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer hover:border-gray-300 transition-colors focus:ring-2 focus:ring-[var(--color-primary-light)]"
            >
              {dropdownOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 flex-1">
        
        {/* LEFT: DONUT CHART */}
        <div className="relative w-48 h-48 shrink-0">
          {isLoading ? (
            <div className="absolute inset-0 border-8 border-gray-100 border-t-gray-300 rounded-full animate-spin"></div>
          ) : data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 font-medium">No Data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                  />
                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {displayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER TEXT */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-gray-900 leading-none mb-1">
                  {totalCount}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {totalLabel}
                </span>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: CUSTOM LEGEND */}
        <div className="flex-1 w-full space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 w-full bg-gray-100 rounded animate-pulse"></div>
            ))
          ) : displayData.length === 0 ? (
            null
          ) : (
            displayData.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className="flex items-center gap-2 flex-1">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="font-semibold text-gray-700 truncate pr-2">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-gray-900 w-6 text-right">
                    {item.value}
                  </span>
                  <span className="text-gray-400 font-medium w-10 text-right">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}