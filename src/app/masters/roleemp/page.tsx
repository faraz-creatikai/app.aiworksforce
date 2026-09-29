"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast, Toaster } from "react-hot-toast";
import { MdDelete, MdEdit } from "react-icons/md";
import Button from "@mui/material/Button";
import { PlusSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteDialog from "@/app/component/popups/DeleteDialog";
import { roleEmpDialogDataInterface, roleEmpGetDataInterface } from "@/store/masters/roleemp/roleemp.interface";
import { deleteAllRoleEmps, deleteRoleEmp, getRoleEmp } from "@/store/masters/roleemp/roleemp";
import AddButton from "@/app/component/buttons/AddButton";
import PageHeader from "@/app/component/labels/PageHeader";
import MasterProtectedRoute from "@/app/component/MasterProtectedRoutes";

interface DeleteAllDialogDataInterface { }

export default function RoleEmpPage() {
  const [roleEmps, setRoleEmps] = useState<roleEmpGetDataInterface[]>([]);
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState("10");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deleteDialogData, setDeleteDialogData] = useState<roleEmpDialogDataInterface | null>(null);
  const [deleteAllDialogData, setDeleteAllDialogData] = useState<DeleteAllDialogDataInterface | null>(null);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [rowsPerTablePage, setRowsPerTablePage] = useState(10);
  const [selectedRoleEmps, setSelectedRoleEmps] = useState<string[]>([]);
  const router = useRouter();

  const fetchRoleEmps = async () => {
    const data = await getRoleEmp();
    if (data) {
      const formatted = data.map((r: roleEmpGetDataInterface) => ({
        ...r,
        Name: r.Name?.charAt(0).toUpperCase() + r.Name?.slice(1),
      }));
      setRoleEmps(formatted);
    }
  };

  useEffect(() => {
    fetchRoleEmps();
  }, []);

  useEffect(() => {
    setRowsPerTablePage(Number(limit));
    setCurrentTablePage(1);
  }, [limit]);

  const filtered = useMemo(() => {
    return roleEmps.filter(
      (r) =>
        keyword === "" ||
        r.Name.toLowerCase().includes(keyword.toLowerCase()) ||
        r.Department?.Name.toLowerCase().includes(keyword.toLowerCase()) ||
        r.Designation?.Name.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [roleEmps, keyword]);

  /* SELECT ALL HANDLER */
  const handleSelectAll = () => {
    const allIds = currentRows.map((c) => c._id);
    setSelectedRoleEmps((prev) =>
      allIds.every((id) => prev.includes(id))
        ? prev.filter((id) => !allIds.includes(id)) // unselect all
        : [...new Set([...prev, ...allIds])] // select all visible rows
    );
  };
  
  /* SELECT SINGLE ROW HANDLER */
  const handleSelectRow = (id: string) => {
    setSelectedRoleEmps((prev) =>
      prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id]
    );
  };

  const handleDelete = async (data: roleEmpDialogDataInterface | null) => {
    if (!data) return;
    const res = await deleteRoleEmp(data.id);
    if (res) {
      toast.success("RoleEmp deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteDialogData(null);
      fetchRoleEmps();
      return;
    }
    toast.error("Failed to delete roleEmp.");
  };

  const handleDeleteAll = async () => {
    if (roleEmps.length === 0) return;
    const payload = {
      roleEmpIds: [...selectedRoleEmps]
    };
    const response = await deleteAllRoleEmps(payload);
    if (response) {
      toast.success(`Selected roleEmps deleted`);
      setIsDeleteAllDialogOpen(false);
      setDeleteAllDialogData(null);
      setSelectedRoleEmps([]);
      fetchRoleEmps();
      return;
    }
  };

  const handleEdit = (id?: string) => {
    router.push(`/masters/roleemp/edit/${id}`);
  };

  const handleClear = () => {
    setKeyword("");
    setLimit("10");
  };

  const totalTablePages = Math.max(1, Math.ceil(filtered.length / rowsPerTablePage));
  const indexOfLastRow = currentTablePage * rowsPerTablePage;
  const indexOfFirstRow = indexOfLastRow - rowsPerTablePage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <MasterProtectedRoute>
      <Toaster position="top-right" />
      <div className="min-h-[calc(100vh-56px)] overflow-auto max-md:py-10">

        {/* DELETE POPUP */}
        <DeleteDialog<roleEmpDialogDataInterface>
          isOpen={isDeleteDialogOpen}
          title="Are you sure you want to delete this roleEmp?"
          data={deleteDialogData}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeleteDialogData(null);
          }}
          onDelete={handleDelete}
        />

        <DeleteDialog<DeleteAllDialogDataInterface>
          isOpen={isDeleteAllDialogOpen}
          title="Are you sure you want to delete selected roleEmps?"
          data={deleteAllDialogData}
          onClose={() => {
            setIsDeleteAllDialogOpen(false);
            setDeleteAllDialogData(null);
          }}
          onDelete={handleDeleteAll}
        />

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 relative">
          <PageHeader title="Dashboard" subtitles={["RoleEmp"]} />
          <AddButton
            url="/masters/roleemp/add"
            text="Add"
            icon={<PlusSquare size={18} />}
          />

          <form className="w-full flex flex-wrap gap-6 items-end mb-6 mt-16">
            <div className="flex flex-col flex-1 w-60">
              <label htmlFor="keyword" className="text-lg font-medium text-gray-900 pl-1">Keyword</label>
              <input
                id="keyword"
                type="text"
                placeholder="Search by name, department, or designation..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full outline-none border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800"
              />
            </div>

            <div className="flex flex-col w-40">
              <label htmlFor="limit" className="text-lg font-medium text-gray-900 pl-1">Limit</label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="h-10 border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={handleClear} className="px-4 py-2 text-sm hover:underline transition-all">Clear Search</button>
            </div>
          </form>

          <div className="overflow-auto relative">
             <div className=" flex justify-between items-center sticky top-0 left-0 w-full">
              <div className="flex gap-10 items-center px-3 py-4 min-w-max text-gray-700">
                <label htmlFor="selectall" className="relative overflow-hidden py-[2px] group hover:bg-[var(--color-primary-lighter)] hover:text-white text-[var(--color-primary)] bg-[var(--color-primary-lighter)] rounded-tr-sm rounded-br-sm border-l-[3px] px-2 border-l-[var(--color-primary)] cursor-pointer">
                    <div className="absolute top-0 left-0 z-0 h-full bg-[var(--color-primary)] w-0 group-hover:w-full transition-all duration-300 "></div>
                    <span className="relative">Select All</span>
                  </label>
                  <button type="button" className="relative overflow-hidden py-[2px] group hover:bg-[var(--color-primary-lighter)] hover:text-white text-[var(--color-primary)] bg-[var(--color-primary-lighter)] rounded-tr-sm rounded-br-sm border-l-[3px] px-2 border-l-[var(--color-primary)] cursor-pointer" onClick={() => {
                      if (roleEmps.length > 0) {
                        if (selectedRoleEmps.length < 1) {
                          const firstPageIds = currentRows.map((c) => c._id);
                          setSelectedRoleEmps(firstPageIds);
                        }
                        setIsDeleteAllDialogOpen(true);
                        setDeleteAllDialogData({});
                      }
                    }}><div className="absolute top-0 left-0 z-0 h-full bg-[var(--color-primary)] w-0 group-hover:w-full transition-all duration-300 "></div>
                      <span className="relative">Delete All</span>
                    </button>
              </div>
            </div>
            
            <table className="table-auto w-full border-collapse text-sm border border-gray-200">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr className="flex justify-between items-center w-full">
                  <th className="flex items-center gap-8 px-8 py-3 border border-[var(--color-secondary-dark)] text-left w-2/3">
                  <p className="w-[30px]">
                      <input
                        id="selectall"
                        type="checkbox"
                        className=" hidden"
                        checked={
                          currentRows.length > 0 &&
                          currentRows.every((r) => selectedRoleEmps.includes(r._id))
                        }
                        onChange={handleSelectAll}
                      />
                    </p>
                    <p className="w-[60px]">S.No.</p>
                    <p className="w-[160px]">Department</p>
                    <p className="w-[160px]">Designation</p>
                    <p className="w-[200px]">RoleEmp</p>
                  </th>

                  <th className="flex items-center gap-10 px-8 py-3 border border-[var(--color-secondary-dark)] text-left w-1/3 justify-end">
                    <p className="w-[120px]">Status</p>
                    <p className="w-[120px]">Action</p>
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((s, i) => (
                    <tr key={s._id || i} className="border-t flex justify-between items-center w-full hover:bg-[#f7f6f3] transition-all duration-200">
                      <td className="flex items-center gap-8 px-8 py-3 w-2/3">
                      <p className="w-[30px]">
                          <input
                            type="checkbox"
                            checked={selectedRoleEmps.includes(s._id)}
                            onChange={() => handleSelectRow(s._id)}
                          />
                        </p>
                        <p className="w-[60px]">{indexOfFirstRow + i + 1}</p>
                        <p className="w-[160px]">{s.Department?.Name}</p>
                        <p className="w-[160px] text-gray-700 break-all whitespace-normal max-w-[160px]">{s.Designation?.Name}</p>
                        <p className="w-[200px] font-semibold break-all whitespace-normal max-w-[200px]">{s.Name}</p>
                      </td>

                      <td className="flex items-center gap-10 px-8 py-3 w-1/3 justify-end">
                        <div className="w-[120px]">
                          <span className={`px-3 py-1 rounded-[2px] text-xs font-semibold ${s.Status === "Active" ? "bg-[#E8F5E9] text-green-700" : "bg-red-100 text-red-700"}`}>
                            {s.Status}
                          </span>
                        </div>

                        <div className="w-[120px] flex gap-2 items-center justify-start">
                          <Button
                            sx={{ backgroundColor: "#E8F5E9", color: "var(--color-primary)", minWidth: "32px", height: "32px", borderRadius: "8px" }}
                            onClick={() => handleEdit(s._id || String(i))}
                          >
                            <MdEdit />
                          </Button>

                          <Button
                            sx={{ backgroundColor: "#FDECEA", color: "#C62828", minWidth: "32px", height: "32px", borderRadius: "8px" }}
                            onClick={() => {
                              setIsDeleteDialogOpen(true);
                              setDeleteDialogData({ id: s._id || String(i), Name: s.Name, Status: s.Status });
                            }}
                          >
                            <MdDelete />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">No roleEmps found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-3 py-3 px-5">
              <p className="text-sm">Page {currentTablePage} of {totalTablePages}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setCurrentTablePage(p => Math.max(1, p - 1))} disabled={currentTablePage === 1} className="px-3 py-1 bg-gray-200 border border-gray-300 rounded disabled:opacity-50">Prev</button>
                <button type="button" onClick={() => setCurrentTablePage(p => (p < totalTablePages ? p + 1 : p))} disabled={currentTablePage === totalTablePages || currentRows.length <= 0} className="px-3 py-1 bg-gray-200 border border-gray-300 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterProtectedRoute>
  );
}