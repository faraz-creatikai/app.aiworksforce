"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Bot,
    Sparkles,
    Clock,
    Calendar,
    ChevronRight,
    Activity,
    FileText,
    AlertTriangle,
    Users,
    Target,
    Award,
    CheckCircle2,
    Send,
    Plus,
    Pin,
    Trash2,
    MessageSquare,
    Loader2,
    X,
    Maximize2,
    Minimize2,
    History,
    User,
    AlertOctagon,
    Copy,
} from "lucide-react";
import { toast } from "react-toastify";

// --- API IMPORTS ---
import {
    fetchAIReports,
    DailyAIReport,
    sendAdminAgentMessage,
    fetchAdminAgentSessions,
    fetchAdminSessionMessages,
    toggleAdminSessionPin,
    deleteAdminAgentSession,
    ChatSession,
    ChatMessage,
} from "@/store/aiagent/aiagent";

const AGENT = {
    name: "Kartik",
    role: "CRM Assistant",
    avatarUrl: "/taskbot.png",
    statusLabel: "Online & ready",
};

const SUGGESTIONS = [
    { icon: AlertTriangle, text: "Who has overdue tasks right now?" },
    { icon: Users, text: "Analyze team attendance for the last 7 days" },
    { icon: Target, text: "Show me pending tasks for Farazuddin" },
    { icon: Activity, text: "Get performance metrics for the team" },
];

type TabKey = "chat" | "reports";

function AgentAvatar({ size = 40, ring = false }: { size?: number; ring?: boolean }) {
    const [imgError, setImgError] = useState(false);
    return (
        <div
            className={`relative shrink-0 overflow-hidden rounded-full bg-white ${ring ? "ring-2 ring-white/80 shadow-lg" : ""}`}
            style={{ width: size, height: size }}
        >
            {!imgError ? (
                <img
                    src={AGENT.avatarUrl}
                    alt={AGENT.name}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-primary-lighter)]">
                    <Bot size={Math.round(size * 0.55)} className="text-[var(--color-primary)]" />
                </div>
            )}
        </div>
    );
}

// --- PREMIUM LLM UI COMPONENTS ---

// 1. Code Block with Copy Button
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

  // This stops tiny inline snippets from triggering the big block UI, 
// which is what pushed the dots to the next line!
if (!inline && (match || String(children).includes('\n'))) {
        return (
            <div className="relative my-4 flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
                <div className="flex items-center justify-between bg-gray-100/80 px-4 py-2 border-b border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        {match ? match[1] : 'Code'}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 cursor-pointer"
                    >
                        {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div className="custom-scrollbar overflow-x-auto p-4 text-[13px] leading-relaxed text-gray-800 font-mono">
                    <code className={className} {...props}>
                        {children}
                    </code>
                </div>
            </div>
        );
    }
    // Inline code snippet styling
    return (
        <code className="rounded-md bg-[var(--color-primary-lighter)] px-1.5 py-0.5 text-[13px] font-semibold text-[var(--color-primary-dark)]" {...props}>
            {children}
        </code>
    );
};

