"use client";

import { useEffect, useState } from "react";

// 🚨 UPDATED: Ensure this imports from your new employee/attendance store file!
import { getEmployeeDistributionData } from "@/store/customer"; // Your API function
import DonutChartCard from "./DonutChartCard";

export default function DistributionPanel() {
  const [distributionData, setDistributionData] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  // 🚨 UPDATED: Default to Department instead of Campaign
  const [filterBy, setFilterBy] = useState("Department"); 
  const [isLoading, setIsLoading] = useState(true);

  // 🚨 UPDATED: Map directly to the new Employee Prisma schema fields
  const filterOptions = [
    { label: "By Department", value: "Department" },
    { label: "By Designation", value: "Designation" },
    { label: "By System Role", value: "Role" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const res = await getEmployeeDistributionData(filterBy);
      if (res?.success) {
        setDistributionData(res.data);
        setTotalEmployees(res.total);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [filterBy]); // Re-fetch whenever the dropdown changes

  return (
    <div className="max-w-xl">
      <DonutChartCard
        title="Employee Distribution"
        totalLabel="Employees"
        totalCount={totalEmployees}
        data={distributionData}
        dropdownOptions={filterOptions}
        selectedValue={filterBy}
        onDropdownChange={(val) => setFilterBy(val)}
        isLoading={isLoading}
      />
    </div>
  );
}