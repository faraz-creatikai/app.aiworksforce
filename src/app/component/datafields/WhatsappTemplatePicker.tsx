'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { getFilteredWhatsapp, whatsappAllCustomer } from '@/store/masters/whatsapp/whatsapp';

type Kind = 'text' | 'image' | 'video' | 'document' | 'poll' | 'location';
type Tpl = {
    _id: string; name: string; body: string; description?: string | null; status?: string | null;
    category?: string | null; whatsappMediaType?: string | null; whatsappFileName?: string | null;
    whatsappImage?: any; whatsappLinkPreview?: any; whatsappLocation?: any; whatsappPoll?: any;
};

/* ───────── helpers ───────── */
const asJson = (v: any, fallback: any = null) => {
    if (v == null || v === '') return fallback;
    if (typeof v === 'string') { try { return JSON.parse(v) ?? fallback; } catch { return fallback; } }
    return v;
};
const filesOf = (t: Tpl): string[] => { const v = asJson(t.whatsappImage, []); return Array.isArray(v) ? v.filter(Boolean) : []; };
const pollOf = (t: Tpl) => { const p = asJson(t.whatsappPoll); return p?.name ? p : null; };
const locOf = (t: Tpl) => { const l = asJson(t.whatsappLocation); return l && l.lat != null && l.lng != null ? l : null; };
const linkOf = (t: Tpl) => { const l = asJson(t.whatsappLinkPreview); return l?.sourceUrl ? l : null; };

// Same rule as resolveMediaType() on the backend, so the preview matches what is actually sent
const kindOf = (t: Tpl): Kind => {
    const mt = t.whatsappMediaType;
    if ((mt === 'image' || mt === 'video' || mt === 'document') && filesOf(t)[0]) return mt;
    if (pollOf(t)) return 'poll';
    if (locOf(t)) return 'location';
    return 'text';
};

