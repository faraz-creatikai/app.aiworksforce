"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
// Update this import to wherever you saved your API functions:
import { getCallingConfigs, setActiveCallingConfig } from "@/store/sarvam/sarvam";
import { CallingAgentConfigResponse } from "@/store/sarvam/sarvam.interface";

// --- DROPDOWN PLACEMENT SETTINGS ---
const MENU_GAP = 8;          // space between the button and the menu
const VIEWPORT_MARGIN = 8;   // the menu never gets closer than this to a screen edge
const LIST_MAX_HEIGHT = 300; // the agent list scrolls after this height
const MENU_MIN_HEIGHT = 120; // when space is very tight, never shrink the menu below this

// useLayoutEffect warns during server rendering, so fall back to useEffect there
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type MenuPosition = {
    vertical: "below" | "above";               // opens under the button, or over it
    horizontal: "extends-left" | "extends-right"; // right edges aligned (grows left), or left edges aligned (grows right)
    left: number;
    width: number;
    maxHeight: number;
    top?: number;    // used when opening below
    bottom?: number; // used when opening above
};

export default function CallingAgentPicker({ onSwitch }: { onSwitch?: () => void }) {
    const [configs, setConfigs] = useState<CallingAgentConfigResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [position, setPosition] = useState<MenuPosition | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null); // wrapper (keeps the original layout)
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Fetch configs on mount
    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setIsLoading(true);
        try {
            const data = await getCallingConfigs();
            setConfigs(data || []);
        } catch (error) {
            console.error("Failed to load agents", error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Works out where the menu fits, using the real space around the button.
     *
     * Vertical:   below the button if it fits, otherwise above it. If it fits in neither,
     *             it takes the side with more room and the list scrolls inside.
     * Horizontal: right edges aligned (menu grows to the left) if it fits, otherwise left
     *             edges aligned (menu grows to the right). If neither fits, it is pushed
     *             back inside the screen.
     *
     * That gives all four corners: below-left, below-right, above-left, above-right.
     */
    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        const menu = menuRef.current;
        const header = headerRef.current;
        const list = listRef.current;
        if (!trigger || !menu || !header || !list) return;

        const t = trigger.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Width first: the height depends on how the descriptions wrap at this width
        const width = Math.min(vw >= 640 ? 320 : 280, vw - VIEWPORT_MARGIN * 2);
        menu.style.width = `${width}px`;

        // Height the menu wants (header + list + the two 1px borders)
        const naturalHeight = header.offsetHeight + Math.min(list.scrollHeight, LIST_MAX_HEIGHT) + 2;

        // ---- vertical ----
        const spaceBelow = vh - t.bottom - MENU_GAP - VIEWPORT_MARGIN;
        const spaceAbove = t.top - MENU_GAP - VIEWPORT_MARGIN;

        let vertical: MenuPosition["vertical"];
        if (naturalHeight <= spaceBelow) vertical = "below";
        else if (naturalHeight <= spaceAbove) vertical = "above";
        else vertical = spaceBelow >= spaceAbove ? "below" : "above";

        const available = vertical === "below" ? spaceBelow : spaceAbove;
        const maxHeight = Math.max(MENU_MIN_HEIGHT, Math.min(naturalHeight, available));

        // ---- horizontal ----
        const fitsGrowingLeft = t.right - width >= VIEWPORT_MARGIN;
        const fitsGrowingRight = t.left + width <= vw - VIEWPORT_MARGIN;

        let horizontal: MenuPosition["horizontal"];
        let left: number;
        if (fitsGrowingLeft) {
            horizontal = "extends-left";
            left = t.right - width;
        } else if (fitsGrowingRight) {
            horizontal = "extends-right";
            left = t.left;
        } else {
            // Not enough room either way: keep it fully on screen, leaning toward the button's side
            horizontal = t.left + t.width / 2 < vw / 2 ? "extends-right" : "extends-left";
            left = Math.min(Math.max(t.left, VIEWPORT_MARGIN), vw - width - VIEWPORT_MARGIN);
        }

        const next: MenuPosition = {
            vertical,
            horizontal,
            left: Math.round(left),
            width,
            maxHeight: Math.round(maxHeight),
            ...(vertical === "below"
                ? { top: Math.round(t.bottom + MENU_GAP) }
                : { bottom: Math.round(vh - t.top + MENU_GAP) }),
        };

        // Only update state when something actually changed (avoids pointless re-renders on scroll)
        setPosition((prev) =>
            prev &&
                prev.vertical === next.vertical &&
                prev.horizontal === next.horizontal &&
                prev.left === next.left &&
                prev.width === next.width &&
                prev.maxHeight === next.maxHeight &&
                prev.top === next.top &&
                prev.bottom === next.bottom
                ? prev
                : next
        );
    }, []);

    // Measure right after the menu appears (before the browser paints, so it never jumps)
    useIsoLayoutEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen, configs, updatePosition]);

    // Forget the old position when closed, so every open measures fresh
    useEffect(() => {
        if (!isOpen) setPosition(null);
    }, [isOpen]);

    // Re-place the menu if the window resizes, the phone rotates, or anything scrolls
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener("resize", updatePosition);
        window.addEventListener("orientationchange", updatePosition);
        window.addEventListener("scroll", updatePosition, true); // capture: also catches inner scroll areas
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("orientationchange", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    // Close when clicking outside (the menu lives in a portal, so check it separately) or on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current?.contains(target) || menuRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const activeAgent = configs.find(c => c.isActive);

    const handleSelect = async (id: string) => {
        if (activeAgent?.id === id) {
            setIsOpen(false);
            return;
        }

        setIsSwitching(true);
        try {
            const success = await setActiveCallingConfig(id);
            if (success) {
                toast.success("Active AI Agent switched successfully!");
                await loadConfigs(); // Reload to get updated active status
                if (onSwitch) onSwitch(); // TRIGGER FULL PAGE REFRESH IN PARENT
            } else {
                toast.error("Failed to switch active agent.");
            }
        } catch (error) {
            toast.error("An error occurred while switching agents.");
        } finally {
            setIsSwitching(false);
            setIsOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Loading agents...
            </div>
        );
    }

    if (configs.length === 0) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
                {/* <Bot size={14} /> */} <img src="/taskbot.png" alt="Agent" className="w-6 h-6" /> No Agents Configured
            </div>
        );
    }

    // First pass (position not known yet): the menu is drawn invisibly so it can be measured.
    const menuStyle: React.CSSProperties = position
        ? {
            position: "fixed",
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
            ...(position.vertical === "below" ? { top: position.top } : { bottom: position.bottom }),
        }
        : { position: "fixed", top: 0, left: 0, visibility: "hidden" };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* TRIGGER BUTTON */}
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSwitching}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="flex items-center justify-between gap-3 min-w-[200px] w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 hover:border-[var(--color-primary)] rounded-xl shadow-sm transition-all disabled:opacity-70 cursor-pointer"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        {/*  <Bot size={14} /> */}<img src="/taskbot.png" alt="Agent" className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-0.5">Active Agent</span>
                        <span className="text-sm font-extrabold text-gray-800 truncate max-w-[140px] leading-none">
                            {isSwitching ? "Switching..." : activeAgent ? activeAgent.name : "Select Agent"}
                        </span>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* DROPDOWN MENU
                Drawn in a portal with fixed positioning, so a parent with overflow-hidden
                (or a sticky/transformed header) can never clip it. */}
            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={menuStyle}
                        data-placement={position ? `${position.vertical}-${position.horizontal}` : undefined}
                        className="z-[100] flex flex-col bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden"
                    >
                        <div ref={headerRef} className="shrink-0 p-3 bg-gray-50 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Agents</h3>
                        </div>
                        <div
                            ref={listRef}
                            style={{ maxHeight: LIST_MAX_HEIGHT }}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-2 space-y-1"
                        >
                            {configs.map((config) => (
                                <button
                                    key={config.id}
                                    onClick={() => handleSelect(config.id)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${config.isActive
                                        ? "bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)] border shadow-sm"
                                        : "bg-white hover:bg-gray-50 border border-transparent"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.isActive ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {/* <Bot size={14} /> */}
                                        <img src="/taskbot.png" alt="Agent" className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className={`text-sm font-bold truncate ${config.isActive ? "text-[var(--color-primary-dark)]" : "text-gray-800"}`}>
                                                {config.name}
                                            </span>
                                            {config.isActive && <Check size={14} className="text-[var(--color-primary)] shrink-0 ml-2" />}
                                        </div>
                                        {config.description && (
                                            <span className="block text-[11px] text-gray-500 leading-snug line-clamp-2">
                                                {config.description}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}