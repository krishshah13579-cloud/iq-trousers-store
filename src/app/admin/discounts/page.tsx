"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  Loader2,
  Calendar,
  Percent,
  CheckCircle,
  XCircle,
  X,
  IndianRupee,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Discount } from "@/types";

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    minOrder: "",
    maxUses: "",
    expiresAt: "",
  });

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/discounts");
      if (!res.ok) throw new Error("Failed to load discounts");
      const data = await res.json();
      setDiscounts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormData({
      code: "",
      type: "PERCENTAGE",
      value: "",
      minOrder: "",
      maxUses: "",
      expiresAt: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: String(discount.value),
      minOrder: discount.minOrder > 0 ? String(discount.minOrder) : "",
      maxUses: discount.maxUses ? String(discount.maxUses) : "",
      expiresAt: discount.expiresAt
        ? new Date(discount.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: discount.id,
          active: !discount.active,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle discount");
      const updated = await res.json();
      setDiscounts((prev) =>
        prev.map((d) => (d.id === discount.id ? updated : d))
      );
    } catch (err) {
      console.error(err);
      alert("Could not update discount status");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete discount");
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete discount code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (!formData.code.trim()) throw new Error("Code is required");
      if (formData.value === "" || Number(formData.value) <= 0) {
        throw new Error("Value must be greater than 0");
      }

      if (editingDiscount) {
        // Update existing discount
        const res = await fetch("/api/admin/discounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDiscount.id,
            code: formData.code.trim().toUpperCase(),
            type: formData.type,
            value: formData.value,
            minOrder: formData.minOrder || "0",
            maxUses: formData.maxUses || null,
            expiresAt: formData.expiresAt || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update discount");
        }

        setDiscounts((prev) =>
          prev.map((d) => (d.id === editingDiscount.id ? data : d))
        );
      } else {
        // Create new discount
        const res = await fetch("/api/admin/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create discount");
        }

        setDiscounts((prev) => [data, ...prev]);
      }

      setIsModalOpen(false);
      setEditingDiscount(null);
      setFormData({
        code: "",
        type: "PERCENTAGE",
        value: "",
        minOrder: "",
        maxUses: "",
        expiresAt: "",
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error saving discount");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Discounts & Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create promotional coupon codes, percentage discounts, and fixed credits.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Discount</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading discount codes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            {discounts.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                No discounts found. Create your first promotion above!
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-5 py-3">Code</th>
                    <th scope="col" className="px-5 py-3">Type</th>
                    <th scope="col" className="px-5 py-3">Discount Value</th>
                    <th scope="col" className="px-5 py-3">Min Order</th>
                    <th scope="col" className="px-5 py-3">Uses</th>
                    <th scope="col" className="px-5 py-3">Expires</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {discounts.map((discount) => {
                    const isExpired =
                      discount.expiresAt &&
                      new Date(discount.expiresAt) < new Date();

                    return (
                      <tr
                        key={discount.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                            {discount.code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                            {discount.type === "PERCENTAGE" ? (
                              <>
                                <Percent className="w-3.5 h-3.5 text-blue-600" />
                                Percentage
                              </>
                            ) : (
                              <>
                                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                                Fixed Amount
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          {discount.type === "PERCENTAGE"
                            ? `${discount.value}% OFF`
                            : `${formatPrice(discount.value)} OFF`}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">
                          {discount.minOrder > 0
                            ? formatPrice(discount.minOrder)
                            : "No min"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {discount.usedCount}
                          {discount.maxUses ? ` / ${discount.maxUses}` : " uses"}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {discount.expiresAt ? (
                            <span
                              className={isExpired ? "text-red-600 font-medium" : ""}
                            >
                              {new Date(discount.expiresAt).toLocaleDateString(
                                "en-IN",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                              {isExpired ? " (Expired)" : ""}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(discount)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              discount.active
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {discount.active ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(discount)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                              title="Edit Discount Code"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(discount.id, discount.code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                              title="Delete Discount Code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
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
      )}

      {/* Add / Edit Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-900" />
                <h3 className="text-lg font-bold text-gray-900">
                  {editingDiscount ? "Edit Discount Code" : "Create Discount Code"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDiscount(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-black"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={formData.type === "PERCENTAGE" ? "20" : "500"}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={formData.minOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrder: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDiscount(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingDiscount ? "Update Discount" : "Save Discount"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
