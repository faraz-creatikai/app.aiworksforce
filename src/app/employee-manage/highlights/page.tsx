"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getEmployeeHighlightsData } from "@/store/customer"; // Update the path if your api call is elsewhere
import { ChevronLeft, Cake, CalendarDays, Trophy, Users } from "lucide-react";
import EmployeeViewDialog from "@/app/component/popups/EmployeeViewDialog";


// --- UTILITIES ---
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

// --- CORE COMPONENT ---
function HighlightsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read the query parameter: ?highlight=recent | birthday | anniversary
    const highlightType = searchParams.get("highlight") || "recent";

    const [listData, setListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isViewOpen, setIsViewOpen] = useState(false);
    const [employeeToView, setEmployeeToView] = useState<any>(null);

    const handleViewClick = (id: string | number) => {
        setEmployeeToView(id);
        setIsViewOpen(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const res = await getEmployeeHighlightsData();

            if (res?.success) {
                // Select the correct array based on the query parameter
                if (highlightType === "birthday") {
                    setListData(res.data.upcomingBirthdays);
                } else if (highlightType === "anniversary") {
                    setListData(res.data.workAnniversaries);
                } else {
                    setListData(res.data.recentJoiners); // Default to recent
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [highlightType]);

    // Dynamic Content Mappings
    const pageDetails = {
        recent: { title: "Recent Joiners", subtitle: "Welcome our newest team members.", icon: <Users size={24} className="text-blue-500" />, bg: "bg-blue-50" },
        birthday: { title: "Upcoming Birthdays", subtitle: "Celebrate upcoming birthdays in the next 30 days.", icon: <Cake size={24} className="text-orange-500" />, bg: "bg-orange-50" },
        anniversary: { title: "Work Anniversaries", subtitle: "Honor milestones and work anniversaries this month.", icon: <Trophy size={24} className="text-yellow-600" />, bg: "bg-yellow-50" }
    };

    const currentDetail = pageDetails[highlightType as keyof typeof pageDetails] || pageDetails.recent;

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300 font-sans">
            <EmployeeViewDialog
                isOpen={isViewOpen}
                employeeId={employeeToView}
                onClose={() => {
                    setIsViewOpen(false);
                    setEmployeeToView(null);
                }}
            />

            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-gray-50 rounded-xl shadow-sm hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer text-gray-600"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${currentDetail.bg}`}>
                        {currentDetail.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{currentDetail.title}</h1>
                        <p className="text-sm font-medium text-gray-500">{currentDetail.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* LIST GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {isLoading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 animate-pulse">
                            <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0"></div>
                            <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div>
                        </div>
                    ))
                ) : listData.length === 0 ? (
                    <div className="col-span-full p-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl shadow-sm border border-gray-100">
                        <CalendarDays size={48} className="text-gray-300 mb-4" />
                        <p className="text-lg font-bold text-gray-700">No records found</p>
                        <p className="text-sm text-gray-500 mt-1">There is no data to display for this category.</p>
                    </div>
                ) : (
                    listData.map((item) => {
                        const avatar = parseImage(item.image);
                        const safeName = item.name || "Unknown";

                        return (
                            <div key={item.id} className="bg-white p-5 cursor-pointer rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 hover:shadow-md hover:border-[var(--color-primary-light)] transition-all group" onClick={() => {
                                handleViewClick(item.id)
                            }}>

                                <div className="flex items-center gap-4 overflow-hidden">

                                    {/* AVATAR */}
                                    {avatar ? (
                                        <img src={avatar} alt={safeName} className="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-[var(--color-primary-lighter)] flex items-center justify-center text-[var(--color-primary-darker)] font-bold text-xl shrink-0 shadow-sm">
                                            {safeName.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="truncate space-y-0.5">
                                        <p className="text-base font-bold text-gray-900 truncate group-hover:text-[var(--color-primary)] transition-colors">{safeName}</p>

                                        {/* DYNAMIC SUBTITLE BASED ON TYPE */}
                                        {highlightType === "recent" && (
                                            <p className="text-xs font-semibold text-gray-500 truncate">{item.role} • <span className="text-gray-400">{item.department}</span></p>
                                        )}

                                        {highlightType === "birthday" && (
                                            <p className={`text-xs font-bold ${item.isToday ? 'text-orange-600' : 'text-gray-500'}`}>
                                                {safeFormatDate(item.date, true)} {item.isTomorrow ? "(Tomorrow)" : item.isToday ? "(Today)" : ""}
                                            </p>
                                        )}

                                        {highlightType === "anniversary" && (
                                            <p className={`text-xs font-bold ${item.isToday ? 'text-yellow-600' : 'text-gray-500'}`}>
                                                {item.years} {item.years === 1 ? "year" : "years"} • {safeFormatDate(item.date, true)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT SIDE ICONS / DATES */}
                                <div className="shrink-0 pl-2">
                                    {highlightType === "recent" && (
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Joined</p>
                                            <p className="text-xs font-semibold text-gray-800">{safeFormatDate(item.date)}</p>
                                        </div>
                                    )}
                                    {highlightType === "birthday" && (
                                        <div className={`p-2.5 rounded-xl ${item.isToday || item.isTomorrow ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-400'}`}>
                                            {item.isToday || item.isTomorrow ? <Cake size={20} /> : <CalendarDays size={20} />}
                                        </div>
                                    )}
                                    {highlightType === "anniversary" && (
                                        <div className={`p-2.5 rounded-xl ${item.isToday || item.isTomorrow ? 'bg-yellow-100 text-yellow-600' : 'bg-red-50 text-red-400'}`}>
                                            {item.isToday || item.isTomorrow ? <Trophy size={20} /> : <CalendarDays size={20} />}
                                        </div>
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

// --- DEFAULT EXPORT WITH SUSPENSE ---
export default function EmployeeHighlightsPage() {
    return (
        <Suspense fallback={
            <div className="max-w-5xl mx-auto p-6 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-2xl mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
                </div>
            </div>
        }>
            <HighlightsContent />
        </Suspense>
    );
}