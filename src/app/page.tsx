"use client";

import Link from "next/link";
import BrandLogo from "@/app/component/labels/BrandLogo";
import {
  ShieldCheck,
  UserCircle,
  Briefcase,
  Sparkles,
  ArrowRight,
  Clock3,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";

const AI_AGENTS = [
  {
    icon: Clock3,
    label: "Smart workflows",
    detail: "Automates repetitive tasks and flags process gaps before they become a problem.",
  },
  {
    icon: ClipboardCheck,
    label: "Intelligent triage",
    detail: "Checks every team and client request against business rules automatically.",
  },
  {
    icon: MessageCircle,
    label: "AI chatbot",
    detail: "Answers routine policy and operational questions instantly, day or night.",
  },
];

/**
 * One theme object per portal so the card markup is written once.
 * Every colour comes from the existing CSS variables (or the original slate console gradient).
 */
const PORTALS = [
  {
    href: "/dashboard",
    icon: ShieldCheck,
    title: "CRM portal",
    audience: "For management & core team",
    description:
      "Run business operations from one screen. Manage clients, review team performance and automate workflows.",
    features: ["Client & lead management", "Team analytics & reports", "AI-prioritized alerts"],
    cta: "Enter CRM portal",
    theme: {
      card: "border-white/10 text-white hover:shadow-[0_0_40px_-8px_var(--color-primary)]",
      style: { background: "linear-gradient(155deg, #0f172a 0%, #1e293b 100%)" },
      glow: "var(--color-primary)",
      iconWrap: "bg-white/10 border border-white/10",
      icon: "text-blue-300",
      audience: "text-blue-300",
      desc: "text-slate-300",
      dot: "bg-blue-300",
      list: "text-slate-300",
      cta: "text-white",
      title: "text-white",
    },
  },
    {
    href: "/client/login",
    icon: Briefcase,
    title: "Client portal",
    audience: "For clients",
    description:
      "Follow your projects, review invoices and message your team, all in one secure place.",
    features: ["Track project progress", "View invoices & payments", "Message your team"],
    cta: "Enter client portal",
    theme: {
      card: "bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)] hover:shadow-xl hover:shadow-[var(--color-primary-light)]/60",
      style: undefined,
      glow: "var(--color-primary-light)",
      iconWrap: "bg-white",
      icon: "text-[var(--color-primary)]",
      audience: "text-[var(--color-primary)]",
      desc: "text-gray-600",
      dot: "bg-[var(--color-primary)]",
      list: "text-gray-600",
      cta: "text-[var(--color-primary)]",
      title: "text-gray-900",
    },
  },
  {
    href: "/employee/login",
    icon: UserCircle,
    title: "Staff workspace",
    audience: "For employees",
    description:
      "Clock in, track your hours, request time off and ask the AI assistant anything, from your PTO balance to company policy.",
    features: ["Clock in & track hours", "Request & follow leave", "Ask the AI assistant anytime"],
    cta: "Enter staff workspace",
    theme: {
      card: "bg-white border-gray-100 shadow-lg shadow-gray-200/50 hover:border-[var(--color-primary-light)] hover:shadow-xl",
      style: undefined,
      glow: "var(--color-primary-lighter)",
      iconWrap: "bg-[var(--color-primary-lighter)]",
      icon: "text-[var(--color-primary)]",
      audience: "text-[var(--color-primary)]",
      desc: "text-gray-500",
      dot: "bg-[var(--color-primary)]",
      list: "text-gray-500",
      cta: "text-[var(--color-primary)]",
      title: "text-gray-900",
    },
  },

];

export default function PortalSelectionPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#f8fafc] font-sans">
      {/* --- BACKGROUND DECORATIONS --- */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-[380px] w-[380px] rounded-full opacity-50 blur-[110px]"
        style={{ background: "var(--color-primary-light)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-[440px] w-[440px] rounded-full opacity-40 blur-[130px]"
        style={{ background: "var(--color-accent)" }}
      />

      {/* --- TOP BAR --- */}
      <header className="relative z-10 flex w-full items-center justify-between px-4 py-3 sm:px-10 sm:py-5">
        <BrandLogo variant="text" className="h-9 w-auto object-contain sm:h-12" />
        <a
          href="https://aiworksforce.com/company/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-500 transition-colors hover:text-[var(--color-primary)]"
        >
          Trouble signing in?
        </a>
      </header>

      {/* --- MAIN: hero + portal panel, sized to fit one screen --- */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-2 sm:px-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Hero */}
        <div className="mb-6 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="space-y-3 md:space-y-4">
           {/*  <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-1.5 text-sm font-semibold text-gray-600 shadow-sm">
              <Sparkles size={15} className="text-[var(--color-primary)]" />
              Business management, run partly by AI
            </div> */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
              One platform.
              <br />
              <span className="text-[var(--color-primary)]">Three portals.</span>
            </h1>
          </div>
          <p className="max-w-md text-base font-medium leading-relaxed text-gray-600 md:pb-1 md:text-right md:text-lg">
            Choose the portal that matches your role. AI agents quietly handle
            routine workflows in between.
          </p>
        </div>

        {/* Portal panel: 3 columns on md+, compact stacked rows on mobile */}
        <nav
          aria-label="Choose a portal"
          className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6"
        >
          {PORTALS.map(({ href, icon: Icon, title, audience, description, features, cta, theme: t }) => (
            <Link
              key={href}
              href={href}
              style={t.style}
              className={`group relative flex flex-row items-center gap-4 overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] md:flex-col md:items-stretch md:gap-0 md:rounded-3xl md:p-8 ${t.card}`}
            >
              <div
                className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-30 blur-[70px]"
                style={{ background: t.glow }}
              />

              <div
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl md:mb-7 md:h-14 md:w-14 md:rounded-2xl ${t.iconWrap}`}
              >
                <Icon size={26} className={t.icon} />
              </div>

              <div className="relative flex min-w-0 flex-1 flex-col">
                <p className={`text-xs font-semibold md:mb-1 md:text-sm ${t.audience}`}>{audience}</p>
                <h2 className={`mb-1 text-lg font-bold md:mb-3 md:text-2xl ${t.title}`}>{title}</h2>
                <p className={`line-clamp-2 text-sm leading-relaxed md:mb-6 md:line-clamp-none md:flex-1 ${t.desc}`}>
                  {description}
                </p>

                <ul className={`mb-6 hidden space-y-2 text-sm md:block ${t.list}`}>
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className={`h-1 w-1 rounded-full ${t.dot}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div
                  className={`hidden items-center gap-2 font-bold transition-all duration-300 group-hover:gap-3 md:flex ${t.cta}`}
                >
                  {cta} <ArrowRight size={18} />
                </div>
              </div>

              {/* Mobile-only affordance */}
              <ArrowRight
                size={20}
                className={`relative shrink-0 md:hidden ${t.cta}`}
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>
      </main>

      {/* --- FOOTER: AI agent strip (desktop) + copyright --- */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-10 md:pt-20">
        <p className="mb-4 text-center text-sm font-semibold text-gray-500">
          Working quietly in the background
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {AI_AGENTS.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white/70 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-lighter)]">
                <Icon size={18} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm font-medium text-gray-400">
          Not sure which one is yours? Management and core team use the CRM portal, employees use
          the staff workspace, and clients use the client portal.
        </p>
        <p className="mt-6 text-center text-sm font-bold text-gray-400">
          Copyright &copy;2026 Aiworksforce. All rights reserved.
        </p>
      </footer>
    </div>
  );
}