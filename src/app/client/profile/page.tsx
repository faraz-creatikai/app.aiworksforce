"use client";

import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { getCustomerById } from "@/store/customer"; 
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  Loader2,
  AlertCircle,
  Link as LinkIcon
} from "lucide-react";

// --- UTILITY ---
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const getInitials = (name?: string) => {
  if (!name) return "CL";
  return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase()).join("");
};

// 🚨 THE FIX: Safe extractor for fields that might be an object { _id, Name } or a flat string
const getFieldValue = (val: any) => {
  if (!val) return "N/A";
  if (typeof val === "object") {
    return val.Name && val.Name.trim() !== "" ? val.Name : "N/A";
  }
  return String(val).trim() !== "" ? String(val) : "N/A";
};

export default function ClientProfilePage() {
  const { customer } = useCustomerAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!customer?.id) return;
      
      setIsLoading(true);
      try {
        const res = await getCustomerById(customer.id);
        const data = res?.data || res;
        if (data) {
          setProfileData(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [customer?.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 size={40} className="animate-spin text-[var(--color-primary)] mb-4" />
        <p className="text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center max-w-2xl mx-auto mt-6">
        <AlertCircle size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-500">We couldn't load your profile details. Please contact your account manager.</p>
      </div>
    );
  }

  // Safely parse the profile image
  let avatarUrl = "";
  try {
    if (profileData.CustomerImage) {
      const parsed = typeof profileData.CustomerImage === "string" 
        ? JSON.parse(profileData.CustomerImage) 
        : profileData.CustomerImage;
      if (Array.isArray(parsed) && parsed.length > 0) {
        avatarUrl = parsed[0];
      }
    }
  } catch (error) {
    console.error("Error parsing image", error);
  }

  const safeName = profileData.customerName || "Client";

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary-darker)] tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          View your personal information and account details.
        </p>
      </div>

      {/* HERO / PROFILE CARD */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] w-full opacity-20" />
        
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 -mt-16 sm:-mt-12 mb-6 text-center sm:text-left">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={safeName} 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white shrink-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] flex items-center justify-center text-4xl font-black shrink-0">
                {getInitials(safeName)}
              </div>
            )}
            
            <div className="flex-1 pb-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{safeName}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm font-medium text-gray-500">
                {profileData.Email && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Mail size={14} className="text-gray-400" /> {profileData.Email}
                  </span>
                )}
                {profileData.ContactNumber && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Phone size={14} className="text-gray-400" /> {profileData.ContactNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LOCATION & CONTACT */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MapPin size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Location & Details</h3>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">City</p>
                {/* 🚨 SAFE EXTRACTOR APPLIED HERE */}
                <p className="font-semibold text-gray-800">{getFieldValue(profileData.City)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                {/* 🚨 SAFE EXTRACTOR APPLIED HERE */}
                <p className="font-semibold text-gray-800">{getFieldValue(profileData.Location)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Address</p>
                <p className="font-semibold text-gray-800 leading-relaxed">{getFieldValue(profileData.Adderess)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT & PROJECT INFO */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Briefcase size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Project Classification</h3>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Created</p>
                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(profileData.createdAt)}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Project Type</p>
                {/* 🚨 SAFE EXTRACTOR APPLIED HERE */}
                <p className="font-semibold text-gray-800">{getFieldValue(profileData.CustomerType)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Campaign / Dept</p>
                {/* 🚨 SAFE EXTRACTOR APPLIED HERE */}
                <p className="font-semibold text-gray-800">{getFieldValue(profileData.Campaign)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Client ID</p>
                <p className="font-semibold text-gray-800">{getFieldValue(profileData.ClientId)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION OR NOTES */}
        {(profileData.Description || profileData.URL) && (
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Additional Information</h3>
            </div>
            
            <div className="space-y-5">
              {profileData.URL && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Project Link / URL</p>
                  <a 
                    href={profileData.URL} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    <LinkIcon size={14} /> {profileData.URL}
                  </a>
                </div>
              )}
              
              {profileData.Description && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes & Requirements</p>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {profileData.Description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
      
    </div>
  );
}