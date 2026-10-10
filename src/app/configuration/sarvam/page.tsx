"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, CheckCircle, X, Bot, FileText } from 'lucide-react';

// Assuming you exported these from your api service file:
import {
    getCallingConfigs,
    createCallingConfig,
    updateCallingConfig,
    deleteCallingConfig,
    setActiveCallingConfig,
} from '@/store/sarvam/sarvam'; // Adjust path as needed
import { CallingAgentConfigPayload, CallingAgentConfigResponse } from '@/store/sarvam/sarvam.interface';

// --- SHARED STYLES ---
// Neutral text is black/gray; the brand color (--color-primary*) is only used for
// actions, the active state and focus rings.
const labelCls = "block text-xs font-medium text-gray-700 mb-1";
const inputBase =
    "w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-shadow";
const inputCls = `${inputBase} px-3 py-1.5 md:py-2`;
const iconInputCls = `${inputBase} pl-9 pr-3 py-1.5 md:py-2`;

// --- AI AGENT AVATAR (taskbot.png in /public) ---
const AgentAvatar = ({
    className = "w-12 h-12",
    imgClassName = "w-9 h-9",
}: {
    className?: string;
    imgClassName?: string;
}) => (
    <span
        className={`${className} rounded-full bg-[var(--color-primary-lighter)] border border-[var(--color-primary-light)] flex items-center justify-center shrink-0 overflow-hidden`}
    >
        <img src="/taskbot.png" alt="AI agent" className={`${imgClassName} object-contain`} />
    </span>
);

