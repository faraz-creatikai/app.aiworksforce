"use client";

import { useEffect, useState } from "react";

import { getAttendanceOverviewData } from "@/store/attendance/attendance";
import DonutChartCard from "./DonutChartCard";

// --- DATE UTILITIES ---
const getLocalDateString = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().split("T")[0];
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7; // Treat Sunday as 7
  d.setDate(d.getDate() - day + 1);
  return d;
};

export default function AttendanceOverview() {
  const [overviewData, setOverviewData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [timeFilter, setTimeFilter] = useState("this_month");
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown options matching the image design
  const filterOptions = [
    { label: "This Week", value: "this_week" },
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" }
  ];

  useEffect(() => {
    const fetchOverview = async () => {
      setIsLoading(true);
      
      const now = new Date();
      let startDateStr = "";
      let endDateStr = "";

      // Logic to calculate exact start and end dates based on dropdown
      if (timeFilter === "this_week") {
        const startOfWeek = getStartOfWeek(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        startDateStr = getLocalDateString(startOfWeek);
        endDateStr = getLocalDateString(endOfWeek);
      } 
      else if (timeFilter === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
        startDateStr = getLocalDateString(startOfMonth);
        endDateStr = getLocalDateString(endOfMonth);
      } 
      else if (timeFilter === "last_month") {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        startDateStr = getLocalDateString(startOfLastMonth);
        endDateStr = getLocalDateString(endOfLastMonth);
      }

      // Fetch from API
      const res = await getAttendanceOverviewData(startDateStr, endDateStr);
      if (res?.success) {
        setOverviewData(res.data);
        setTotalRecords(res.total);
      }
      
      setIsLoading(false);
    };

    fetchOverview();
  }, [timeFilter]);

  return (
    // Render the reusable card!
    <DonutChartCard
      title="Attendance Overview"
      totalLabel="Records"
      totalCount={totalRecords}
      data={overviewData}
      dropdownOptions={filterOptions}
      selectedValue={timeFilter}
      onDropdownChange={(val) => setTimeFilter(val)}
      isLoading={isLoading}
    />
  );
}