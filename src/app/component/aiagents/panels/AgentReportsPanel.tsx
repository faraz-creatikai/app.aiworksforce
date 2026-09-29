"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Bot, Sparkles, Clock, Calendar, ChevronRight, Activity, 
  FileText, AlertTriangle, Users, Target, Award, CheckCircle2,
  Send, Plus, Pin, Trash2, MessageSquare, Loader2, ArrowLeft,
  MoreVertical,
  User
} from "lucide-react";
import { toast } from "react-toastify";

// --- API IMPORTS (Adjust to your actual store paths) ---
import { 
  fetchAIReports, 
  DailyAIReport,
  sendAdminAgentMessage,
  fetchAdminAgentSessions,
  fetchAdminSessionMessages,
  toggleAdminSessionPin,
  deleteAdminAgentSession,
  ChatSession,
  ChatMessage
} from "@/store/aiagent/aiagent"; 

export default function AdminAgentWorkspace() {
  // --- UI TOGGLES ---
  const [activeTab, setActiveTab] = useState<"chat" | "reports">("chat");
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);

  // --- REPORTS STATE ---
  const [reports, setReports] = useState<DailyAIReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailyAIReport | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // --- CHAT STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  useEffect(() => {
    loadReports();
    loadSessions();
  }, []);

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
      // If we have sessions, automatically select the most recent one on load
      if (data && data.length > 0 && !activeSessionId) {
        handleSelectSession(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load messages whenever the active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      // If no session is active (e.g., "New Chat"), clear messages
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeTab]);

  // ========================================================================
  // CHAT HANDLERS
  // ========================================================================
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setShowSidebarOnMobile(false);
  };

  const handleCreateNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowSidebarOnMobile(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    setInputValue("");
    
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Optimistically add user message
    const optimisticMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setIsTyping(true);

    try {
      // Send to backend
      const response = await sendAdminAgentMessage(userText, activeSessionId);
      
      if (response.success && response.data) {
        const { text, sessionId } = response.data;
        
        // If this was a new chat, the backend created a session. 
        // We must update activeSessionId and refresh the sidebar.
        if (!activeSessionId) {
          setActiveSessionId(sessionId);
          loadSessions(); // Refreshes sidebar to show the new auto-generated title
        } else {
          // If existing chat, just bubble it to the top of the sidebar
          setSessions(prev => {
            const updated = prev.map(s => s.id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s);
            return updated.sort((a, b) => {
              if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
          });
        }

        // Add AI response to UI
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: text,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      toast.error("Agent failed to respond.");
      // Optionally remove the optimistic message here if desired
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
    // Optimistic UI update
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s);
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
    try {
      await toggleAdminSessionPin(id);
    } catch (error) {
      toast.error("Failed to pin chat.");
      loadSessions(); // Revert on failure
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    // Optimistic UI update
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      handleCreateNewChat();
    }

    try {
      await deleteAdminAgentSession(id);
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat.");
      loadSessions(); // Revert on failure
    }
  };

  // ========================================================================
  // FORMATTING & RENDERERS
  // ========================================================================

  // Gracefully handles bolding (**text**) and newlines in chat messages
  const formatChatMessage = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim() === '') return <br key={idx} />;
      
      // Handle simple markdown bullet points
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Handle bolding
      const parts = cleanLine.split(/(\*\*.*?\*\*)/).map((part, i) => 
        part.startsWith('**') && part.endsWith('**') 
          ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong> 
          : part
      );

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 shrink-0" />
            <span className="flex-1">{parts}</span>
          </div>
        );
      }
      return <p key={idx} className="mb-1">{parts}</p>;
    });
  };

  const RenderList = ({ items }: { items: string[] }) => (
    <ul className="space-y-3 mt-3">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm leading-relaxed">
          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full mt-2 shrink-0" />
          <span>
            {item.split(/(\*\*.*?\*\*)/).map((part, i) => 
              part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-[var(--color-primary-dark)] font-bold">{part.slice(2, -2)}</strong> : part
            )}
          </span>
        </li>
      ))}
    </ul>
  );

  const renderStructuredReport = (report: DailyAIReport) => {
    let data;
    try {
      data = JSON.parse(report.content);
    } catch (e) {
      return (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
          Failed to parse report data. The AI returned an invalid format.
          <br /><br />
          <span className="text-xs opacity-70">Raw Output: {report.content}</span>
        </div>
      );
    }

    if (report.type === "evening_summary") {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          {data.executiveSummary && (
            <div className="bg-[var(--color-primary-lighter)] border border-[var(--color-primary-light)] p-5 rounded-2xl">
              <h3 className="flex items-center gap-2 text-[var(--color-primary-dark)] font-black text-sm uppercase tracking-wider mb-2">
                <Activity size={16} /> Executive Summary
              </h3>
              <p className="text-gray-800 text-sm leading-relaxed font-medium">{data.executiveSummary}</p>
            </div>
          )}

          {data.taskHighlights && data.taskHighlights.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-gray-900 font-extrabold text-lg border-b border-gray-100 pb-2">
                <CheckCircle2 size={20} className="text-[var(--color-primary)]" /> Task Highlights & Progress
              </h3>
              <RenderList items={data.taskHighlights} />
            </div>
          )}

          {data.attendanceAndWorkforce && data.attendanceAndWorkforce.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-gray-900 font-extrabold text-lg border-b border-gray-100 pb-2">
                <Users size={20} className="text-blue-500" /> Attendance & Workforce
              </h3>
              <RenderList items={data.attendanceAndWorkforce} />
            </div>
          )}

          {data.blockersAndAlerts && data.blockersAndAlerts.length > 0 && (
            <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
              <h3 className="flex items-center gap-2 text-gray-900 font-extrabold text-lg mb-2">
                <AlertTriangle size={20} className="text-[var(--color-destructive)]" /> Blockers & Alerts
              </h3>
              <RenderList items={data.blockersAndAlerts} />
            </div>
          )}

          {data.employeeSpotlight && (
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-2xl shadow-sm">
              <div className="p-3 bg-white rounded-full shadow-sm text-orange-500 shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-orange-800 font-black text-sm uppercase tracking-wider mb-1">Employee Spotlight</h3>
                <p className="text-gray-800 text-sm font-medium leading-relaxed">{data.employeeSpotlight}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (report.type === "morning_brief") {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          {data.morningFocus && (
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white p-6 rounded-2xl shadow-md">
              <h3 className="flex items-center gap-2 text-white/90 font-black text-sm uppercase tracking-wider mb-2">
                <Sparkles size={16} /> Morning Focus
              </h3>
              <p className="text-lg font-medium leading-relaxed">{data.morningFocus}</p>
            </div>
          )}

          {data.priorityActionItems && data.priorityActionItems.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-gray-900 font-extrabold text-lg border-b border-gray-100 pb-2">
                <Target size={20} className="text-[var(--color-primary)]" /> Priority Action Items
              </h3>
              <RenderList items={data.priorityActionItems} />
            </div>
          )}

          {data.carryoverAlerts && data.carryoverAlerts.length > 0 && (
            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
              <h3 className="flex items-center gap-2 text-gray-900 font-extrabold text-lg mb-2">
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

  // ========================================================================
  // RENDER COMPONENT
  // ========================================================================
  const pinnedSessions = sessions.filter(s => s.isPinned);
  const recentSessions = sessions.filter(s => !s.isPinned);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-120px)] min-h-[600px] relative">
      
      {/* ---------------------------------------------------------------- */}
      {/* LEFT SIDEBAR (History & Navigation)                              */}
      {/* ---------------------------------------------------------------- */}
      <div className={`w-full md:w-80 lg:w-[22rem] bg-gray-50/50 border-r border-gray-200 flex flex-col shrink-0 absolute md:relative z-20 h-full transition-transform duration-300 ${showSidebarOnMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Header & Tabs */}
        <div className="p-5 md:p-6 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-[var(--color-primary-lighter)] rounded-xl border border-[var(--color-primary-light)]">
              <Bot size={24} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">CreatikAI Agent</h2>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online & Ready
              </div>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "chat" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Live Chat
            </button>
            <button 
              onClick={() => setActiveTab("reports")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "reports" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Daily Reports
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          
          {/* TAB: CHAT */}
          {activeTab === "chat" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <button 
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-gray-600 text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                <Plus size={16} /> New Chat
              </button>

              {isLoadingSessions ? (
                <div className="flex justify-center p-4"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
              ) : (
                <>
                  {/* Pinned Sessions */}
                  {pinnedSessions.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Pinned</h3>
                      <div className="space-y-1">
                        {pinnedSessions.map(session => (
                          <div 
                            key={session.id} 
                            onClick={() => handleSelectSession(session.id)} 
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-[var(--color-primary-lighter)] ring-1 ring-[var(--color-primary-light)]' : 'hover:bg-gray-100'}`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <Pin size={14} className="text-[var(--color-primary)] shrink-0 fill-current" />
                              <span className={`text-sm font-bold truncate ${activeSessionId === session.id ? 'text-[var(--color-primary-dark)]' : 'text-gray-700'}`}>{session.title}</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-gradient-to-l from-white pl-2">
                              <button onClick={(e) => handleTogglePin(e, session.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"><Pin size={14} className="fill-current" /></button>
                              <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2 mt-4">Recent</h3>
                    {recentSessions.length === 0 && pinnedSessions.length === 0 ? (
                      <p className="text-xs text-gray-400 px-2">No past conversations.</p>
                    ) : (
                      <div className="space-y-1">
                        {recentSessions.map(session => (
                          <div 
                            key={session.id} 
                            onClick={() => handleSelectSession(session.id)} 
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-[var(--color-primary-lighter)] ring-1 ring-[var(--color-primary-light)]' : 'hover:bg-gray-100'}`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <MessageSquare size={14} className="text-gray-400 shrink-0" />
                              <span className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-[var(--color-primary-dark)] font-bold' : 'text-gray-600'}`}>{session.title}</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-gradient-to-l from-white pl-2">
                              <button onClick={(e) => handleTogglePin(e, session.id)} className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] rounded-md"><Pin size={14} /></button>
                              <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-2 animate-in fade-in duration-300">
              {isLoadingReports ? (
                <div className="flex justify-center p-4"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
              ) : reports.length === 0 ? (
                <div className="text-center p-6 text-gray-500 text-sm font-medium">No reports generated yet.</div>
              ) : (
                reports.map((report) => {
                  const isSelected = selectedReport?.id === report.id;
                  const dateObj = new Date(report.reportDate);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const isMorning = report.type === 'morning_brief';
                  
                  return (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report);
                        setShowSidebarOnMobile(false);
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer group relative overflow-hidden ${
                        isSelected 
                          ? "bg-white border-[var(--color-primary)] shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-[var(--color-primary-light)]" 
                          : "bg-transparent border border-transparent hover:bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${
                          isMorning ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]'
                        }`}>
                          {report.type.replace('_', ' ')}
                        </span>
                        <ChevronRight size={16} className={isSelected ? "text-[var(--color-primary)]" : "text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"} />
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className={isSelected ? "text-[var(--color-primary)]" : ""} /> {formattedDate}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className={isSelected ? "text-[var(--color-primary)]" : ""} /> {formattedTime}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RIGHT WORKSPACE (Chat or Reader)                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 bg-white relative flex flex-col min-w-0">
        
        {/* Mobile Header Toggle (Only visible on small screens when sidebar is hidden) */}
        {!showSidebarOnMobile && (
          <div className="md:hidden flex items-center p-4 border-b border-gray-100 shrink-0 bg-white z-10 shadow-sm">
            <button 
              onClick={() => setShowSidebarOnMobile(true)}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[var(--color-primary)]"
            >
              <ArrowLeft size={18} /> Menu
            </button>
            <div className="flex-1 text-center font-bold text-gray-900 truncate px-4">
              {activeTab === "chat" ? (sessions.find(s => s.id === activeSessionId)?.title || "New Chat") : "Report Viewer"}
            </div>
          </div>
        )}

        {/* ======================= VIEW: CHAT ======================= */}
        {activeTab === "chat" ? (
          <>
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-[url('/noise.png')] bg-gray-50/50">
              
              {/* Welcome empty state */}
              {messages.length === 0 && !isLoadingMessages && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-[var(--color-primary-light)] mb-6">
                    <Sparkles size={28} className="text-[var(--color-primary)]" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 mb-2">How can I help?</h2>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    I'm your CRM assistant. I can fetch task reports, assign new tasks to employees, analyze productivity, or answer questions about your data.
                  </p>
                </div>
              )}

              {isLoadingMessages ? (
                <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-[var(--color-primary)]" /></div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex w-full mb-6 animate-in slide-in-from-bottom-2 ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 lg:gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        
                        {/* Avatar */}
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${isUser ? "bg-gray-900" : "bg-white border border-[var(--color-primary-light)]"}`}>
                          {isUser ? <User size={16} className="text-white" /> : <Bot size={20} className="text-[var(--color-primary)]" />}
                        </div>
                        
                        {/* Bubble */}
                        <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-gray-900 text-white rounded-tr-sm shadow-md" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"}`}>
                          {isUser ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1 prose-strong:text-[var(--color-primary-dark)]">
                              {formatChatMessage(msg.content)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex w-full justify-start mb-6 animate-in fade-in">
                  <div className="flex max-w-[80%] gap-3 lg:gap-4">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[var(--color-primary-light)]">
                      <Bot size={20} className="text-[var(--color-primary)]" />
                    </div>
                    <div className="px-5 py-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm h-[52px]">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 sm:p-6 bg-white border-t border-gray-100 shrink-0">
              <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[var(--color-primary-light)] focus-within:border-[var(--color-primary)] transition-all shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the agent to check tasks, query data, or analyze..."
                  className="w-full max-h-48 min-h-[44px] bg-transparent outline-none resize-none px-3 py-2.5 text-sm text-gray-800 custom-scrollbar"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="shrink-0 p-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-[var(--color-primary)] shadow-sm cursor-pointer"
                >
                  <Send size={18} className={inputValue.trim() && !isTyping ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                </button>
              </div>
              <div className="text-center mt-2.5 hidden sm:block">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Shift + Enter for new line • AI can execute CRM actions</span>
              </div>
            </div>
          </>
        ) : (

        /* ======================= VIEW: REPORTS ======================= */
          selectedReport ? (
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 text-[var(--color-primary)] mb-3">
                  <Activity size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Agent Payload</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
                  {selectedReport.type === 'evening_summary' ? "Operations & Attendance Report" : "Morning Priority Briefing"}
                </h1>
                <p className="text-gray-500 mb-8 text-sm font-medium border-b border-gray-100 pb-6">
                  Autonomous audit generated on {new Date(selectedReport.reportDate).toLocaleString()}
                </p>
                {renderStructuredReport(selectedReport)}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FileText size={48} className="mb-4 text-gray-200" />
              <p className="font-bold text-sm">Select a report from the timeline to view details.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}