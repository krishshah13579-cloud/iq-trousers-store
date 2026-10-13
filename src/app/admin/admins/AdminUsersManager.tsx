"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  UserMinus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Key,
  Mail,
  User,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface AdminUsersManagerProps {
  initialAdmins: AdminUser[];
}

export default function AdminUsersManager({
  initialAdmins,
}: AdminUsersManagerProps) {
  const { data: session } = useSession();
  const currentAdminEmail = session?.user?.email;

  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Password reset modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetAdminForPassword, setTargetAdminForPassword] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordModalLoading, setPasswordModalLoading] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);

  const openPasswordModal = (admin: AdminUser) => {
    setTargetAdminForPassword(admin);
    setNewPassword("");
    setPasswordModalError(null);
    setPasswordModalOpen(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdminForPassword) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordModalError("Password must be at least 6 characters");
      return;
    }

    setPasswordModalLoading(true);
    setPasswordModalError(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetAdminForPassword.id,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setFeedback({
        type: "success",
        message: `Password updated successfully for ${targetAdminForPassword.email}`,
      });
      setPasswordModalOpen(false);
    } catch (err: unknown) {
      setPasswordModalError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setPasswordModalLoading(false);
    }
  };

  const openCreateModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!email.trim() || !password) {
      setFormError("Email and password are required");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create administrator");
        setFormLoading(false);
        return;
      }

      setFormSuccess(data.message || "Administrator account created successfully!");
      if (data.admin) {
        setAdmins((prev) => [data.admin, ...prev.filter((a) => a.id !== data.admin.id)]);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDemoteAdmin = async (admin: AdminUser) => {
    if (admin.email === currentAdminEmail) {
      alert("You cannot demote your own administrator account.");
      return;
    }

    if (admins.length <= 1) {
      alert("Cannot demote the only remaining administrator on the platform.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to demote "${admin.name || admin.email}" to a regular Customer? They will lose access to the admin dashboard.`
    );
    if (!confirmed) return;

    setLoadingId(admin.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, role: "USER" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to demote administrator",
        });
        return;
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      setFeedback({
        type: "success",
        message: `${admin.name || admin.email} was successfully demoted to Customer.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.email === currentAdminEmail) {
      alert("You cannot delete your own administrator account.");
      return;
    }

    if (admins.length <= 1) {
      alert("Cannot delete the only remaining administrator on the platform.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to permanently delete administrator "${admin.name || admin.email}"?`
    );
    if (!confirmed) return;

    setLoadingId(admin.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/admins?id=${admin.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to delete administrator",
        });
        return;
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      setFeedback({
        type: "success",
        message: "Administrator account deleted.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      a.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage administrators with permission to control inventory, orders, and store settings.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Administrators
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {admins.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Your Signed-In Account
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-2 truncate">
            {currentAdminEmail || "Active Administrator"}
          </p>
          <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Super Administrator
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search administrators by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredAdmins.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No administrators found matching your search.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Administrator</th>
                  <th scope="col" className="px-6 py-3.5">Added Date</th>
                  <th scope="col" className="px-6 py-3.5">Privileges</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((a) => {
                  const isCurrentUser = a.email === currentAdminEmail;
                  const isProcessing = loadingId === a.id;
                  const initialLetter = (a.name || a.email)[0].toUpperCase();

                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {initialLetter}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-sm">
                                {a.name || "Administrator"}
                              </p>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {a.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(a.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {a.role === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs">
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                            <span>Super Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Administrator</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPasswordModal(a)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Update / Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDemoteAdmin(a)}
                            disabled={isCurrentUser || isProcessing || a.role === "SUPER_ADMIN" || admins.length <= 1}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isCurrentUser || a.role === "SUPER_ADMIN" || admins.length <= 1
                                ? "opacity-30 cursor-not-allowed text-gray-400 bg-gray-50"
                                : "bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 cursor-pointer"
                            }`}
                            title={
                              a.role === "SUPER_ADMIN"
                                ? "Super Admin cannot be demoted"
                                : isCurrentUser
                                ? "Cannot demote your own account"
                                : admins.length <= 1
                                ? "Cannot demote the last administrator"
                                : "Demote to regular customer"
                            }
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="w-3.5 h-3.5 text-orange-600" />
                            )}
                            <span>Demote</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(a)}
                            disabled={isCurrentUser || isProcessing || a.role === "SUPER_ADMIN" || admins.length <= 1}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrentUser || a.role === "SUPER_ADMIN" || admins.length <= 1
                                ? "opacity-30 cursor-not-allowed text-gray-400"
                                : "text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            }`}
                            title={
                              a.role === "SUPER_ADMIN"
                                ? "Super Admin cannot be deleted"
                                : isCurrentUser
                                ? "Cannot delete your own account"
                                : admins.length <= 1
                                ? "Cannot delete the last administrator"
                                : "Delete administrator account"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for Creating Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Add Administrator
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Create a new administrator with complete access to products, orders, categories, and customers.
              </p>
            </div>

            {formError && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Krish Shah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@iqtrousers.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 shadow-xs"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Administrator</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Resetting/Updating Admin Password */}
      {passwordModalOpen && targetAdminForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setPasswordModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Update Admin Password
                </h3>
                <p className="text-xs text-gray-500">
                  {targetAdminForPassword.email}
                </p>
              </div>
            </div>

            {passwordModalError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordModalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  The new password will be hashed with bcrypt and saved directly to the database.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordModalLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 shadow-xs"
                >
                  {passwordModalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Password in Database</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
