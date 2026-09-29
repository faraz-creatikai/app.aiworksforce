"use client";

import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft, Plus, Send, Clock, CheckCircle2,
    MessageSquare, AlertCircle, LifeBuoy, MoreVertical,
    Ticket, Loader2,
    ShieldCheck
} from "lucide-react";
import { toast } from "react-toastify";
import {
    createCustomerEnquiry, getCustomerEnquiries,
    getCustomerEnquiryById, replyToEnquiryAsCustomer
} from "@/store/enquiry/enquiry"; // Adjust import path as needed

// --- TYPES ---
interface Admin {
    name: string;
    role: string;
    AdminImage: any;
}

interface Customer {
    customerName: string;
    CustomerImage: any;
}

interface EnquiryMessage {
    id: string;
    message: string;
    adminId: string | null;
    customerId: string | null;
    createdAt: string;
    admin?: Admin | null;
    customer?: Customer | null;
}

interface Enquiry {
    id: string;
    ticketId: string;
    subject: string;
    status: "open" | "pending" | "resolved" | "closed";
    priority: string;
    createdAt: string;
    updatedAt: string;
    messages?: EnquiryMessage[];
    _count?: { messages: number };
}

type ViewState = "list" | "create" | "chat";

// --- HELPERS ---
const STATUS_STYLES: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 ring-blue-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    closed: "bg-gray-100 text-gray-700 ring-gray-600/20",
};

const PRIORITY_STYLES: Record<string, string> = {
    low: "text-gray-500",
    medium: "text-blue-500",
    high: "text-amber-500",
    urgent: "text-red-500",
};

const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "??";

