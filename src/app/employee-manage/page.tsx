"use client";

import { useEffect, useState, useRef } from "react";
import { 
  getFilteredEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployees 
} from "@/store/attendance/attendance";

// API Hooks for dynamic dropdowns
import { getDepartment } from "@/store/masters/department/department";
import { getDesignationByDepartment } from "@/store/masters/designation/designation";
import { getRoleEmpByDeptAndDesignation } from "@/store/masters/roleemp/roleemp";
import { handleFieldOptionsObject } from "@/app/utils/handleFieldOptionsObject";

import { 
  Search, Plus, Trash2, Edit, Eye, X, 
  AlertTriangle, Users, Briefcase, Mail, Phone, CheckCircle2, 
  MapPin, UploadCloud, Loader2, BadgeCheck, UserPlus
} from "lucide-react";
import toast from "react-hot-toast";

import EmployeeViewDialog from "../component/popups/EmployeeViewDialog";
import ObjectSelect from "@/app/component/ObjectSelect";

// --- TYPES ---
interface EmployeeItem {
  id: string;
  _id?: string;
  employeeName: string;
  Email: string;
  ContactNumber: string;
  Department: string;
  Designation: string;
  Role: string; // Dynamic RoleEmp string from database
  City: string;
  Adderess: string;
  Verified: string;
  EmployeeImage: string | string[]; 
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<any>(null); 
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form Fields State (CLEANED UP - No SystemRole)
  const [formData, setFormData] = useState({
    employeeName: "", 
    Email: "", 
    Password: "", 
    ContactNumber: "",
    Department: "",     
    DepartmentId: "",   
    Designation: "",    
    DesignationId: "",  
    Role: "",           
    City: "", 
    Adderess: "", 
    Verified: "no"
  });

  // Dynamic Dropdown State
  const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Pending states for auto-selecting cascading dropdowns during Edit
  const [pendingDesignation, setPendingDesignation] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  // --- FETCH EMPLOYEES ---
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("Limit", "200");
      if (searchQuery.trim()) params.append("Keyword", searchQuery.trim());

