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
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
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
