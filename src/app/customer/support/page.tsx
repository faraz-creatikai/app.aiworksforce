"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Search, ArrowLeft, Send, Clock, CheckCircle2, 
  MessageSquare, AlertCircle, LifeBuoy, Filter,
  MoreVertical, ShieldCheck, Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import { 
  getAllAdminEnquiries, 
  getAdminEnquiryById, 
  replyToEnquiryAsAdmin,
  updateEnquiryStatus
} from "@/store/enquiry/enquiry"; // Adjust import path

// --- TYPES ---
interface EnquiryMessage {
  id: string;
  message: string;
  adminId: string | null;
  customerId: string | null;
  createdAt: string;
  admin?: { name: string; role: string; AdminImage: any } | null;
  customer?: { customerName: string; CustomerImage: any } | null;
}

interface Enquiry {
  id: string;
  ticketId: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer?: { customerName: string; Email: string; CustomerImage: any };
  messages?: EnquiryMessage[];
  _count?: { messages: number };
}

// --- HELPERS ---
const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

const PRIORITY_ICON_COLORS: Record<string, string> = {
  low: "text-gray-400",
  medium: "text-blue-500",
  high: "text-amber-500",
  urgent: "text-red-500",
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "??";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Enquiry[]>([]);
  const [activeTicket, setActiveTicket] = useState<Enquiry | null>(null);
  
  // UI State
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  // Filters & Actions
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // Reload if status filter explicitly changes

  const loadTickets = async () => {
    setIsLoadingList(true);
    // Build query param based on filters (assuming your backend handles ?status=open)
    const params = statusFilter !== "all" ? `status=${statusFilter}` : "";
    const res = await getAllAdminEnquiries(params);
    if (res?.success) setTickets(res.data);
    setIsLoadingList(false);
  };

  const handleOpenTicket = async (ticket: Enquiry) => {
    setIsLoadingChat(true);
    setIsMobileChatOpen(true);
    
    // We set basic info instantly for snappy UI, then fetch the full thread
    setActiveTicket(ticket); 

    const res = await getAdminEnquiryById(ticket.id);
    if (res?.success) {
      setActiveTicket(res.data);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      toast.error("Failed to load ticket thread");
      setIsMobileChatOpen(false);
    }
    setIsLoadingChat(false);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !activeTicket) return;

    const messageToSend = replyMessage;
    setReplyMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    // Optimistic UI
    const optimisticMsg: EnquiryMessage = {
      id: Date.now().toString(),
      message: messageToSend,
      adminId: "temp",
      customerId: null,
      createdAt: new Date().toISOString(),
      admin: { name: "You", role: "admin", AdminImage: null }
    };
    
    setActiveTicket(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg]
    } : null);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const res = await replyToEnquiryAsAdmin(activeTicket.id, { message: messageToSend });
    if (res?.success) {
      const freshTicket = await getAdminEnquiryById(activeTicket.id);
      if (freshTicket?.success) {
        setActiveTicket(freshTicket.data);
        // Silently update list so the main screen stays accurate
        loadTickets(); 
      }
    } else {
      toast.error("Failed to send message");
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!activeTicket || isChangingStatus) return;
    setIsChangingStatus(true);
    
    const res = await updateEnquiryStatus(activeTicket.id, { status: newStatus });
    if (res?.success) {
      toast.success(`Ticket marked as ${newStatus}`);
      setActiveTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
      loadTickets(); // Refresh list to reflect new status
    } else {
      toast.error("Failed to update status");
    }
    setIsChangingStatus(false);
  };

  // --- FILTERING ---
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(search) ||
      t.subject.toLowerCase().includes(search) ||
      t.customer?.customerName.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex h-[calc(100vh-90px)] sm:h-[calc(100vh-120px)] w-full gap-3 pb-safe">
      
      {/* =========================================================
          LEFT PANEL: TICKET LIST
          ========================================================= */}
      <div className={`flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm transition-all overflow-hidden ${isMobileChatOpen ? 'hidden lg:flex lg:w-1/3' : 'w-full lg:w-[35%]'}`}>
        
        {/* Header & Controls */}
        <div className="shrink-0 p-4 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-gray-900">Enquiries</h1>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">{filteredTickets.length}</span>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tickets, clients..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 hide-scrollbar">
            {["all", "open", "pending", "resolved", "closed"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  statusFilter === status 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
          {isLoadingList ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--color-primary)]" size={24} /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center text-center p-8 opacity-60">
              <LifeBuoy size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTickets.map(ticket => {
                const isActive = activeTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => handleOpenTicket(ticket)}
                    className={`w-full text-left p-4 sm:p-5 transition-all focus:outline-none cursor-pointer group ${
                      isActive 
                      ? "bg-[var(--color-primary-lighter)] border-l-4 border-l-[var(--color-primary)]" 
                      : "bg-white border-l-4 border-l-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{ticket.ticketId}</span>
                        {ticket.priority === "urgent" && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLES[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>
                    
                    <h3 className={`text-sm font-bold truncate mb-1 ${isActive ? "text-[var(--color-primary-darker)]" : "text-gray-900 group-hover:text-[var(--color-primary)]"}`}>
                      {ticket.subject}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600 shrink-0">
                          {getInitials(ticket.customer?.customerName)}
                        </div>
                        <span className="truncate">{ticket.customer?.customerName}</span>
                      </div>
                      <span className="shrink-0">{formatDate(ticket.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          RIGHT PANEL: CHAT THREAD
          ========================================================= */}
      <div className={`flex flex-col flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden transition-all ${!isMobileChatOpen ? 'hidden lg:flex' : 'flex'}`}>
        {!activeTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
            <div className="h-20 w-20 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-6 text-gray-300">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Select a Ticket</h2>
            <p className="text-sm text-gray-500 max-w-sm">Choose an enquiry from the left to view the thread and respond to the client.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="shrink-0 bg-white border-b border-gray-100 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4  shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setIsMobileChatOpen(false)}
                  className="lg:hidden p-2 -ml-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
  <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{activeTicket.subject}</h2>
  <span title={`Priority: ${activeTicket.priority}`} className="flex shrink-0">
    <AlertCircle size={14} className={PRIORITY_ICON_COLORS[activeTicket.priority]} />
  </span>
</div>
                  <p className="text-xs font-medium text-gray-500 truncate">
                    Client: <span className="font-bold text-gray-700">{activeTicket.customer?.customerName}</span> 
                    {activeTicket.customer?.Email && ` • ${activeTicket.customer.Email}`}
                  </p>
                </div>
              </div>

              {/* Status Updater */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <select 
                    disabled={isChangingStatus}
                    value={activeTicket.status}
                    onChange={(e) => handleChangeStatus(e.target.value)}
                    className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all ${STATUS_STYLES[activeTicket.status]} disabled:opacity-50`}
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending Client</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <MoreVertical size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-4 sm:p-6">
              {isLoadingChat ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32} /></div>
              ) : (
                <div className="flex flex-col space-y-6">
                  {/* Initial Ticket Divider */}
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-300">
                    <span className="h-px flex-1 bg-gray-200" />
                    {formatDate(activeTicket.createdAt)}
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>

                  {activeTicket.messages?.map((msg) => {
                    // In Admin view, "You" are the admin (right), Customer is left
                    const isAdmin = !!msg.adminId;
                    const senderName = isAdmin ? (msg.admin?.name || "Support") : (msg.customer?.customerName || "Client");
                    
                    const avatarContent = isAdmin 
                      ? <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md">{getInitials(senderName)}</div>
                      : <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{getInitials(senderName)}</div>;

                    return (
                      <div key={msg.id} className={`flex gap-3 w-full max-w-[85%] sm:max-w-[75%] ${isAdmin ? "ml-auto flex-row-reverse" : ""}`}>
                        {avatarContent}
                        <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                          <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                            {senderName} {isAdmin && <ShieldCheck size={10} className="inline text-[var(--color-primary)] -mt-0.5" />} • {formatTime(msg.createdAt)}
                          </span>
                          <div 
                            className={`relative px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl shadow-sm ${
                              isAdmin 
                              ? "bg-[var(--color-primary)] text-white rounded-tr-sm" 
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
              )}
            </div>

            {/* Input Area */}
            {activeTicket.status === "closed" ? (
              <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-4 text-center">
                <p className="text-sm font-medium text-gray-500">This ticket is closed. Reopen it to reply.</p>
              </div>
            ) : (
              <div className="shrink-0 bg-white border-t border-gray-100 p-3 sm:p-5">
                <div className="relative flex items-end gap-2 rounded-2xl border border-gray-300 bg-gray-50 p-2 shadow-sm focus-within:border-[var(--color-primary)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary-light)] transition-all">
                  <textarea
                    ref={textareaRef}
                    value={replyMessage}
                    onChange={e => {
                      setReplyMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    placeholder={`Reply to ${activeTicket.customer?.customerName || "client"}...`}
                    className="w-full resize-none bg-transparent px-3 py-2 text-sm text-gray-900 outline-none min-h-[40px] max-h-[150px] custom-scrollbar"
                    rows={1}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim()}
                    className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-gray-900 text-white shadow-sm transition-all hover:bg-gray-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={16} className={replyMessage.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}