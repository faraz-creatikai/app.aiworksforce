"use client";
import React, { useState, useEffect } from "react";
import { Check, X, ChevronLeft, ChevronRight, Building, Mail, FileText, Calendar, KeyRound, Trash2 } from "lucide-react";
import { 
  approveCustomerRequest, 
  denyCustomerRequest, 
  getCustomerRequests,
  deleteCustomerRequests 
} from "@/store/customer-request/customerRequest";
import { CustomerRequestModel } from "@/store/customer-request/customerRequest.interface";

export default function CustomerRequestsAdmin() {
  // State
  const [requests, setRequests] = useState<CustomerRequestModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "denied" | "">("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // 🚀 Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog State (Updated to support "delete")
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "deny" | "delete" | null;
    request: CustomerRequestModel | null; // Null for bulk delete
    password: "";
    isLoading: boolean;
  }>({
    isOpen: false,
    type: null,
    request: null,
    password: "",
    isLoading: false,
  });

  // Fetch Data
  const fetchData = async (currentPage: number, currentStatus: string) => {
    setLoading(true);
    setSelectedIds([]); // Clear selection when page/tab changes
    const response = await getCustomerRequests({
      status: currentStatus as any,
      page: currentPage,
      limit: 10,
    });

    if (response?.success) {
      setRequests(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.totalRecords);
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(page, statusFilter);
  }, [page, statusFilter]);

  // Handlers
  const handleTabChange = (status: "pending" | "approved" | "denied" | "") => {
    setStatusFilter(status);
    setPage(1);
  };

  // 🚀 Selection Handlers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(requests.map(req => req.id)); // Select all on current page
    }
  };

  const executeAction = async () => {
    if (!dialog.type) return;
    setDialog((prev) => ({ ...prev, isLoading: true }));

    let response;
    
    // Handle Bulk Delete
    if (dialog.type === "delete") {
      response = await deleteCustomerRequests(selectedIds);
    } 
    // Handle Approve / Deny (Single)
    else if (dialog.request) {
      if (dialog.type === "approve") {
        response = await approveCustomerRequest(dialog.request.id, dialog.password);
      } else {
        response = await denyCustomerRequest(dialog.request.id);
      }
    }

    if (response?.success) {
      fetchData(page, statusFilter); // Refresh list
      closeDialog();
    } else {
      alert(response?.message || "An error occurred");
      setDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const openDialog = (type: "approve" | "deny" | "delete", request?: CustomerRequestModel) => {
    setDialog({ isOpen: true, type, request: request || null, password: "", isLoading: false });
  };

  const closeDialog = () => {
    setDialog({ isOpen: false, type: null, request: null, password: "", isLoading: false });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "denied": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-2 md:p-6 lg:px-8 pb-20">
      
      {/* HEADER */}
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Customer Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage incoming CRM access requests ({totalRecords} total)
          </p>
        </div>

        {/* TABS */}
        <div className="flex overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 p-1 no-scrollbar shrink-0">
          {[
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Denied", value: "denied" },
            { label: "All", value: "" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as any)}
              className={`px-3 py-1.5 md:px-5 md:py-2 cursor-pointer text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? "bg-[var(--color-primary)] text-white shadow"
                  : "text-gray-600 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 BULK ACTION BAR */}
      {requests.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)] cursor-pointer"
              checked={selectedIds.length === requests.length && requests.length > 0}
              onChange={handleSelectAll}
            />
            {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : "Select All"}
          </label>
          
          {selectedIds.length > 0 && (
            <button
              onClick={() => openDialog("delete")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-white bg-[var(--color-destructive)] rounded-md hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Delete Selected</span>
              <span className="md:hidden">Delete</span>
            </button>
          )}
        </div>
      )}

      {/* CONTENT LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-10 md:p-20">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
          <p className="text-gray-500 text-sm mt-1">There are no {statusFilter} requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-xl border transition-all shadow-sm flex flex-col ${
                selectedIds.includes(req.id) ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-gray-200 hover:shadow-md"
              }`}
            >
              <div className="p-4 md:p-5 flex-1 relative">
                
                {/* 🚀 ABSOLUTE CHECKBOX */}
                <div className="absolute top-4 right-4">
                   <input 
                    type="checkbox" 
                    className="w-4.5 h-4.5 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)] cursor-pointer"
                    checked={selectedIds.includes(req.id)}
                    onChange={() => toggleSelection(req.id)}
                  />
                </div>

                <div className="pr-8"> {/* Padding right to avoid overlap with checkbox */}
                  <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight truncate">
                    {req.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] md:text-xs font-semibold rounded-full border ${getStatusBadge(req.status)}`}>
                      {req.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs md:text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>
                  {req.companyName && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{req.companyName}</span>
                    </div>
                  )}
                </div>

                {(req.useCase || req.bio) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs md:text-sm">
                    {req.useCase && (
                      <p className="mb-2">
                        <strong className="text-gray-900">Use Case:</strong>{" "}
                        <span className="text-gray-600">{req.useCase}</span>
                      </p>
                    )}
                    {req.bio && (
                      <p className="line-clamp-3">
                        <strong className="text-gray-900">Bio:</strong>{" "}
                        <span className="text-gray-600">{req.bio}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION FOOTER (Only for pending) */}
              {req.status === "pending" && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => openDialog("deny", req)}
                    className="flex-1 flex items-center justify-center cursor-pointer gap-1 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-[var(--color-destructive)] transition-colors"
                  >
                    <X className="w-4 h-4" /> Deny
                  </button>
                  <button
                    onClick={() => openDialog("approve", req)}
                    className="flex-1 flex items-center justify-center cursor-pointer gap-1 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-6 md:mt-8 flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1 cursor-pointer text-sm font-medium text-gray-700 bg-gray-100 rounded-md disabled:opacity-50 hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" /> <span className="hidden md:inline">Previous</span>
          </button>
          <span className="text-xs md:text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1 cursor-pointer text-sm font-medium text-[var(--color-primary-dark)] bg-[var(--color-primary-lighter)] rounded-md disabled:opacity-50 hover:bg-[var(--color-primary-light)]"
          >
            <span className="hidden md:inline">Next</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            
            <div className={`h-1.5 ${dialog.type === "approve" ? "bg-[var(--color-primary)]" : "bg-[var(--color-destructive)]"}`} />
            
            <div className="p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2 capitalize">
                {dialog.type} Request{dialog.type === "delete" && selectedIds.length > 1 ? "s" : ""}?
              </h2>
              <p className="text-sm text-gray-600 mb-5">
                {dialog.type === "delete" ? (
                  <>Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> selected request(s)? This action cannot be undone.</>
                ) : (
                  <>
                    Are you sure you want to {dialog.type} the request for{" "}
                    <span className="font-semibold text-gray-900">{dialog.request?.name}</span>?
                    {dialog.type === "approve"
                      ? " This will create a permanent customer record in the CRM."
                      : " This action cannot be undone and the user will not be added."}
                  </>
                )}
              </p>

              {/* PASSWORD INPUT (Only shows on approve) */}
              {dialog.type === "approve" && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Set Customer Password (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={dialog.password}
                      onChange={(e) => setDialog({ ...dialog, password: e.target.value as any })}
                      placeholder="Enter initial password..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-shadow"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    If left blank, the customer will not have a password set initially.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={closeDialog}
                  disabled={dialog.isLoading}
                  className="px-4 py-2 text-sm font-medium cursor-pointer text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  disabled={dialog.isLoading}
                  className={`px-4 py-2 text-sm font-medium cursor-pointer text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 ${
                    dialog.type === "approve"
                      ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
                      : "bg-[var(--color-destructive)] hover:bg-red-600"
                  }`}
                >
                  {dialog.isLoading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  ) : dialog.type === "approve" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {dialog.isLoading ? "Processing..." : `Yes, ${dialog.type}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}