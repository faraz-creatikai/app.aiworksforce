"use client";

import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Scale, 
  BookOpen, 
  MessageSquare,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function CompanyPolicies() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 mt-4 pb-12">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-[var(--color-muted)] p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-lighter)] rounded-full blur-[80px] opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="w-20 h-20 shrink-0 bg-gradient-to-br from-[var(--color-primary-lighter)] to-white border border-[var(--color-primary-light)] rounded-2xl flex items-center justify-center shadow-inner relative z-10">
          <ShieldCheck size={40} className="text-[var(--color-primary)]" />
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary-lighter)]/50 text-[var(--color-primary-darker)] text-xs font-bold tracking-wide uppercase mb-3">
            <BookOpen size={14} /> Employee Handbook
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Company Guidelines & Policies
          </h1>
          <p className="text-[var(--color-gray)] text-base sm:text-lg max-w-2xl leading-relaxed">
            Everything you need to know about working at Creatik AI. Please review these official documents to understand our culture, expectations, and your benefits.
          </p>
        </div>
      </div>

      {/* --- AI ASSISTANT BANNER --- */}
      <div className="rounded-3xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-darker)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-white shadow-xl shadow-blue-900/10 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <Sparkles size={24} className="text-blue-100" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Too long; didn't read?</h3>
            <p className="text-sm text-blue-100 font-medium">Our HR AI Assistant has read every policy. Ask it anything about leave, ethics, or benefits.</p>
          </div>
        </div>
        
        <button className="shrink-0 bg-white text-[var(--color-primary-darker)] font-bold text-sm rounded-xl px-6 py-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10">
          <MessageSquare size={18} /> Ask AI Assistant
        </button>
      </div>

      {/* --- THE 2 CORE DOCUMENTS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Document 1 */}
        <div className="group bg-white border border-[var(--color-muted)] rounded-3xl p-6 hover:border-[var(--color-primary-light)] hover:shadow-xl hover:shadow-[var(--color-primary-lighter)] transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-blue-100">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">Code of Conduct</h3>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Updated Jan 2026 • 2.4 MB</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-8 relative z-10">
            Our comprehensive guide to workplace ethics, behavioral expectations, and mutual respect. This document outlines how we treat each other and our clients to maintain a healthy, productive environment.
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10">
            <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-lighter)]/50 px-3 py-1.5 rounded-lg">Required Reading</span>
            <button className="flex items-center gap-2 text-sm font-bold text-gray-600 group-hover:text-[var(--color-primary)] transition-colors">
              Download PDF <Download size={16} />
            </button>
          </div>
        </div>

        {/* Document 2 */}
        <div className="group bg-white border border-[var(--color-muted)] rounded-3xl p-6 hover:border-[var(--color-primary-light)] hover:shadow-xl hover:shadow-[var(--color-primary-lighter)] transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 shrink-0 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-100">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">Leave Policy 2026</h3>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Updated Mar 2026 • 1.1 MB</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-8 relative z-10">
            Everything regarding Paid Time Off (PTO), sick leaves, public holidays, and remote work guidelines. Learn how to correctly log your absences and manage your work-life balance.
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">Reference Material</span>
            <button className="flex items-center gap-2 text-sm font-bold text-gray-600 group-hover:text-[var(--color-primary)] transition-colors">
              Download PDF <Download size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* --- CORE VALUES / EXTRA CONTENT TO FILL PAGE --- */}
      <div className="pt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">Our Core Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-muted)] shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Scale size={20} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Integrity First</h3>
            <p className="text-sm text-gray-500 leading-relaxed">We act with honesty and transparency in every interaction, ensuring trust is built internally and with our clients.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-muted)] shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Respect & Inclusion</h3>
            <p className="text-sm text-gray-500 leading-relaxed">We foster a diverse environment where every voice is heard, valued, and treated with utmost professional respect.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-muted)] shadow-sm">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Innovation Driven</h3>
            <p className="text-sm text-gray-500 leading-relaxed">As an AI-first company, we continuously adapt, learn, and push boundaries to automate and improve workflows.</p>
          </div>

        </div>
      </div>

      {/* --- SUPPORT FOOTER --- */}
      <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="font-bold text-gray-900">Still have questions?</p>
          <p className="text-sm text-gray-500 mt-1">If the AI assistant can't help, our Human Resources team is here for you.</p>
        </div>
        <Link href="https://creatikai.com/resourses/contact-us" target="_blank" className="shrink-0 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl px-5 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
          Contact HR <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
}