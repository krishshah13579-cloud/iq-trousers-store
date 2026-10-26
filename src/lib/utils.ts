export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStarRating(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getOrderStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "PROCESSING":
    case "DISPATCHED":
      return "bg-indigo-100 text-indigo-800";
    case "SHIPPED":
    case "IN_TRANSIT":
      return "bg-purple-100 text-purple-800";
    case "OUT_FOR_DELIVERY":
      return "bg-teal-100 text-teal-800";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function normalizePhone(raw: string): string {
  // Strip spaces, dashes, brackets, dots
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, "");
  // Standardize 10-digit numbers without prefix or with 0
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = `+91${cleaned}`;
  } else if (/^0\d{10}$/.test(cleaned)) {
    cleaned = `+91${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith("+") && /^\d{11,13}$/.test(cleaned)) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export function getStepIndex(status?: string | null): number {
  const norm = (status || "").toUpperCase();
  switch (norm) {
    case "PENDING":
      return 0;
    case "CONFIRMED":
      return 1;
    case "PROCESSING":
    case "DISPATCHED":
      return 2;
    case "SHIPPED":
    case "IN_TRANSIT":
      return 3;
    case "OUT_FOR_DELIVERY":
      return 4;
    case "DELIVERED":
      return 5;
    default:
      return 0;
  }
}

export function isAdminRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Returns an array of all image URLs for a product.
 * Robustly handles:
 * - JSON Array of URLs or data URLs: '["data:image/...", "https://..."]'
 * - Nested JSON Array strings: '["[\"data:image/...\"]"]'
 * - Single base64 data URL: 'data:image/jpeg;base64,...'
 * - Comma-separated HTTP/HTTPS URLs: 'https://..., https://...'
 */
export function getProductAllImages(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  const trimmed = imageUrl.trim();
  if (!trimmed) return [];

  // Replace dead / broken unsplash link with bundled valid local trouser product photo
  if (trimmed.includes("photo-1542272604-780c96856592")) {
    return ["/products/imp-001.jpg"];
  }

  // 1. JSON Array format
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const result: string[] = [];
        for (const item of parsed) {
          if (typeof item === "string" && item.trim()) {
            const itemTrimmed = item.trim();
            if (itemTrimmed.startsWith("[") && itemTrimmed.endsWith("]")) {
              result.push(...getProductAllImages(itemTrimmed));
            } else if (itemTrimmed.includes("photo-1542272604-780c96856592")) {
              result.push("/products/imp-001.jpg");
            } else {
              result.push(itemTrimmed);
            }
          }
        }
        return result.filter(Boolean);
      }
    } catch {}
  }

  // 2. Base64 Data URL (starts with data:image/) - do NOT split by comma!
  if (trimmed.startsWith("data:")) {
    return [trimmed];
  }

  // 3. Comma-separated web URLs (e.g. https://... , https://...)
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"))
      .map((s) => s.includes("photo-1542272604-780c96856592") ? "/products/imp-001.jpg" : s);
  }

  return [trimmed];
}

/**
 * Resolves the primary/cover image URL from a product's imageUrl string.
 * Supports single URL, base64 data URL, JSON array, or comma-separated list of web URLs.
 */
export function getProductCoverImage(
  imageUrl: string | null | undefined,
  fallback: string = "/products/imp-001.jpg"
): string {
  const images = getProductAllImages(imageUrl);
  if (images.length > 0 && images[0]) {
    const primary = images[0];
    if (primary.includes("photo-1542272604-780c96856592")) {
      return fallback;
    }
    return primary;
  }
  return fallback;
}

