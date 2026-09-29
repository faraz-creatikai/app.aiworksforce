"use client";

import { useEffect, useState } from "react";
import { useEmployeeAuth } from "@/context/EmployeeAuthContext";

import { Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { getCustomerById } from "@/store/customer";
import { getEmployeeById } from "@/store/attendance/attendance";

export default function EmployeeProfile() {
  const { employee } = useEmployeeAuth(); // Get the ID from context
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!employee?.id) return;
      
      const res = await getEmployeeById(employee.id); // Call existing endpoint
      
      if (res) {
        // Parse image safely based on how your backend sends it
        let avatar = null;
        try {
          const imgArray = typeof res.CustomerImage === "string" ? JSON.parse(res.CustomerImage) : res.CustomerImage;
          if (Array.isArray(imgArray) && imgArray.length > 0) {
            avatar = imgArray[0];
          }
        } catch (e) {}

        // Use CustomerId if available, otherwise fallback to trimmed primary key id
        const displayId = res.CustomerId && res.CustomerId.trim() !== "" 
          ? res.CustomerId 
          : res.id?.substring(0, 8).toUpperCase(); 

        setProfile({ ...res, parsedImage: avatar, displayId });
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, [employee]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return <div className="text-center text-gray-500 mt-10">Failed to load profile details.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-md border border-[var(--color-muted)] overflow-hidden">
        
        {/* Header Banner */}
        <div className="h-40 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-light)] relative"></div>
        
        <div className="px-8 pb-10">
          <div className="relative flex flex-col sm:flex-row justify-between items-center sm:items-end -mt-20 sm:-mt-16 mb-6 gap-4">
            
            {/* Avatar */}
            <div className="relative">
              {profile.parsedImage ? (
                <img src={profile.parsedImage} alt={profile.customerName} className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-white" />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center text-4xl font-bold text-[var(--color-primary-darker)]">
                  {profile.customerName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Status Badge */}
            <span className="bg-green-100 text-green-700 px-5 py-2 rounded-full text-sm font-bold border border-green-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Active Employee
            </span>
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{profile.customerName}</h1>
            <p className="text-[var(--color-primary)] font-medium mb-6 flex items-center justify-center sm:justify-start gap-2">
              <Briefcase size={16} /> ID: {profile.displayId}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-8 border-t border-[var(--color-muted)]">
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-sm"><Mail size={20}/></div>
              <div className="overflow-hidden">
                <p className="text-xs text-[var(--color-gray)] font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                <p className="font-semibold text-gray-900 truncate">{profile.Email || "Not Provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-sm"><Phone size={20}/></div>
              <div className="overflow-hidden">
                <p className="text-xs text-[var(--color-gray)] font-bold uppercase tracking-wider mb-0.5">Contact Number</p>
                <p className="font-semibold text-gray-900 truncate">{profile.ContactNumber || "Not Provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors md:col-span-2">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-sm"><MapPin size={20}/></div>
              <div className="overflow-hidden">
                <p className="text-xs text-[var(--color-gray)] font-bold uppercase tracking-wider mb-0.5">Location</p>
                <p className="font-semibold text-gray-900">
                  {profile.Adderess || profile.City || profile.Location 
                    ? [profile.Adderess, profile.Location, profile.City].filter(Boolean).join(", ") 
                    : "Location details not specified"}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}