      const res = await getFilteredEmployee(params.toString());
      if (res?.success) {
        setEmployees(res.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchEmployees(); }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // --- INIT ROOT DROPDOWNS ---
  useEffect(() => {
    const fetchRootFields = async () => {
      await handleFieldOptionsObject([
        { key: "Department", fetchFn: getDepartment }
      ], setFieldOptions);
    };
    fetchRootFields();
  }, []);

  // --- CASCADING DROPDOWNS LOGIC ---
  useEffect(() => {
    const fetchDesignations = async () => {
      if (formData.DepartmentId) {
        try {
          const res = await getDesignationByDepartment(formData.DepartmentId);
          setFieldOptions(prev => ({ ...prev, Designation: res || [] }));
          
          if (pendingDesignation) {
            const match = res?.find((d: any) => d.Name === pendingDesignation);
            if (match) {
              setFormData(prev => ({ ...prev, DesignationId: match._id, Designation: match.Name }));
            }
            setPendingDesignation(null);
          }
        } catch (err) {
          setFieldOptions(prev => ({ ...prev, Designation: [] }));
        }
      } else {
        setFieldOptions(prev => ({ ...prev, Designation: [], Role: [] }));
      }
    };
    fetchDesignations();
  }, [formData.DepartmentId, pendingDesignation]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (formData.DepartmentId && formData.DesignationId) {
        try {
          const res = await getRoleEmpByDeptAndDesignation(formData.DepartmentId, formData.DesignationId);
          setFieldOptions(prev => ({ ...prev, Role: res || [] }));

          if (pendingRole) {
            const match = res?.find((r: any) => r.Name === pendingRole);
            if (match) {
              setFormData(prev => ({ ...prev, Role: match.Name }));
            }
            setPendingRole(null);
          }
        } catch (err) {
          setFieldOptions(prev => ({ ...prev, Role: [] }));
        }
      } else {
        setFieldOptions(prev => ({ ...prev, Role: [] }));
      }
    };
    fetchRoles();
  }, [formData.DesignationId, formData.DepartmentId, pendingRole]);

  // --- HANDLERS ---
  const handleOpenForm = (mode: "create" | "edit", emp?: EmployeeItem) => {
    setFormMode(mode);
    setSelectedFile(null);
    setErrors({});
    
    if (mode === "edit" && emp) {
      setEditId(emp.id || emp._id || null);
      
      const deptObj = fieldOptions.Department?.find((d: any) => d.Name === emp.Department);
      
      if (emp.Designation) setPendingDesignation(emp.Designation);
      if (emp.Role) setPendingRole(emp.Role);

      setFormData({
        employeeName: emp.employeeName || "",
        Email: emp.Email || "",
        Password: "", 
        ContactNumber: emp.ContactNumber || "",
        Department: emp.Department || "",
        DepartmentId: deptObj?._id || "",
        Designation: "", 
        DesignationId: "", 
        Role: "", 
        City: emp.City || "",
        Adderess: emp.Adderess || "",
        Verified: emp.Verified?.toLowerCase() === "yes" ? "yes" : "no",
      });
    } else {
      setEditId(null);
      setPendingDesignation(null);
      setPendingRole(null);
      setFormData({
        employeeName: "", Email: "", Password: "", ContactNumber: "",
        Department: "", DepartmentId: "", 
        Designation: "", DesignationId: "", 
        Role: "", City: "", Adderess: "", Verified: "no"
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName || !formData.Email) {
      toast.error("Name and Email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      
      const submitData: Record<string, any> = {
        employeeName: formData.employeeName,
        Email: formData.Email,
        Password: formData.Password,
        ContactNumber: formData.ContactNumber,
        City: formData.City,
        Adderess: formData.Adderess,
        Verified: formData.Verified,
        Role: formData.Role,            // 🔥 Correct dynamic Role payload
        Department: formData.Department,
        Designation: formData.Designation,
      };

      Object.entries(submitData).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });

      if (selectedFile) {
        payload.append("EmployeeImage", selectedFile);
      }

      let res;
      if (formMode === "create") {
        if (!formData.Password) {
          toast.error("Password is required for new employees");
          setIsSubmitting(false);
          return;
        }
        res = await createEmployee(payload);
      } else {
        res = await updateEmployee(editId!, payload);
      }

      if (res?.success) {
        toast.success(`Employee ${formMode === "create" ? "added" : "updated"} successfully`);
        setIsFormOpen(false);
        fetchEmployees();
      } else {
        toast.error(res?.message || "An error occurred");
      }
    } catch (error) {
      toast.error("Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    try {
      const idsToDelete = deleteData.id ? [deleteData.id] : Array.from(selectedIds);
      const res = await deleteEmployees(idsToDelete);
      
      if (res?.success) {
        toast.success("Employees deleted successfully");
        setDeleteData({ isOpen: false, id: null });
        setSelectedIds(new Set());
        fetchEmployees();
      } else {
        toast.error("Failed to delete employees");
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    }
  };

  const handleViewClick = (id: string | number) => {
    setEmployeeToView(id); 
    setIsViewOpen(true);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === employees.length && employees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map(e => e.id || e._id!)));
    }
  };

  const parseImage = (imgData: any) => {
    if (!imgData) return null;
    try {
      const parsed = typeof imgData === "string" ? JSON.parse(imgData) : imgData;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch {
      return typeof imgData === "string" ? imgData : null;
    }
  };

  const totalEmp = employees.length;
  const verifiedEmp = employees.filter(e => e.Verified?.toLowerCase() === "yes").length;

  return (
    <div className="min-h-screen space-y-6 font-sans pb-10 flex flex-col max-w-[95rem] mx-auto w-full sm:px-4">
      
      <EmployeeViewDialog
        isOpen={!!viewId} 
        onClose={() => setViewId(null)} 
        employeeId={viewId} 
        onEdit={(id) => { setViewId(null); handleOpenForm("edit", employees.find(e => (e.id || e._id) === id)); }}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 sm:py-6 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-darker)] font-bold text-lg shrink-0 shadow-inner">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary-darker)]">Team Directory</h1>
            <p className="text-[var(--color-gray)] text-sm mt-1">Manage employee profiles and access</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setDeleteData({ isOpen: true, id: null })}
              className="flex flex-1 md:flex-none items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] font-bold text-sm rounded-xl hover:bg-[var(--color-destructive)]/20 transition-colors"
            >
              <Trash2 size={16} /> Delete ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => handleOpenForm("create")}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-xl shadow-md transition-all text-sm font-bold cursor-pointer active:scale-95"
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 px-4 sm:px-0">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Staff</p>
            <p className="text-2xl font-black text-gray-900">{totalEmp}</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50 text-green-600"><BadgeCheck size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Verified</p>
            <p className="text-2xl font-black text-gray-900">{verifiedEmp}</p>
          </div>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="bg-white rounded-t-3xl border border-[var(--color-muted)] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-center mx-4 sm:mx-0 shadow-sm mt-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] rounded-xl outline-none text-sm transition-all"
          />
        </div>
      </div>

      {/* TABLE / LIST AREA */}
      <div className="bg-white rounded-b-3xl border-b border-l border-r border-[var(--color-muted)] shadow-sm overflow-hidden mx-4 sm:mx-0 -mt-6 sm:-mt-6">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading directory...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No employees found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === employees.length && employees.length > 0}
                        onChange={toggleAll}
                        className="rounded w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer border-gray-300"
                      />
                    </th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Role & Dept</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => {
                    const empId = emp.id || emp._id!;
                    const avatar = parseImage(emp.EmployeeImage);
                    const isSelected = selectedIds.has(empId);

                    return (
                      <tr key={empId} className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`} onClick={() => setViewId(empId)}>
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(empId)}
                            className="rounded w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer border-gray-300"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img src={avatar} alt={emp.employeeName} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold flex items-center justify-center text-lg shadow-sm border border-[var(--color-primary-light)]">
                                {emp.employeeName?.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{emp.employeeName}</p>
                              {emp.City && <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5"><MapPin size={10} /> {emp.City}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-700 flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {emp.Email}</span>
                            {emp.ContactNumber && <span className="text-xs text-gray-500 flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {emp.ContactNumber}</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            {emp.Role && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-md uppercase tracking-wider border border-gray-200">
                                {emp.Role}
                              </span>
                            )}
                            {(emp.Department || emp.Designation) && (
                              <span className="text-xs text-gray-500 font-medium truncate max-w-[180px]">
                                {[emp.Designation, emp.Department].filter(Boolean).join(" • ")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {emp.Verified?.toLowerCase() === "yes" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewId(empId)} className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lighter)] rounded-lg transition-colors cursor-pointer" title="View">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => handleOpenForm("edit", emp)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => setDeleteData({ isOpen: true, id: empId })} className="p-2 text-gray-400 hover:text-[var(--color-destructive)] hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="lg:hidden flex flex-col divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === employees.length && employees.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  Select All
                </label>
                <span className="text-xs text-gray-400 font-medium">{employees.length} entries</span>
              </div>
              
              {employees.map(emp => {
                const empId = emp.id || emp._id!;
                const avatar = parseImage(emp.EmployeeImage);
                const isSelected = selectedIds.has(empId);

                return (
                  <div key={empId} className={`p-4 flex flex-col gap-3 transition-colors ${isSelected ? 'bg-blue-50/30' : 'bg-white'}`} onClick={() => setViewId(empId)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={e => e.stopPropagation()}
                          onChange={() => toggleSelection(empId)}
                          className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer shrink-0 mt-1"
                        />
                        {avatar ? (
                          <img src={avatar} alt={emp.employeeName} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold flex items-center justify-center text-lg shadow-sm border border-[var(--color-primary-light)] shrink-0">
                            {emp.employeeName?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{emp.employeeName}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{emp.Email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pl-7 ml-1 flex flex-wrap items-center gap-2">
                      {emp.Role && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-gray-200">
                          {emp.Role}
                        </span>
                      )}
                      {emp.Verified?.toLowerCase() === "yes" && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-200 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setViewId(empId)} className="flex-1 py-2 flex justify-center items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        <Eye size={14} /> View
                      </button>
                      <button onClick={() => handleOpenForm("edit", emp)} className="flex-1 py-2 flex justify-center items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => setDeleteData({ isOpen: true, id: empId })} className="flex-1 py-2 flex justify-center items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[var(--color-destructive)] text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT EMPLOYEE MODAL                                 */}
      {/* ========================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80 shrink-0 rounded-t-3xl">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {formMode === "create" ? <UserPlus size={22} className="text-[var(--color-primary)]"/> : <Edit size={22} className="text-blue-500"/>}
                {formMode === "create" ? "Add New Employee" : "Edit Employee Profile"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lighter)] rounded-full transition-colors cursor-pointer bg-white shadow-sm border border-gray-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Image Upload Area */}
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-inner">
                        <CheckCircle2 size={30} />
                      </div>
                      <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Click to change image</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-[var(--color-primary)]">
                        <UploadCloud size={26} />
                      </div>
                      <p className="text-sm font-bold text-gray-800">Upload Profile Photo</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">JPEG, PNG or WEBP. Will be compressed automatically.</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                    <input 
                      required type="text" placeholder="John Doe"
                      value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address *</label>
                    <input 
                      required type="email" placeholder="john@company.com"
                      value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                      <span>Password {formMode === "create" && "*"}</span>
                      {formMode === "edit" && <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">Leave blank to keep current</span>}
                    </label>
                    <input 
                      type="password" placeholder="••••••••"
                      value={formData.Password} onChange={e => setFormData({...formData, Password: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <input 
                      type="text" placeholder="+91 9876543210"
                      value={formData.ContactNumber} onChange={e => setFormData({...formData, ContactNumber: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white"
                    />
                  </div>

                  {/* 🚨 CASCADING DROPDOWNS SECTION 🚨 */}
                  
                  <ObjectSelect
                    options={Array.isArray(fieldOptions?.Department) ? fieldOptions.Department : []}
                    label="Department"
                    value={formData.DepartmentId} // Value is ID for the API
                    getLabel={(item) => item?.Name || ""}
                    getId={(item) => item?._id || ""}
                    onChange={(selectedId) => {
                      const selectedObj = fieldOptions.Department.find((i: any) => i._id === selectedId);
                      if (selectedObj) {
                        setFormData((prev) => ({
                          ...prev,
                          DepartmentId: selectedObj._id,
                          Department: selectedObj.Name, // Save name for the payload
                          DesignationId: "", // Reset children
                          Designation: "",
                          Role: "" 
                        }));
                        setErrors((prev) => ({ ...prev, Department: "" }));
                      }
                    }}
                    error={errors.Department}
                  />

                  <ObjectSelect
                    options={Array.isArray(fieldOptions?.Designation) ? fieldOptions.Designation : []}
                    label="Designation"
                    value={formData.DesignationId}
                    getLabel={(item) => item?.Name || ""}
                    getId={(item) => item?._id || ""}
                    onChange={(selectedId) => {
                      const selectedObj = fieldOptions.Designation.find((i: any) => i._id === selectedId);
                      if (selectedObj) {
                        setFormData((prev) => ({
                          ...prev,
                          DesignationId: selectedObj._id,
                          Designation: selectedObj.Name, // Save name for the payload
                          Role: "" // Reset children
                        }));
                        setErrors((prev) => ({ ...prev, Designation: "" }));
                      }
                    }}
                    error={errors.Designation}
                  />

                  <ObjectSelect
                    options={Array.isArray(fieldOptions?.Role) ? fieldOptions.Role : []}
                    label="Job Role"
                    value={formData.Role} // Role Name used directly if you map it later
                    getLabel={(item) => item?.Name || ""}
                    getId={(item) => item?.Name || ""} // Saving name directly as ID here
                    onChange={(selectedName) => {
                      setFormData((prev) => ({
                        ...prev,
                        Role: selectedName
                      }));
                    }}
                    error={errors.Role}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status (Verified)</label>
                    <select 
                      value={formData.Verified} onChange={e => setFormData({...formData, Verified: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white appearance-none cursor-pointer font-medium text-gray-700"
                    >
                      <option value="no">Pending / No</option>
                      <option value="yes">Verified / Active</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">City</label>
                    <input 
                      type="text" placeholder="e.g. Jaipur"
                      value={formData.City} onChange={e => setFormData({...formData, City: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
                    <textarea 
                      rows={2} placeholder="Complete physical address..."
                      value={formData.Adderess} onChange={e => setFormData({...formData, Adderess: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm bg-white resize-none"
                    />
                  </div>
                </div>

              </div>
              <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-3xl">
                <button type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3 font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-md transition-all disabled:opacity-60 cursor-pointer text-sm">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (formMode === "create" ? "Create Employee" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteData.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[var(--color-destructive)]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-[var(--color-destructive)]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Employee{deleteData.id ? "" : "s"}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {deleteData.id ? "this employee" : `these ${selectedIds.size} employees`}? This action cannot be undone.
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => setDeleteData({ isOpen: false, id: null })} className="flex-1 py-3 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={executeDelete} className="flex-1 py-3 cursor-pointer bg-[var(--color-destructive)] hover:bg-red-600 text-white font-bold text-sm rounded-xl shadow-md transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}