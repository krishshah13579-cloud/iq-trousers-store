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

export const GARMENT_PHOTO_FALLBACK = "/products/center-trouser-banner-crop.jpg";

/**
 * Matches a color name against inventory map keys with case-insensitivity and alias support
 */
export function matchColorKey(targetColor: string, keys: string[]): string | undefined {
  if (!targetColor || !keys || keys.length === 0) return undefined;
  const clean = targetColor.trim().toLowerCase();
  const direct = keys.find((k) => k.trim().toLowerCase() === clean);
  if (direct) return direct;

  const aliasGroups: string[][] = [
    ["black", "classic black", "jet black", "pitch black"],
    ["navy", "navy blue", "deep navy", "dark navy", "vibrant navy blue"],
    ["grey", "gray", "dark grey", "dark gray", "slate grey", "slate gray", "charcoal", "medium grey"],
    ["blue", "denim blue", "royal blue", "ice blue"],
    ["green", "olive green", "olive", "forest green", "mehndi green"],
    ["brown", "dark brown", "coffee", "chocolate", "tan", "mocha brown"],
    ["cream", "beige", "sand", "off white", "white"],
  ];

  for (const group of aliasGroups) {
    if (group.some((a) => clean === a || clean.includes(a))) {
      const found = keys.find((k) => {
        const kClean = k.trim().toLowerCase();
        return group.some((a) => kClean === a || kClean.includes(a));
      });
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Resolves available stock for a specific size and color from a product's inventory JSON or total stock.
 */
export function getProductVariantStock(
  product: { stock: number; inventory?: string | null | Record<string, any> },
  size?: string | null,
  color?: string | null
): number {
  if (!product) return 0;
  let inventoryMap: Record<string, Record<string, number>> | null = null;
  if (product.inventory) {
    try {
      inventoryMap =
        typeof product.inventory === "string"
          ? JSON.parse(product.inventory)
          : product.inventory;
    } catch {}
  }

  if (!inventoryMap || Object.keys(inventoryMap).length === 0) {
    return Math.max(0, product.stock || 0);
  }

  const targetColor = (color || "").trim();
  const matchedColorKey = targetColor ? matchColorKey(targetColor, Object.keys(inventoryMap)) : undefined;

  if (matchedColorKey && inventoryMap[matchedColorKey]) {
    const colSizes = inventoryMap[matchedColorKey];
    if (size) {
      const matchedSizeKey = Object.keys(colSizes).find(
        (sz) => sz.trim().toLowerCase() === size.trim().toLowerCase()
      );
      return matchedSizeKey !== undefined ? Math.max(0, Number(colSizes[matchedSizeKey]) || 0) : 0;
    }
    return Math.max(
      0,
      Object.values(colSizes).reduce((a: number, b: any) => a + Number(b || 0), 0)
    );
  }

  if (targetColor) {
    return 0;
  }

  if (size) {
    let sizeSum = 0;
    let found = false;
    Object.values(inventoryMap).forEach((colMap) => {
      if (typeof colMap === "object" && colMap) {
        const matchedSizeKey = Object.keys(colMap).find(
          (sz) => sz.trim().toLowerCase() === size.trim().toLowerCase()
        );
        if (matchedSizeKey !== undefined) {
          sizeSum += Math.max(0, Number(colMap[matchedSizeKey]) || 0);
          found = true;
        }
      }
    });
    if (found) return sizeSum;
  }

  return Math.max(0, product.stock || 0);
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
  if (!trimmed || trimmed === "[]" || trimmed === '[""]') return [];

  // Replace dead / broken unsplash link with empty
  if (trimmed.includes("photo-1542272604-780c96856592")) {
    return [];
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
            } else if (!itemTrimmed.includes("photo-1542272604-780c96856592") && itemTrimmed !== "") {
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
      .filter((s) => (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) && !s.includes("photo-1542272604-780c96856592"));
  }

  return [trimmed];
}

/**
 * Resolves the primary/cover image URL from a product's imageUrl string.
 * Supports single URL, base64 data URL, JSON array, or comma-separated list of web URLs.
 */
export function getProductCoverImage(
  imageUrl: string | null | undefined,
  fallback: string = GARMENT_PHOTO_FALLBACK
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

