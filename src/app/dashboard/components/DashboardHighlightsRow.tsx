"use client";

import { useEffect, useState } from "react";
import { getEmployeeHighlightsData } from "@/store/customer";
import HighlightCard from "./HighlightCard";

export default function DashboardHighlightsRow() {
    const [data, setData] = useState({
        recentJoiners: [],
        upcomingBirthdays: [],
        workAnniversaries: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHighlights = async () => {
            setIsLoading(true);
            const res = await getEmployeeHighlightsData();
            if (res?.success) {
                setData(res.data);
            }
            setIsLoading(false);
        };
        fetchHighlights();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <HighlightCard
                title="Recent Joiners"
                type="joiners"
                data={data.recentJoiners}
                viewAllLink="/employee-manage/highlights?highlight=recent" // Updated URL
                isLoading={isLoading}
            />
            <HighlightCard
                title="Upcoming Birthdays"
                type="birthdays"
                data={data.upcomingBirthdays}
                viewAllLink="/employee-manage/highlights?highlight=birthday" // Updated URL
                isLoading={isLoading}
            />
            <HighlightCard
                title="Work Anniversaries"
                type="anniversaries"
                data={data.workAnniversaries}
                viewAllLink="/employee-manage/highlights?highlight=anniversary" // Updated URL
                isLoading={isLoading}
            />
        </div>
    );
}