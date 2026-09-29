'use client';

import { useState, useEffect, useCallback } from "react";
import SingleSelect from "@/app/component/SingleSelect";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { roleEmpAllDataInterface } from "@/store/masters/roleemp/roleemp.interface";
import { getRoleEmpById, updateRoleEmp } from "@/store/masters/roleemp/roleemp";
import { getDepartment } from "@/store/masters/department/department";
import { getDesignationByDepartment } from "@/store/masters/designation/designation";
import BackButton from "@/app/component/buttons/BackButton";
import SaveButton from "@/app/component/buttons/SaveButton";
import { handleFieldOptionsObject } from "@/app/utils/handleFieldOptionsObject";
import ObjectSelect from "@/app/component/ObjectSelect";
import MasterProtectedRoute from "@/app/component/MasterProtectedRoutes";

interface ErrorInterface { [key: string]: string; }

export default function RoleEmpEdit() {
  const [data, setData] = useState<roleEmpAllDataInterface>({
    Department: "",
    Designation: "",
    Name: "",
    Status: "",
  });

  const [errors, setErrors] = useState<ErrorInterface>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();
  const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  }, []);

  const handleSelectChange = useCallback((label: string, selected: string) => {
    setData(prev => ({ ...prev, [label]: selected }));
    setErrors(prev => ({ ...prev, [label]: "" }));
  }, []);

  useEffect(() => {
    const fetchRoleEmpData = async () => {
      const res = await getRoleEmpById(id as string);
      if (res) {
        setData({
          Department: res.Department?._id || "",
          Designation: res.Designation?._id || "",
          Name: res.Name || "",
          Status: res.Status || "",
        });
      } else {
        toast.error("Failed to fetch roleEmp details");
      }
      setLoading(false);
    };

    if (id) {
      fetchFields();
      fetchRoleEmpData();
    }
  }, [id]);

  const validateForm = () => {
    const newErrors: ErrorInterface = {};
    if (!data.Department.trim()) newErrors.Department = "Department is required";
    if (!data.Designation.trim()) newErrors.Designation = "Designation is required";
    if (!data.Name.trim()) newErrors.Name = "RoleEmp Name is required";
    if (!data.Status.trim()) newErrors.Status = "Status is required";
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await updateRoleEmp(id as string, data);
      if (res) {
        toast.success("RoleEmp updated successfully!");
        router.push("/masters/roleemp");
      }
    } catch (err) {
      toast.error("Failed to update roleEmp");
      console.error(err);
    }
  };

  const fetchFields = async () => {
    await handleFieldOptionsObject(
      [
        { key: "Department", fetchFn: getDepartment },
      ],
      setFieldOptions
    );
  };

  useEffect(() => {
    if (data.Department) {
      fetchDesignations();
    } else {
      setFieldOptions(prev => ({ ...prev, Designations: [] })); 
    }
  }, [data.Department]);

  const fetchDesignations = async () => {
    try {
      const res = await getDesignationByDepartment(data.Department); 
      setFieldOptions(prev => ({ ...prev, Designations: res || [] }));
    } catch (err) {
      console.error("Error fetching designations:", err);
      setFieldOptions(prev => ({ ...prev, Designations: [] }));
    }
  };

  const statusOptions = ["Active", "Inactive"];

  if (loading) return null;

  return (
    <MasterProtectedRoute>
      <div className="min-h-screen flex justify-center">
        <Toaster position="top-right" />
        <div className="w-full">
          <div className="flex justify-end mb-4">
            <BackButton
              url="/masters/roleemp"
              text="Back"
              icon={<ArrowLeft size={18} />}
            />
          </div>

          <div className="bg-white/90 backdrop-blur-lg p-10 w-full rounded-3xl shadow-2xl">
            <form onSubmit={(e) => e.preventDefault()} className="w-full">
              <div className="mb-8 text-left border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-extrabold text-[var(--color-secondary-darker)]">
                  Edit <span className="text-[var(--color-primary)]">RoleEmp</span>
                </h1>
              </div>

              <div className="flex flex-col space-y-6">
                <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
                  
                  {/* Department */}
                  <ObjectSelect
                    options={Array.isArray(fieldOptions?.Department) ? fieldOptions.Department : []}
                    label="Department"
                    value={data.Department}
                    getLabel={(item) => item?.Name || ""}
                    getId={(item) => item?._id || ""}
                    onChange={(selected) => {
                      setData((prev) => ({ ...prev, Department: selected, Designation: "" }));
                      setErrors((prev) => ({ ...prev, Department: "" }));
                    }}
                    error={errors.Department}
                  />

                  {/* Designation */}
                  <ObjectSelect
                    options={Array.isArray(fieldOptions?.Designations) ? fieldOptions.Designations : []}
                    label="Designation"
                    value={data.Designation}
                    getLabel={(item) => item?.Name || ""}
                    getId={(item) => item?._id || ""}
                    onChange={(selected) => {
                      setData((prev) => ({ ...prev, Designation: selected }));
                      setErrors((prev) => ({ ...prev, Designation: "" }));
                    }}
                    error={errors.Designation}
                  />

                  {/* Name */}
                  <InputField 
                    label="RoleEmp Name" 
                    name="Name" 
                    value={data.Name} 
                    onChange={handleInputChange} 
                    error={errors.Name} 
                  />

                  {/* Status Dropdown */}
                  <SingleSelect 
                    options={statusOptions} 
                    label="Status" 
                    value={data.Status} 
                    onChange={(v) => handleSelectChange("Status", v)} 
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <SaveButton text="Update" onClick={handleSubmit} />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MasterProtectedRoute>
  );
}

const InputField: React.FC<{ label: string; name: string; value: string; error?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, name, value, onChange, error }) => (
  <label className="relative block w-full">
    <input type="text" name={name} value={value} onChange={onChange} placeholder=" " className={`peer w-full border rounded-sm bg-transparent py-3 px-4 outline-none ${error ? "border-red-500 focus:border-red-500" : "border-gray-400 focus:border-blue-500"}`} />
    <p className={`absolute left-2 bg-white px-1 text-gray-500 text-sm transition-all duration-300 ${value || error ? "-top-2 text-xs text-blue-500" : "peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-500"}`}>{label}</p>
    {error && <span className="text-red-500 text-sm mt-1 block">{error}</span>}
  </label>
);