export default function ClientSupportPage() {
    const [view, setView] = useState<ViewState>("list");
    const [tickets, setTickets] = useState<Enquiry[]>([]);
    const [activeTicket, setActiveTicket] = useState<Enquiry | null>(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form & Chat State
    const [createForm, setCreateForm] = useState({ subject: "", priority: "medium", message: "" });
    const [replyMessage, setReplyMessage] = useState("");

    const chatBottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- INITIAL FETCH ---
    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setIsLoading(true);
        const res = await getCustomerEnquiries();
        if (res?.success) setTickets(res.data);
        setIsLoading(false);
    };

    // --- ACTIONS ---
    const handleOpenTicket = async (id: string) => {
        setIsLoading(true);
        const res = await getCustomerEnquiryById(id);
        if (res?.success) {
            setActiveTicket(res.data);
            setView("chat");
            setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } else {
            toast.error("Failed to load ticket");
        }
        setIsLoading(false);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.subject.trim() || !createForm.message.trim()) return;

        setIsSubmitting(true);
        const res = await createCustomerEnquiry(createForm);
        setIsSubmitting(false);

        if (res?.success) {
            toast.success("Ticket created successfully");
            setCreateForm({ subject: "", priority: "medium", message: "" });
            await loadTickets();
            // Auto-open the new ticket
            handleOpenTicket(res.data.id);
        } else {
            toast.error("Failed to create ticket");
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !activeTicket) return;

        // Optimistic UI Update
        const optimisticMsg: EnquiryMessage = {
            id: Date.now().toString(),
            message: replyMessage,
            adminId: null,
            customerId: "temp",
            createdAt: new Date().toISOString(),
            customer: { customerName: "You", CustomerImage: null }
        };

        setActiveTicket(prev => prev ? {
            ...prev,
            messages: [...(prev.messages || []), optimisticMsg]
        } : null);

        const messageToSend = replyMessage;
        setReplyMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

        const res = await replyToEnquiryAsCustomer(activeTicket.id, { message: messageToSend });

        if (res?.success) {
            // Reload silently to get actual DB IDs and timestamps
            const freshTicket = await getCustomerEnquiryById(activeTicket.id);
            if (freshTicket?.success) setActiveTicket(freshTicket.data);
        } else {
            toast.error("Failed to send message");
        }
    };

    // --- RENDER LIST VIEW ---
    if (view === "list") {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-safe">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Support Tickets</h1>
                        <p className="text-sm text-gray-500 mt-1">Need help? We're here for you.</p>
                    </div>
                    <button
                        onClick={() => setView("create")}
                        className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--color-primary-dark)] active:scale-95"
                    >
                        <Plus size={18} /> New Ticket
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32} /></div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-gray-300 rounded-3xl bg-white">
                        <div className="h-16 w-16 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] flex items-center justify-center mb-4">
                            <LifeBuoy size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No support tickets</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm">If you have any questions, issues, or requests, create a ticket and our team will assist you.</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:gap-4">
                        {tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => handleOpenTicket(ticket.id)}
                                className="group relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[var(--color-primary-light)] hover:shadow-md cursor-pointer"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{ticket.ticketId}</span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[var(--color-primary-darker)] transition-colors">
                                        {ticket.subject}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-500 shrink-0">
                                    <div className="flex items-center gap-1.5" title="Priority">
                                        <AlertCircle size={14} className={PRIORITY_STYLES[ticket.priority]} />
                                        <span className="capitalize text-xs font-medium">{ticket.priority}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MessageSquare size={14} className="text-gray-400" />
                                        <span className="text-xs font-medium">{ticket._count?.messages || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="text-xs font-medium">{formatDate(ticket.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER CREATE VIEW ---
    if (view === "create") {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300 pb-safe">
                <button
                    onClick={() => setView("list")}
                    className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Tickets
                </button>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-gray-900">Create Support Ticket</h2>
                        <p className="text-sm text-gray-500 mt-1">Describe your issue in detail. We'll reply as soon as possible.</p>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Subject</label>
                            <input
                                type="text"
                                required
                                value={createForm.subject}
                                onChange={e => setCreateForm({ ...createForm, subject: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-light)]"
                                placeholder="E.g., Issue with latest project delivery"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Priority</label>
                            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                {["low", "medium", "high", "urgent"].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCreateForm({ ...createForm, priority: p })}
                                        className={`rounded-lg py-2.5 cursor-pointer text-xs sm:text-sm font-bold capitalize transition-all border ${createForm.priority === p
                                                ? "border-[var(--color-primary)] bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] ring-1 ring-[var(--color-primary)]"
                                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                            <textarea
                                required
                                rows={5}
                                value={createForm.message}
                                onChange={e => setCreateForm({ ...createForm, message: e.target.value })}
                                className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-light)] custom-scrollbar"
                                placeholder="Provide all necessary details so our team can assist you efficiently..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-dark)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {isSubmitting ? "Submitting..." : "Submit Ticket"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- RENDER CHAT/DETAIL VIEW ---
    if (view === "chat" && activeTicket) {
        return (
            <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-right-8 duration-300 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Chat Header */}
                <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:px-6 sm:py-4 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setActiveTicket(null); setView("list"); }}
                            className="p-2 -ml-2 rounded-full cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{activeTicket.ticketId}</span>
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[activeTicket.status]}`}>
                                    {activeTicket.status}
                                </span>
                            </div>
                            <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{activeTicket.subject}</h2>
                        </div>
                    </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-[#f8fafc]">
                    <div className="flex flex-col space-y-6">
                        {activeTicket.messages?.map((msg, index) => {
                            const isCustomer = !!msg.customerId;
                            const senderName = isCustomer ? "You" : msg.admin?.name || "Support Team";
                            const senderLevel = !isCustomer && msg.admin?.role === "administrator" ? "Admin" : msg.admin?.role === "city_admin" ? "Sub Admin" : msg.admin?.role === "user" ? "Moderator" : "";

                            // Standardizing avatar display securely
                            let avatarContent;
                            if (isCustomer) {
                                avatarContent = <div className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0">{getInitials(senderName)}</div>;
                            } else {
                                avatarContent = <div className="h-8 w-8 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ring-1 ring-[var(--color-primary-light)]">{getInitials(senderName)}</div>;
                            }

                            return (
                                <div key={msg.id} className={`flex gap-3 w-full max-w-[85%] sm:max-w-[75%] ${isCustomer ? "ml-auto flex-row-reverse" : ""}`}>
                                    {avatarContent}
                                    <div className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}>
                                        <span className="text-[12px] font-bold text-gray-500 mb-1 px-1 flex gap-1 justify-center items-center">
                                            {!isCustomer && <span className=" font-bold text-gray-700 text-sm flex justify-center items-center"><ShieldCheck size={16} className=" text-[var(--color-primary)]" />{senderLevel}</span>} {isCustomer ? senderName : "(" + senderName + ")"} • {formatTime(msg.createdAt)}
                                        </span>
                                        <div
                                            className={`relative px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl shadow-sm ${isCustomer
                                                    ? "bg-gray-900 text-white rounded-tr-sm"
                                                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                                                }`}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatBottomRef} className="h-2" />
                    </div>
                </div>

                {/* Chat Input Bottom Bar */}
                {activeTicket.status === "closed" || activeTicket.status === "resolved" ? (
                    <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-4 text-center">
                        <p className="text-sm font-medium text-gray-500">This ticket has been {activeTicket.status}. Replies are disabled.</p>
                    </div>
                ) : (
                    <div className="shrink-0 bg-white border-t border-gray-100 p-3 sm:p-4 pb-safe">
                        <div className="relative flex items-end gap-2 rounded-2xl border border-gray-300 bg-gray-50 p-2 shadow-sm focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-light)] transition-all">
                            <textarea
                                ref={textareaRef}
                                value={replyMessage}
                                onChange={e => {
                                    setReplyMessage(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                }}
                                placeholder="Type your reply..."
                                className="w-full resize-none bg-transparent px-2.5 py-2 text-sm text-gray-900 outline-none min-h-[40px] max-h-[120px] custom-scrollbar"
                                rows={1}
                            />
                            <button
                                onClick={handleSendReply}
                                disabled={!replyMessage.trim()}
                                className="shrink-0 rounded-xl cursor-pointer bg-[var(--color-primary)] p-2.5 text-white shadow-sm transition-all hover:bg-[var(--color-primary-dark)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} className={replyMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}