export default function AIAgentPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("chat");

    const [reports, setReports] = useState<DailyAIReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<DailyAIReport | null>(null);
    const [isLoadingReports, setIsLoadingReports] = useState(false);

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const activeSessionIdRef = useRef<string | null>(null);
    const hasLoadedOnce = useRef(false);

    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        if (isOpen && !hasLoadedOnce.current) {
            hasLoadedOnce.current = true;
            loadReports();
            loadSessions();
        }
    }, [isOpen]);

    const loadReports = async () => {
        setIsLoadingReports(true);
        try {
            const data = await fetchAIReports();
            setReports(data || []);
            if (data && data.length > 0) setSelectedReport(data[0]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingReports(false);
        }
    };

    const loadSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const data = await fetchAdminAgentSessions();
            setSessions(data || []);
            // ✅ FIX 1: Auto-selection removed so it defaults to New Chat on page load
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    useEffect(() => {
        if (activeSessionId) {
            loadMessages(activeSessionId);
        } else {
            setMessages([]);
        }
    }, [activeSessionId]);

    const loadMessages = async (sessionId: string) => {
        setIsLoadingMessages(true);
        try {
            const data = await fetchAdminSessionMessages(sessionId);
            setMessages(data || []);
        } catch (e) {
            toast.error("Failed to load conversation.");
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // A slight timeout ensures the DOM has finished expanding before it calculates the bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
    }, [messages, isTyping, isOpen, isExpanded]);

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        activeSessionIdRef.current = id;
        setHistoryOpen(false);
    };

    const handleCreateNewChat = () => {
        setActiveSessionId(null);
        activeSessionIdRef.current = null;
        setMessages([]);
        setHistoryOpen(false);
        setActiveTab("chat");
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const handleSendMessage = async (eOrText?: any) => {
        const isSuggestion = typeof eOrText === "string";
        const textToSend = isSuggestion ? eOrText : inputValue;
        const userText = textToSend?.trim();

        if (!userText || isTyping) return;

        if (!isSuggestion) {
            setInputValue("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";
        }

        const optimisticMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: userText,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setIsTyping(true);

        try {
            const targetSessionId = activeSessionIdRef.current || undefined;
            const response = await sendAdminAgentMessage(userText, targetSessionId);

            if (response && response.success && response.data) {
                const { text, sessionId } = response.data;

                if (!activeSessionIdRef.current && sessionId) {
                    setActiveSessionId(sessionId);
                    activeSessionIdRef.current = sessionId;
                    loadSessions();
                }

                const aiMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "model",
                    content: text,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, aiMsg]);
            } else {
                throw new Error(response?.message || "Failed to receive response from agent.");
            }
        } catch (error: any) {
            const errorStatus = error.response?.status;
            const backendMessage = error.response?.data?.message || error.message || "";
            const isQuota = errorStatus === 429 || backendMessage.includes("Quota exceeded") || backendMessage.includes("429");

            let displayMessage = "";
            if (isQuota) {
                displayMessage = "⚠️ **AI Quota Exceeded (429)**\nYou have exceeded the Gemini free tier limit. Please wait ~50s or update your API key.";
                toast.warning("Gemini Quota Exceeded (429)");
            } else {
                displayMessage = `❌ **Server Error**\n${backendMessage || "An unexpected error occurred."}`;
                toast.error("Agent failed to respond.");
            }

            const errorAiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "model",
                content: displayMessage,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorAiMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTogglePin = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSessions((prev) => {
            const updated = prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s));
            return updated.sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
        });
        try {
            await toggleAdminSessionPin(id);
        } catch (error) {
            toast.error("Failed to pin chat.");
            loadSessions();
        }
    };

    const handleDeleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSessionToDelete(id);
    };

    const confirmDeleteSession = async () => {
        if (!sessionToDelete) return;
        setIsDeleting(true);

        // Optimistic UI update
        setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
        if (activeSessionId === sessionToDelete) handleCreateNewChat();

        try {
            await deleteAdminAgentSession(sessionToDelete);
            toast.success("Chat deleted");
        } catch (error) {
            toast.error("Failed to delete chat.");
            loadSessions(); // Revert on failure
        } finally {
            setIsDeleting(false);
            setSessionToDelete(null);
        }
    };

    const RenderList = ({ items }: { items: string[] }) => (
        <ul className="mt-3 space-y-3">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                    <span>
                        {item.split(/(\*\*.*?\*\*)/).map((part, i) =>
                            part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={i} className="font-bold text-[var(--color-primary-dark)]">
                                    {part.slice(2, -2)}
                                </strong>
                            ) : (
                                part
                            )
                        )}
                    </span>
                </li>
            ))}
        </ul>
    );

    const renderStructuredReport = (report: DailyAIReport) => {
        let data: any;
        try {
            data = JSON.parse(report.content);
        } catch (e) {
            return (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-600">
                    Failed to parse report data. The AI returned an invalid format.
                    <br />
                    <br />
                    <span className="text-xs opacity-70">Raw Output: {report.content}</span>
                </div>
            );
        }

        if (report.type === "evening_summary") {
            return (
                <div className="animate-in fade-in space-y-8 duration-500">
                    {data.executiveSummary && (
                        <div className="rounded-2xl border border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] p-5">
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--color-primary-dark)]">
                                <Activity size={16} /> Executive Summary
                            </h3>
                            <p className="text-sm font-medium leading-relaxed text-gray-800">{data.executiveSummary}</p>
                        </div>
                    )}

                    {data.taskHighlights && data.taskHighlights.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-2 border-b border-gray-100 pb-2 text-lg font-extrabold text-gray-900">
                                <CheckCircle2 size={20} className="text-[var(--color-primary)]" /> Task Highlights & Progress
                            </h3>
                            <RenderList items={data.taskHighlights} />
                        </div>
                    )}

                    {data.attendanceAndWorkforce && data.attendanceAndWorkforce.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-2 border-b border-gray-100 pb-2 text-lg font-extrabold text-gray-900">
                                <Users size={20} className="text-blue-500" /> Attendance & Workforce
                            </h3>
                            <RenderList items={data.attendanceAndWorkforce} />
                        </div>
                    )}

                    {data.blockersAndAlerts && data.blockersAndAlerts.length > 0 && (
                        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                            <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-gray-900">
                                <AlertTriangle size={20} className="text-[var(--color-destructive)]" /> Blockers & Alerts
                            </h3>
                            <RenderList items={data.blockersAndAlerts} />
                        </div>
                    )}

                    {data.employeeSpotlight && (
                        <div className="flex items-start gap-4 rounded-2xl border border-orange-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
                            <div className="shrink-0 rounded-full bg-white p-3 text-orange-500 shadow-sm">
                                <Award size={24} />
                            </div>
                            <div>
                                <h3 className="mb-1 text-sm font-black uppercase tracking-wider text-orange-800">Employee Spotlight</h3>
                                <p className="text-sm font-medium leading-relaxed text-gray-800">{data.employeeSpotlight}</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (report.type === "morning_brief") {
            return (
                <div className="animate-in fade-in space-y-8 duration-500">
                    {data.morningFocus && (
                        <div className="rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] p-6 text-white shadow-md">
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white/90">
                                <Sparkles size={16} /> Morning Focus
                            </h3>
                            <p className="text-lg font-medium leading-relaxed">{data.morningFocus}</p>
                        </div>
                    )}

                    {data.priorityActionItems && data.priorityActionItems.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-2 border-b border-gray-100 pb-2 text-lg font-extrabold text-gray-900">
                                <Target size={20} className="text-[var(--color-primary)]" /> Priority Action Items
                            </h3>
                            <RenderList items={data.priorityActionItems} />
                        </div>
                    )}

                    {data.carryoverAlerts && data.carryoverAlerts.length > 0 && (
                        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                            <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-gray-900">
                                <AlertTriangle size={20} className="text-orange-500" /> Carryover Alerts & Absences
                            </h3>
                            <RenderList items={data.carryoverAlerts} />
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const pinnedSessions = sessions.filter((s) => s.isPinned);
    const recentSessions = sessions.filter((s) => !s.isPinned);
    const isReportsEmpty = !isLoadingReports && reports.length === 0;

    const togglePanel = () => {
        setIsOpen((v) => !v);
        setHistoryOpen(false);
    };

    const closePanel = () => {
        setIsOpen(false);
        setIsExpanded(false);
        setHistoryOpen(false);
    };

    const toggleExpand = () => {
        setIsExpanded((v) => !v);
        setHistoryOpen(false);
    };

    const renderSessionRow = (session: ChatSession) => (
        <div
            key={session.id}
            onClick={() => handleSelectSession(session.id)}
            className={`group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-all ${activeSessionId === session.id
                ? "bg-[var(--color-primary-lighter)] ring-1 ring-[var(--color-primary-light)]"
                : "hover:bg-gray-100"
                }`}
        >
            <div className="flex items-center gap-2.5 overflow-hidden">
                {session.isPinned ? (
                    <Pin size={14} className="shrink-0 fill-current text-[var(--color-primary)]" />
                ) : (
                    <MessageSquare size={14} className="shrink-0 text-gray-400" />
                )}
                <span
                    className={`truncate text-sm ${activeSessionId === session.id
                        ? "font-bold text-[var(--color-primary-dark)]"
                        : "font-medium text-gray-600"
                        }`}
                >
                    {session.title}
                </span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 bg-gradient-to-l from-white pl-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={(e) => handleTogglePin(e, session.id)}
                    className="rounded-md p-1.5 cursor-pointer text-gray-400 hover:text-[var(--color-primary)]"
                >
                    <Pin size={14} className={session.isPinned ? "fill-current" : ""} />
                </button>
                <button onClick={(e) => handleDeleteSession(e, session.id)} className="rounded-md p-1.5 cursor-pointer text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );

    // ✅ THE RESTORED renderReportRow FUNCTION
    const renderReportRow = (report: DailyAIReport) => {
        const isSelected = selectedReport?.id === report.id;
        const dateObj = new Date(report.reportDate);
        const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const isMorning = report.type === "morning_brief";

        return (
            <button
                key={report.id}
                onClick={() => {
                    setSelectedReport(report);
                    setHistoryOpen(false);
                }}
                className={`group relative w-full overflow-hidden cursor-pointer rounded-2xl p-4 text-left transition-all ${isSelected
                    ? "border-[var(--color-primary)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-[var(--color-primary-light)]"
                    : "border border-transparent bg-transparent hover:border-gray-200 hover:bg-white"
                    }`}
            >
                <div className="mb-2.5 flex items-center justify-between">
                    <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isMorning
                            ? "border border-orange-100 bg-orange-50 text-orange-600"
                            : "border border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]"
                            }`}
                    >
                        {report.type.replace("_", " ")}
                    </span>
                    <ChevronRight
                        size={16}
                        className={isSelected ? "text-[var(--color-primary)]" : "text-gray-400 opacity-0 group-hover:opacity-100"}
                    />
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Calendar size={14} className={isSelected ? "text-[var(--color-primary)]" : ""} /> {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={14} className={isSelected ? "text-[var(--color-primary)]" : ""} /> {formattedTime}
                    </span>
                </div>
            </button>
        );
    };

    // ✅ THE RESTORED renderSessionList FUNCTION
    const renderSessionList = () => (
        <div className="animate-in fade-in space-y-5 duration-300">
            <button
                onClick={handleCreateNewChat}
                className="flex w-full items-center justify-center cursor-pointer gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
                <Plus size={16} /> New Chat
            </button>
            {isLoadingSessions ? (
                <div className="flex justify-center p-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
            ) : (
                <>
                    {pinnedSessions.length > 0 && (
                        <div>
                            <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Pinned</h3>
                            <div className="space-y-1">{pinnedSessions.map(renderSessionRow)}</div>
                        </div>
                    )}
                    <div>
                        <h3 className="mb-2 mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent</h3>
                        {recentSessions.length === 0 && pinnedSessions.length === 0 ? (
                            <p className="px-2 text-xs text-gray-400">No past conversations.</p>
                        ) : (
                            <div className="space-y-1">{recentSessions.map(renderSessionRow)}</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    const renderReportList = () =>
        isLoadingReports ? (
            <div className="flex justify-center p-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
        ) : isReportsEmpty ? (
            <div className="p-6 text-center text-sm font-medium text-gray-500">No reports generated yet.</div>
        ) : (
            <div className="animate-in fade-in space-y-2 duration-300">{reports.map(renderReportRow)}</div>
        );

    const renderMessages = () => (
        <>
            {messages.length === 0 && !isLoadingMessages && (
                <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-8 animate-in fade-in duration-500">
                    <AgentAvatar size={56} ring />
                    <h2 className="mt-4 text-xl font-black text-gray-900">How can I help?</h2>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 text-center max-w-sm">
                        I'm your {AGENT.role.toLowerCase()}. I can fetch task reports, analyze productivity, or answer questions about your data.
                    </p>

                    <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                        {SUGGESTIONS.map((sug, i) => {
                            const Icon = sug.icon;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(sug.text)}
                                    className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-[var(--color-primary-light)] hover:shadow-md cursor-pointer"
                                >
                                    <div className="flex shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-lighter)] p-2.5 text-[var(--color-primary-dark)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                                        <Icon size={18} />
                                    </div>
                                    <span className="text-xs font-bold leading-snug text-gray-700 transition-colors group-hover:text-[var(--color-primary-dark)]">
                                        {sug.text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {isLoadingMessages ? (
                <div className="flex justify-center p-8">
                    <Loader2 size={22} className="animate-spin text-[var(--color-primary)]" />
                </div>
            ) : (
                messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const isError = msg.content.startsWith("⚠️") || msg.content.startsWith("❌");

                    return (
                        <div
                            key={msg.id}
                            className={`mb-5 flex w-full max-w-[900px] mx-auto animate-in slide-in-from-bottom-2 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex w-full max-w-[90%] gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${isUser ? "bg-gray-900" : isError ? "bg-red-500 text-white" : ""}`}>
                                    {isUser ? <User size={15} className="text-white" /> : isError ? <AlertOctagon size={16} /> : <AgentAvatar size={32} />}
                                </div>
                                <div
                                    className={`rounded-2xl px-5 py-4 text-sm leading-relaxed overflow-x-auto custom-scrollbar ${isUser
                                        ? "rounded-tr-sm bg-gray-900 text-white shadow-md"
                                        : isError
                                            ? "rounded-tl-sm border border-red-200 bg-red-50 text-red-800 shadow-sm"
                                            : "rounded-tl-sm border border-gray-200 bg-white text-gray-800 shadow-sm"
                                        }`}
                                >
                                    {isUser ? (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    ) : (
                                        // --- REACT MARKDOWN INTEGRATION ---
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code: CodeBlock,
                                                table: ({ node, ...props }) => (
                                                    <div className="overflow-x-auto my-4 w-full">
                                                        <table className="w-full text-left border-collapse rounded-lg overflow-hidden ring-1 ring-gray-200" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-gray-50/80 border-b border-gray-200" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px] break-words whitespace-normal" {...props} />,
                                                td: ({ node, children, ...props }) => (
                                                    <td className="px-4 py-3 text-[13px] text-gray-700 border-b border-gray-100 min-w-[250px] break-words whitespace-normal align-top" {...props}>
                                                        {React.Children.map(children, (child) => {
                                                            if (typeof child === "string") {
                                                                // Split string by <br> or <br/> and map to real line breaks
                                                                return child.split(/<br\s*\/?>/gi).map((part, i) => (
                                                                    <span key={i}>
                                                                        {i > 0 && <div className="h-1.5 w-full" /> /* Gives a slightly cleaner gap than a harsh <br/> */}
                                                                        {part}
                                                                    </span>
                                                                ));
                                                            }
                                                            return child;
                                                        })}
                                                    </td>
                                                ),
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-3 marker:text-gray-400" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-3 marker:text-gray-400" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-[var(--color-primary)] hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-[var(--color-primary-dark)]" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-lg font-black text-gray-900 mt-4 mb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-base font-bold text-gray-900 mt-4 mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-gray-900 mt-3 mb-1" {...props} />,
                                                // ✅ FIX 2: Hydration fix - render paragraph as div
                                                p: ({ node, children, ...props }) => (
                                                    <div className="mb-2 last:mb-0 leading-relaxed break-words" {...props}>
                                                        {React.Children.map(children, (child) => {
                                                            if (typeof child === "string") {
                                                                return child.split(/<br\s*\/?>/gi).map((part, i) => (
                                                                    <span key={i}>
                                                                        {i > 0 && <br />}
                                                                        {part}
                                                                    </span>
                                                                ));
                                                            }
                                                            return child;
                                                        })}
                                                    </div>
                                                ),
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-200 pl-4 py-1 my-3 italic text-gray-500 bg-gray-50 rounded-r-lg" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {isTyping && (
                <div className="mb-5 flex w-full animate-in fade-in justify-start">
                    <div className="flex max-w-[80%] gap-2.5">
                        <AgentAvatar size={32} />
                        <div className="flex h-[46px] items-center gap-1.5 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </>
    );

    const renderChatInput = () => (
        <div className="shrink-0 border-t border-gray-100 bg-white p-3 w-full max-w-[900px] mx-auto">
            <div className="relative flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm transition-all focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-light)]">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${AGENT.name} anything…`}
                    className="custom-scrollbar max-h-40 min-h-[40px] w-full resize-none bg-transparent px-2.5 py-2 text-sm text-gray-800 outline-none"
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="shrink-0 rounded-xl bg-[var(--color-primary)] p-2.5 cursor-pointer text-white shadow-sm transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-40"
                >
                    <Send size={16} className={inputValue.trim() && !isTyping ? "-translate-y-0.5 translate-x-0.5 transition-transform" : ""} />
                </button>
            </div>
        </div>
    );

    const renderReportBody = (compact: boolean) => {
        if (isLoadingReports) {
            return (
                <div className="flex justify-center p-8">
                    <Loader2 size={22} className="animate-spin text-[var(--color-primary)]" />
                </div>
            );
        }
        if (isReportsEmpty) {
            return (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                    <FileText size={compact ? 40 : 44} className="mb-3 text-gray-200" />
                    <p className="text-sm font-bold">No reports generated yet.</p>
                </div>
            );
        }
        if (!selectedReport) {
            return (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                    <FileText size={compact ? 40 : 44} className="mb-3 text-gray-200" />
                    <p className="text-sm font-bold">Select a report to view details.</p>
                </div>
            );
        }
        return (
            <div className={compact ? "" : "mx-auto max-w-3xl"}>
                <div className="mb-3 flex items-center gap-2 text-[var(--color-primary)]">
                    <Activity size={compact ? 15 : 16} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Agent Payload</span>
                </div>
                <h1 className={`mb-2 font-black text-gray-900 ${compact ? "text-lg" : "text-2xl"}`}>
                    {selectedReport.type === "evening_summary" ? "Operations & Attendance Report" : "Morning Priority Briefing"}
                </h1>
                <p className="mb-6 border-b border-gray-100 pb-5 text-xs font-medium text-gray-500">
                    Autonomous audit generated on {new Date(selectedReport.reportDate).toLocaleString()}
                </p>
                {renderStructuredReport(selectedReport)}
            </div>
        );
    };

    return (
        <>
            {isOpen && isExpanded && (
                <div
                    className="fixed inset-0 z-40 hidden sm:block animate-in fade-in bg-gray-900/30 backdrop-blur-sm duration-200"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {isOpen && (
                <div
                    className={`fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95
            top-0 left-0 right-0 bottom-0 h-[100dvh] w-full rounded-none
            
            ${isExpanded
                            ? "sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:h-[100dvh]  sm:w-[100dvw]  "
                            : "sm:bottom-6 sm:right-6 sm:top-auto sm:left-auto sm:translate-x-0 sm:translate-y-0 sm:h-[95vh] sm:max-h-[800px] sm:w-[400px] sm:rounded-[28px] "
                        }
          `}
                >
                    {!isExpanded && (
                        <div className="absolute -bottom-2 right-8 hidden sm:block h-4 w-4 rotate-45 border-b border-r border-gray-200 bg-white" />
                    )}

                    <div className={`relative shrink-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-4 py-3.5 ${isExpanded ? "" : "pt-6 "}  `}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-3">
                                <AgentAvatar size={38} ring />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-white">{AGENT.name}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        </span>
                                        <span className="truncate">
                                            {AGENT.role} · {AGENT.statusLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                {/* ✅ FIX 3: THE NEW CHAT BUTTON FIX */}
                                <button
                                    onClick={handleCreateNewChat}
                                    className="rounded-lg cursor-pointer p-1.5 transition-colors text-white/80 hover:bg-white/15 hover:text-white"
                                    title="New Chat"
                                >
                                    <Plus size={18} />
                                </button>

                                {!isExpanded && (
                                    <button
                                        onClick={() => setHistoryOpen((v) => !v)}
                                        className={`rounded-lg cursor-pointer p-1.5 transition-colors ${historyOpen ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/15 hover:text-white"
                                            }`}
                                        title="History"
                                    >
                                        <History size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={toggleExpand}
                                    className="hidden sm:inline-flex rounded-lg p-1.5 cursor-pointer text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                                <button
                                    onClick={closePanel}
                                    className="rounded-lg p-1.5 text-white/80 cursor-pointer transition-colors hover:bg-white/15 hover:text-white"
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 flex rounded-xl bg-white/15 p-1 max-w-[500px]">
                            <button
                                onClick={() => {
                                    setActiveTab("chat");
                                    setHistoryOpen(false);
                                }}
                                className={`flex-1 rounded-lg cursor-pointer py-1.5 text-xs font-bold transition-all ${activeTab === "chat" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-white/85 hover:text-white"
                                    }`}
                            >
                                Live Chat
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("reports");
                                    setHistoryOpen(false);
                                }}
                                className={`flex-1 rounded-lg cursor-pointer py-1.5 text-xs font-bold transition-all ${activeTab === "reports" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-white/85 hover:text-white"
                                    }`}
                            >
                                Daily Reports
                            </button>
                        </div>
                    </div>

                    {isExpanded ? (
                        <div className="flex min-h-0 flex-1">
                            <div className="hidden w-72 shrink-0 flex-col border-r border-gray-200 bg-gray-50/50 sm:flex">
                                <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                                    {activeTab === "chat" ? renderSessionList() : renderReportList()}
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                                {activeTab === "chat" ? (
                                    <>
                                        <div className="custom-scrollbar flex-1 overflow-y-auto bg-[linear-gradient(180deg,var(--color-primary-lighter)_0%,_#ffffff_180px)] p-6 pb-safe">
                                            {renderMessages()}
                                        </div>
                                        {renderChatInput()}
                                    </>
                                ) : (
                                    <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-8 sm:px-10 pb-safe">
                                        {renderReportBody(false)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : historyOpen ? (
                        <div className="custom-scrollbar flex-1 animate-in slide-in-from-top-2 space-y-4 overflow-y-auto p-4 duration-200 pb-safe">
                            {activeTab === "chat" ? renderSessionList() : renderReportList()}
                        </div>
                    ) : activeTab === "chat" ? (
                        <>
                            <div className="custom-scrollbar flex-1 overflow-y-auto bg-[linear-gradient(180deg,var(--color-primary-lighter)_0%,_#ffffff_160px)] p-4 pb-safe">
                                {renderMessages()}
                            </div>
                            {renderChatInput()}
                        </>
                    ) : (
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-5 pb-safe">{renderReportBody(true)}</div>
                    )}
                </div>
            )}

            {!isExpanded && (
                <button
                    onClick={togglePanel}
                    className={`fixed bottom-4 right-6 z-[60] cursor-pointer h-14 w-14 items-center justify-center rounded-full bg-white shadow-2xl ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95 pb-safe ${isOpen ? "hidden " : "flex"
                        }`}
                    title={isOpen ? `Close ${AGENT.name}` : `Chat with ${AGENT.name}`}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] opacity-90" />
                    <div className="relative flex h-full w-full items-center justify-center">
                        {isOpen ? <X size={22} className="text-white" /> : <AgentAvatar size={44} ring />}
                    </div>
                    {!isOpen && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                        </span>
                    )}
                </button>
            )}

            {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
            {sessionToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-6 text-center shadow-2xl">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-gray-900">Delete Conversation?</h3>
                        <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                            Are you sure you want to delete this chat history? This action cannot be undone.
                        </p>
                        <div className="flex w-full gap-3">
                            <button
                                onClick={() => setSessionToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 cursor-pointer rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteSession}
                                disabled={isDeleting}
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-red-600 disabled:opacity-70"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}