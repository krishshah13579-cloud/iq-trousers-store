"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Category, CLOTHING_SIZES } from "@/types";

interface ProductFormData {
  name: string;
  description: string;
  price: string | number;
  comparePrice: string | number;
  categoryId: string;
  stock: string | number;
  images: string;
  sizes?: string | string[];
  featured: boolean;
  active: boolean;
}

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  isEdit?: boolean;
  productId?: string;
}

export default function ProductForm({
  initialData,
  isEdit = false,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseInitialSizes = (): string[] => {
    if (!initialData?.sizes) return [...CLOTHING_SIZES];
    if (Array.isArray(initialData.sizes)) return initialData.sizes;
    try {
      const parsed = JSON.parse(initialData.sizes);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
    return typeof initialData.sizes === "string"
      ? initialData.sizes.split(",").map((s) => s.trim()).filter(Boolean)
      : [...CLOTHING_SIZES];
  };

  const [selectedSizes, setSelectedSizes] = useState<string[]>(parseInitialSizes);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price ?? "",
    comparePrice: initialData?.comparePrice ?? "",
    categoryId: initialData?.categoryId || "",
    stock: initialData?.stock ?? 0,
    images: initialData?.images || "",
    featured: initialData?.featured ?? false,
    active: initialData?.active ?? true,
  });

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(data);
        if (!formData.categoryId && data.length > 0 && !isEdit) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      } catch (err: unknown) {
        console.error("Categories error:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [isEdit]);

  // Update initial form data if initialData changes after fetching
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price ?? "",
        comparePrice: initialData.comparePrice ?? "",
        categoryId: initialData.categoryId || "",
        stock: initialData.stock ?? 0,
        images: initialData.images || "",
        featured: initialData.featured ?? false,
        active: initialData.active ?? true,
      });
      if (initialData.sizes) {
        if (Array.isArray(initialData.sizes)) {
          setSelectedSizes(initialData.sizes);
        } else {
          try {
            const parsed = JSON.parse(initialData.sizes);
            if (Array.isArray(parsed)) setSelectedSizes(parsed);
          } catch {
            setSelectedSizes(
              initialData.sizes.split(",").map((s) => s.trim()).filter(Boolean)
            );
          }
        }
      }
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.name.trim()) throw new Error("Product name is required");
      if (!formData.description.trim()) throw new Error("Description is required");
      if (formData.price === "" || Number(formData.price) < 0)
        throw new Error("A valid price is required");
      if (!formData.categoryId) throw new Error("Please select a category");

      const endpoint = isEdit
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        sizes: JSON.stringify(selectedSizes),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Garment Details
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Classic Oxford Formal Shirt"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Fabric specifications, cut, styling recommendations..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            {loadingCategories ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <select
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inventory Stock *
            </label>
            <input
              type="number"
              min="0"
              name="stock"
              required
              value={formData.stock}
              onChange={handleChange}
              placeholder="50"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Available Clothing Sizes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Available Sizes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select which sizes are available for this specific product
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSizes([...CLOTHING_SIZES])}
              className="text-xs text-gray-600 hover:text-black font-medium underline"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setSelectedSizes([])}
              className="text-xs text-gray-600 hover:text-black font-medium underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {CLOTHING_SIZES.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setSelectedSizes((prev) =>
                    isSelected
                      ? prev.filter((s) => s !== size)
                      : [...prev, size].sort((a, b) => Number(a) - Number(b))
                  );
                }}
                className={`min-w-[48px] h-10 px-3.5 text-xs font-semibold rounded-lg border transition-all duration-150 flex items-center justify-center ${
                  isSelected
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-white text-gray-600 border-gray-300 hover:border-black"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        {selectedSizes.length === 0 && (
          <p className="text-xs text-amber-600 font-medium">
            Warning: No sizes selected. Customers won't be able to select a size.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Pricing
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              placeholder="29.99"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare at Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="comparePrice"
              value={formData.comparePrice}
              onChange={handleChange}
              placeholder="39.99"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Original regular price before discount (optional)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Media & Status
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URLs (comma-separated)
          </label>
          <input
            type="text"
            name="images"
            value={formData.images}
            onChange={handleChange}
            placeholder="https://images.unsplash.com/photo-..., https://..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter public image URLs separated by commas.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (Visible in storefront)
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm font-medium text-gray-700">
              Featured product
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-colors shadow-xs disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEdit ? "Update Garment" : "Create Garment"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