// --- LABEL / VALUE ROW inside a card ---
const DetailRow = ({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) => (
    <div className="flex items-center justify-between gap-3 py-2">
        <dt className="text-xs font-medium text-gray-500 shrink-0">{label}</dt>
        <dd className="text-sm font-mono text-gray-900 truncate text-right min-w-0" title={title}>
            {value}
        </dd>
    </div>
);

export default function SarvamConfigManager() {
    const [configs, setConfigs] = useState<CallingAgentConfigResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Selected Data
    const [selectedConfig, setSelectedConfig] = useState<CallingAgentConfigResponse | null>(null);
    const [formData, setFormData] = useState<CallingAgentConfigPayload | any>({
        name: '', description: '', // NEW FIELDS
        apiKey: '', orgId: '', workspaceId: '', appId: '',
        appVersion: 12, connectionId: '', callerNumber: '', transferNumber: '', isActive: false
    });

    // Load Data
    const fetchConfigs = async () => {
        setIsLoading(true);
        const data = await getCallingConfigs();
        setConfigs(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    // Handlers
    const handleOpenAdd = () => {
        setSelectedConfig(null);
        setFormData({
            name: '', description: '',
            apiKey: '', orgId: '', workspaceId: '', appId: '',
            appVersion: 12, connectionId: '', callerNumber: '', transferNumber: '', isActive: configs.length === 0
        });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (config: CallingAgentConfigResponse) => {
        setSelectedConfig(config);
        setFormData({ ...config });
        setIsFormOpen(true);
    };

    const handleOpenDelete = (config: CallingAgentConfigResponse) => {
        setSelectedConfig(config);
        setIsDeleteOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading(selectedConfig ? "Updating config..." : "Saving config...");

        try {
            let success = false;
            // Ensure appVersion is sent as a number even if it was temporarily stringified
            const payloadToSubmit = { ...formData, appVersion: Number(formData.appVersion) };

            if (selectedConfig) {
                const res = await updateCallingConfig(selectedConfig.id, payloadToSubmit);
                if (res) success = true;
            } else {
                const res = await createCallingConfig(payloadToSubmit);
                if (res) success = true;
            }

            if (success) {
                toast.success(`Configuration ${selectedConfig ? 'updated' : 'added'} successfully!`, { id: toastId });
                setIsFormOpen(false);
                fetchConfigs();
            } else {
                toast.error("Action failed. Please check your inputs.", { id: toastId });
            }
        } catch (error) {
            toast.error("Something went wrong.", { id: toastId });
        }
    };

    const handleDelete = async () => {
        if (!selectedConfig) return;
        const toastId = toast.loading("Deleting configuration...");

        const success = await deleteCallingConfig(selectedConfig.id);
        if (success) {
            toast.success("Configuration deleted.", { id: toastId });
            setIsDeleteOpen(false);
            fetchConfigs();
        } else {
            toast.error("Failed to delete configuration.", { id: toastId });
        }
    };

    const handleSetActive = async (id: string) => {
        const toastId = toast.loading("Setting active agent...");
        const success = await setActiveCallingConfig(id);
        if (success) {
            toast.success("Active agent switched successfully!", { id: toastId });
            fetchConfigs();
        } else {
            toast.error("Failed to switch active agent.", { id: toastId });
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-white sm:rounded-2xl p-3 md:p-6 text-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 md:mb-6 gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Sarvam AI agents</h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage your voice agent credentials and active versions.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center cursor-pointer gap-1.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus size={18} /> Add agent
                </button>
            </div>

            {/* List / Cards */}
            {isLoading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div></div>
            ) : configs.length === 0 ? (
                <div className="text-center py-14 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
                    <AgentAvatar className="w-16 h-16 mx-auto mb-3" imgClassName="w-12 h-12" />
                    <h3 className="text-sm font-bold text-gray-900">No agents configured</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Add your first Sarvam credential to start calling.</p>
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus size={16} /> Add agent
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {configs.map((config) => (
                        <div
                            key={config.id}
                            className={`flex flex-col bg-white rounded-2xl border p-4 transition-shadow hover:shadow-md ${config.isActive
                                ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)] shadow-sm'
                                : 'border-gray-200 shadow-sm'
                                }`}
                        >
                            {/* Avatar, name, description and actions */}
                            <div className="flex items-start gap-3">
                                <AgentAvatar />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-900 truncate">
                                        {config.name || "Unnamed agent"}
                                    </h3>
                                    {config.description ? (
                                        <p className="text-xs text-gray-500 leading-snug line-clamp-2 mt-0.5">{config.description}</p>
                                    ) : (
                                        <p className="text-xs italic text-gray-400 mt-0.5">No description provided.</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-0.5 -mr-1.5 -mt-1">
                                    <button
                                        onClick={() => handleOpenEdit(config)}
                                        aria-label={`Edit ${config.name || "agent"}`}
                                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenDelete(config)}
                                        aria-label={`Delete ${config.name || "agent"}`}
                                        className="p-1.5 text-gray-400 hover:text-[var(--color-destructive)] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Details */}
                            <dl className="mt-4 border-t border-gray-100 divide-y divide-gray-100">
                                <DetailRow label="App ID" value={config.appId} title={config.appId} />
                                <DetailRow label="App version" value={`v${config.appVersion}`} />
                                <DetailRow label="Caller number" value={config.callerNumber} />
                                <DetailRow label="Transfer number" value={config.transferNumber || "—"} />
                                <DetailRow label="API key" value={`...${config.apiKey.slice(-5)}`} />
                            </dl>

                            {/* Status / action (pinned to the bottom so cards line up) */}
                            <div className="mt-auto pt-4">
                                {config.isActive ? (
                                    <div className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary-lighter)] text-[var(--color-primary)] border border-[var(--color-primary-light)]">
                                        <CheckCircle size={14} /> Active agent
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSetActive(config.id)}
                                        className="w-full py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 bg-white hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lighter)] transition-colors cursor-pointer"
                                    >
                                        Set as active
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FORM MODAL (Add/Edit) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm">
                    {/* WIDTH: max-w-lg on phones/small screens, max-w-3xl from md (768px) up */}
                    <div className="bg-white w-full max-w-lg md:max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[96dvh]">

                        {/* HEADER */}
                        <div className="shrink-0 flex justify-between items-center gap-3 px-4 py-3 md:px-5 md:py-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center gap-3 min-w-0">
                                <AgentAvatar className="w-10 h-10" imgClassName="w-7 h-7" />
                                <div className="min-w-0">
                                    <h2 className="text-base md:text-lg font-extrabold text-gray-900 leading-tight">
                                        {selectedConfig ? 'Edit agent config' : 'New agent config'}
                                    </h2>
                                    <p className="text-xs text-gray-500 hidden sm:block">Credentials and numbers for this voice agent.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                aria-label="Close"
                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* The form is a flex column: scrolling fields on top, fixed footer at the bottom */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

                            {/* SCROLLING FIELDS (padding and scroll live here) */}
                            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 space-y-2.5 md:space-y-4 custom-scrollbar bg-white">
                                {/* GRID: 1 column on phones, 2 on sm, 3 on md and up */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

                                    {/* UI Name & Description Fields (side by side on md+) */}
                                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                                        <label className={labelCls}>Agent name <span className="text-[var(--color-destructive)]">*</span></label>
                                        <div className="relative">
                                            <Bot size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={iconInputCls} placeholder="e.g. Rahul - Sales Team" />
                                        </div>
                                    </div>

                                    <div className="col-span-1 sm:col-span-2 md:col-span-2">
                                        <label className={labelCls}>Description (optional)</label>
                                        <div className="relative">
                                            <FileText size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${iconInputCls} min-h-[60px] md:min-h-[38px] resize-none`} placeholder="e.g. Hindi speaking, aggressive pitch..." />
                                        </div>
                                    </div>

                                    {/* Sarvam API Fields */}
                                    <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                        <label className={labelCls}>API key <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input required type="text" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className={inputCls} placeholder="sk_samvaad_..." />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Org ID <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input required type="text" value={formData.orgId} onChange={(e) => setFormData({ ...formData, orgId: e.target.value })} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Workspace ID <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input required type="text" value={formData.workspaceId} onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>App ID <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input required type="text" value={formData.appId} onChange={(e) => setFormData({ ...formData, appId: e.target.value })} className={inputCls} placeholder="Agent-Name-..." />
                                    </div>

                                    {/* THE FIX IS HERE */}
                                    <div>
                                        <label className={labelCls}>App version <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={formData.appVersion || ''}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                setFormData({ ...formData, appVersion: isNaN(val) ? '' : val });
                                            }}
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Connection ID <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input required type="text" value={formData.connectionId} onChange={(e) => setFormData({ ...formData, connectionId: e.target.value })} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Caller number <span className="text-[var(--color-destructive)]">*</span></label>
                                        <input required type="text" value={formData.callerNumber} onChange={(e) => setFormData({ ...formData, callerNumber: e.target.value })} className={inputCls} placeholder="+91..." />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Transfer number</label>
                                        <input type="text" value={formData.transferNumber} onChange={(e) => setFormData({ ...formData, transferNumber: e.target.value })} className={inputCls} placeholder="+91..." />
                                    </div>

                                    {/* Shares the last row with Transfer number instead of adding another row */}
                                    {!selectedConfig?.isActive && (
                                        <label className="col-span-1 sm:col-span-1 md:col-span-2 flex items-center gap-2 pt-1 sm:pt-0 sm:self-end sm:pb-2 cursor-pointer">
                                            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 accent-[var(--color-primary)] cursor-pointer" />
                                            <span className="text-xs md:text-sm font-medium text-gray-700">Set as active agent immediately</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER: outside the scroll area, so it always sits on the bottom edge.
                                pb-[calc(...)] keeps the buttons clear of the iPhone home bar. */}
                            <div className="shrink-0 flex gap-2 px-4 pt-3 md:px-5 md:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-200 bg-gray-50">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 md:flex-none md:ml-auto px-4 md:px-6 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 md:flex-none px-4 md:px-6 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm cursor-pointer">
                                    {selectedConfig ? 'Save changes' : 'Add agent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteOpen && selectedConfig && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden p-5 md:p-6 text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="text-[var(--color-destructive)]" size={22} />
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Delete configuration?</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Are you sure you want to delete the configuration for <strong className="text-gray-900">{selectedConfig.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-[var(--color-destructive)] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}