/* ───────── icons ───────── */
const Ic = ({ children, className = 'w-4 h-4' }: { children: React.ReactNode; className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
type P = { className?: string };
const I = {
    Close: (p: P) => <Ic {...p}><path d="M6 18L18 6M6 6l12 12" /></Ic>,
    Search: (p: P) => <Ic {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Ic>,
    Text: (p: P) => <Ic {...p}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="14" y2="18" /></Ic>,
    Image: (p: P) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></Ic>,
    Video: (p: P) => <Ic {...p}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></Ic>,
    Doc: (p: P) => <Ic {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></Ic>,
    Pin: (p: P) => <Ic {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></Ic>,
    Poll: (p: P) => <Ic {...p}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></Ic>,
    Send: ({ className = 'w-4 h-4' }: P) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>,
    Spinner: ({ className = 'w-4 h-4' }: P) => (
        <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    ),
};

const KINDS: Record<Kind, { label: string; icon: React.ComponentType<P>; tone: string }> = {
    text: { label: 'Text', icon: I.Text, tone: 'bg-gray-100 text-gray-600' },
    image: { label: 'Image', icon: I.Image, tone: 'bg-fuchsia-100 text-fuchsia-600' },
    video: { label: 'Video', icon: I.Video, tone: 'bg-pink-100 text-pink-600' },
    document: { label: 'Document', icon: I.Doc, tone: 'bg-indigo-100 text-indigo-600' },
    poll: { label: 'Poll', icon: I.Poll, tone: 'bg-amber-100 text-amber-600' },
    location: { label: 'Location', icon: I.Pin, tone: 'bg-teal-100 text-teal-600' },
};

/* ───────── placeholders: green = will be filled, amber = will be sent as typed ───────── */
const KNOWN = new Set(['Name', 'City', 'Campaign', 'ContactNumber', 'Email']);
const Placeholders = ({ text }: { text: string }) => (
    <>
        {text.split(/(\{\{[^{}]*\}\})/g).map((part, i) => {
            if (!/^\{\{[^{}]*\}\}$/.test(part)) return <React.Fragment key={i}>{part}</React.Fragment>;
            const key = part.slice(2, -2);
            const ok = KNOWN.has(key) || key.startsWith('CustomerFields.');
            return (
                <span
                    key={i}
                    title={ok ? 'Filled in for each customer' : 'Not recognised, will be sent exactly as written'}
                    className={`rounded px-1 font-medium ${ok ? 'bg-emerald-200/70 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}
                >
                    {part}
                </span>
            );
        })}
    </>
);

/* ───────── preview ───────── */
const Bubble = ({ children }: { children: React.ReactNode }) => (
    <div className="ml-auto w-fit max-w-[320px] px-3 py-1.5 shadow-sm rounded-2xl rounded-tr-sm bg-[#DCF8C6] text-[13px]">
        {children}
        <p className="text-[9.5px] text-gray-500 text-right mt-0.5">now ✓</p>
    </div>
);

const Preview = ({ t }: { t: Tpl }) => {
    const kind = kindOf(t);
    const url = filesOf(t)[0];
    const poll = pollOf(t);
    const loc = locOf(t);
    const link = linkOf(t);
    const body = t.body ? (
        <p className="text-gray-800 whitespace-pre-wrap break-words"><Placeholders text={t.body} /></p>
    ) : null;
    const fileName = t.whatsappFileName || url?.split('?')[0].split('/').pop() || 'Document';

    return (
        <div className="space-y-2">
            {kind === 'image' && (
                <Bubble>
                    <img src={url} alt="" className="w-72 max-h-72 object-cover rounded-xl mb-1" />
                    {body}
                </Bubble>
            )}

            {kind === 'video' && (
                <Bubble>
                    <video src={url} controls preload="metadata" className="w-72 h-44 rounded-xl mb-1 bg-black object-contain" />
                    {body}
                </Bubble>
            )}

            {kind === 'document' && (
                <Bubble>
                    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/5 hover:bg-black/10 rounded-xl p-2 mb-1 w-64">
                        <span className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0"><I.Doc /></span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-medium text-gray-800 truncate">{fileName}</span>
                            <span className="block text-[10px] text-[#128C7E] font-semibold">Open file</span>
                        </span>
                    </a>
                    {body}
                </Bubble>
            )}

            {kind === 'poll' && poll && (
                <Bubble>
                    <div className="w-64">
                        <p className="text-[13px] font-semibold text-gray-800 mb-1.5 break-words">📊 {poll.name}</p>
                        <div className="space-y-1">
                            {(poll.options || []).map((o: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 bg-black/5 rounded-lg px-2 py-1.5">
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                                    <span className="text-[12px] text-gray-700 truncate">{o}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10.5px] text-gray-500 mt-1.5">
                            {(poll.selectableCount || 1) > 1 ? 'Multiple answers allowed' : 'Select one'}
                        </p>
                    </div>
                </Bubble>
            )}

            {kind === 'location' && loc && (
                <>
                    <Bubble>
                        <div className="w-64">
                            <iframe
                                src={`https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed`}
                                loading="lazy"
                                className="w-full h-32 rounded-xl border-0 pointer-events-none"
                            />
                            {(loc.name || loc.address) && (
                                <span className="flex items-center gap-1.5 pt-1 text-[12px] font-medium text-gray-800">
                                    <I.Pin className="w-3.5 h-3.5 text-[#128C7E] shrink-0" />
                                    <span className="truncate">{loc.name || loc.address}</span>
                                </span>
                            )}
                        </div>
                    </Bubble>
                    {body && <Bubble>{body}</Bubble>}
                </>
            )}

            {kind === 'text' && (
                <Bubble>
                    {link && (
                        <a href={link.sourceUrl} target="_blank" rel="noreferrer" className="block w-64 rounded-xl overflow-hidden bg-black/5 mb-1">
                            {link.thumbnailUrl && <img src={link.thumbnailUrl} alt="" className="w-full h-32 object-cover" />}
                            <span className="block px-2 py-1.5">
                                <span className="block text-[12px] font-semibold text-gray-800 truncate">{link.title || link.sourceUrl}</span>
                                {link.body && <span className="block text-[11px] text-gray-500 line-clamp-2">{link.body}</span>}
                                <span className="block text-[10px] text-[#128C7E] truncate">{link.sourceUrl}</span>
                            </span>
                        </a>
                    )}
                    {body || <p className="text-gray-400 italic">Empty message</p>}
                </Bubble>
            )}

            {kind === 'poll' && t.body && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    Polls are sent on their own. The template text above the poll is not sent.
                </p>
            )}
        </div>
    );
};

/* ───────── picker ───────── */
export default function WhatsAppTemplatePicker({
    isOpen, onClose, targetIds, onSent,
}: {
    isOpen: boolean;
    onClose: () => void;
    targetIds: string[];
    onSent: (notice?: string) => void; // parent clears the selection and closes the picker
}) {
    const [templates, setTemplates] = useState<Tpl[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [kindFilter, setKindFilter] = useState<'all' | Kind>('all');
    const [category, setCategory] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    // reset when closed
    useEffect(() => {
        if (isOpen) return;
        setSearch(''); setDebounced(''); setKindFilter('all'); setCategory('all');
        setSelectedId(null); setError(''); setSending(false);
    }, [isOpen]);

    // debounce the search box
    useEffect(() => {
        const h = setTimeout(() => setDebounced(search.trim()), 350);
        return () => clearTimeout(h);
    }, [search]);

    // load WhatsApp templates (search runs on the server, other filters run here)
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        (async () => {
            setLoading(true); setLoadError('');
            const params = new URLSearchParams({ type: 'whatsapp', page: '1', limit: '100' });
            if (debounced) params.set('search', debounced);
            const res = await getFilteredWhatsapp(params.toString());
            if (cancelled) return;
            if (!res?.success) {
                setTemplates([]);
                setLoadError('Could not load templates.');
            } else {
                setTemplates((res.data || []).filter((t: Tpl) => t.status !== 'Inactive'));
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [isOpen, debounced, reloadKey]);

    const counts = useMemo(() => {
        const c: Partial<Record<Kind, number>> = {};
        templates.forEach((t) => { const k = kindOf(t); c[k] = (c[k] || 0) + 1; });
        return c;
    }, [templates]);

    const categories = useMemo(
        () => [...new Set(templates.map((t) => (t.category || '').trim()).filter(Boolean))],
        [templates]
    );

    const visible = useMemo(
        () => templates.filter((t) =>
            (kindFilter === 'all' || kindOf(t) === kindFilter) &&
            (category === 'all' || (t.category || '').trim() === category)
        ),
        [templates, kindFilter, category]
    );

    const selected = templates.find((t) => t._id === selectedId) || null;
    const n = targetIds.length;

    const handleSend = async () => {
        if (!selected || sending || !n) return;
        setSending(true); setError('');
        try {
            const res = await whatsappAllCustomer({ templateId: selected._id, customerIds: targetIds, sendToAll: false });
            if (!res) { setError('Could not reach the server. Please try again.'); return; }
            if (!res.success) { setError(res.message || 'Failed to send. Please try again.'); return; }

            const sent = res.sent ?? 0;
            if (sent < n) {
                const firstErr = res.results?.find((r: any) => r.status === 'failed')?.error;
                onSent(`Template sent to ${sent} of ${n} customers.${firstErr ? ` ${firstErr}` : ''}`);
            } else {
                onSent();
            }
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => { e.stopPropagation(); if (!sending) onClose(); }}
        >
            <div className="wa-panel w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* header */}
                <div className="px-4 py-3 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white flex items-center gap-3 shrink-0">
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm">Send a template</p>
                        <p className="text-[11px] text-emerald-50/80">To {n} customer{n === 1 ? '' : 's'}</p>
                    </div>
                    <button onClick={onClose} disabled={sending} aria-label="Close" className="p-2 text-white/80 hover:text-white disabled:opacity-40"><I.Close /></button>
                </div>

                <div className="flex-1 min-h-0 flex">
                    {/* ── left: filters + list ── */}
                    <div className="w-[320px] shrink-0 border-r border-gray-200 flex flex-col">
                        <div className="p-3 space-y-2 border-b border-gray-100">
                            <div className="relative">
                                <I.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search templates…"
                                    className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-[#25D366]"
                                />
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {(['all', ...(Object.keys(KINDS) as Kind[]).filter((k) => counts[k])] as ('all' | Kind)[]).map((k) => (
                                    <button
                                        key={k}
                                        onClick={() => setKindFilter(k)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${kindFilter === k ? 'bg-[#128C7E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {k === 'all' ? `All ${templates.length}` : `${KINDS[k].label} ${counts[k]}`}
                                    </button>
                                ))}
                            </div>

                            {categories.length > 0 && (
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-[#25D366] bg-white"
                                >
                                    <option value="all">All categories</option>
                                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <p className="p-4 text-xs text-gray-400 flex items-center gap-2"><I.Spinner /> Loading templates…</p>
                            ) : loadError ? (
                                <div className="p-4 text-xs text-red-500">
                                    {loadError}{' '}
                                    <button onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline">Retry</button>
                                </div>
                            ) : visible.length === 0 ? (
                                <p className="p-4 text-xs text-gray-400">No templates match.</p>
                            ) : (
                                visible.map((t) => {
                                    const kind = kindOf(t);
                                    const meta = KINDS[kind];
                                    const snippet = kind === 'poll' ? pollOf(t)?.name : kind === 'location' ? (locOf(t)?.name || t.body) : t.body;
                                    return (
                                        <button
                                            key={t._id}
                                            onClick={() => { setSelectedId(t._id); setError(''); }}
                                            className={`w-full flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-50 text-left hover:bg-gray-50 ${selectedId === t._id ? 'bg-emerald-50' : ''}`}
                                        >
                                            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.tone}`}><meta.icon /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[13px] font-semibold text-gray-800 truncate">{t.name}</span>
                                                    {t.category && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.category}</span>}
                                                </span>
                                                <span className="block text-[11.5px] text-gray-500 line-clamp-2 break-words">{snippet || meta.label}</span>
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── right: preview ── */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div
                            className="flex-1 min-h-0 overflow-y-auto p-5"
                            style={{ backgroundColor: '#ECE5DD', backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                        >
                            {selected ? (
                                <Preview t={selected} />
                            ) : (
                                <p className="h-full flex items-center justify-center text-sm text-gray-500">Select a template to preview it</p>
                            )}
                        </div>

                        {selected && (
                            <div className="shrink-0 px-4 py-2.5 border-t border-gray-100 bg-white text-xs text-gray-500">
                                <p className="font-semibold text-gray-700 truncate">{selected.name}</p>
                                {selected.description && <p className="truncate">{selected.description}</p>}
                                <p className="mt-0.5">
                                    <span className="px-1 rounded bg-emerald-200/70 text-emerald-900 font-medium">Green</span> placeholders are filled in per customer.{' '}
                                    <span className="px-1 rounded bg-amber-200 text-amber-900 font-medium">Amber</span> ones are sent exactly as written.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* footer */}
                <div className="shrink-0 border-t border-gray-100 p-3">
                    <button
                        onClick={handleSend}
                        disabled={!selected || sending || !n}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-gradient-to-r from-[#128C7E] to-[#25D366] hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                    >
                        {sending ? <><I.Spinner /> Sending…</> : <><I.Send /> Send to {n} customer{n === 1 ? '' : 's'}</>}
                    </button>
                    {sending && n > 1 && (
                        <p className="text-[11px] text-gray-500 mt-1.5 text-center">Sending one by one with a short delay. Messages appear in each chat as they go out.</p>
                    )}
                    {error && <p className="text-[11px] text-red-500 mt-1.5 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}