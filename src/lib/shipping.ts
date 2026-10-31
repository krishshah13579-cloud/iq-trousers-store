/**
 * Shipping calculation rules for IQ Trousers (Krish Clothing Co., Ahmedabad)
 *
 * Rules:
 * 1. Free Pan-India Shipping on orders >= ₹1,499
 * 2. If cart value < ₹1,499:
 *    - Gujarat: ₹50
 *    - Maharashtra: ₹100
 *    - All other locations in India: DTDC Express Courier tariff
 */

export const FREE_SHIPPING_THRESHOLD = 1499;

export interface ShippingQuote {
  amount: number;
  isFree: boolean;
  threshold: number;
  shortfall: number;
  partner: string;
  zone: "GUJARAT" | "MAHARASHTRA" | "DTDC_REST_OF_INDIA";
  estimatedDays: string;
  locationLabel: string;
}

export const INDIAN_STATES = [
  "Gujarat",
  "Maharashtra",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi / NCR",
  "Chandigarh",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
] as const;

/**
 * Resolves standard DTDC domestic courier pricing based on state/pincode
 * Origin: Ahmedabad, Gujarat (Krish Clothing Co.)
 */
export function getDTDCCourierRate(state?: string | null, zipCode?: string | null): {
  rate: number;
  estimatedDays: string;
  zoneName: string;
} {
  const normState = (state || "").trim().toLowerCase();
  const zip = (zipCode || "").trim();

  // North & Central India (Delhi, Rajasthan, Haryana, Punjab, MP, UP)
  const isNorthCentral =
    normState.includes("delhi") ||
    normState.includes("rajasthan") ||
    normState.includes("haryana") ||
    normState.includes("punjab") ||
    normState.includes("uttar pradesh") ||
    normState.includes("madhya pradesh") ||
    normState.includes("chandigarh") ||
    normState === "dl" ||
    normState === "rj" ||
    normState === "hr" ||
    normState === "pb" ||
    normState === "up" ||
    normState === "mp" ||
    zip.startsWith("11") ||
    zip.startsWith("12") ||
    zip.startsWith("13") ||
    zip.startsWith("14") ||
    zip.startsWith("15") ||
    zip.startsWith("16") ||
    zip.startsWith("20") ||
    zip.startsWith("21") ||
    zip.startsWith("22") ||
    zip.startsWith("23") ||
    zip.startsWith("24") ||
    zip.startsWith("25") ||
    zip.startsWith("26") ||
    zip.startsWith("27") ||
    zip.startsWith("28") ||
    zip.startsWith("30") ||
    zip.startsWith("31") ||
    zip.startsWith("32") ||
    zip.startsWith("33") ||
    zip.startsWith("34") ||
    zip.startsWith("45") ||
    zip.startsWith("46") ||
    zip.startsWith("47") ||
    zip.startsWith("48");

  if (isNorthCentral) {
    return {
      rate: 130,
      estimatedDays: "2–4 Business Days",
      zoneName: "DTDC North / Central Express",
    };
  }

  // South India (Karnataka, Tamil Nadu, Telangana, Kerala, Andhra Pradesh)
  const isSouth =
    normState.includes("karnataka") ||
    normState.includes("tamil nadu") ||
    normState.includes("telangana") ||
    normState.includes("kerala") ||
    normState.includes("andhra") ||
    normState === "ka" ||
    normState === "tn" ||
    normState === "ts" ||
    normState === "kl" ||
    normState === "ap" ||
    zip.startsWith("50") ||
    zip.startsWith("51") ||
    zip.startsWith("52") ||
    zip.startsWith("53") ||
    zip.startsWith("56") ||
    zip.startsWith("57") ||
    zip.startsWith("58") ||
    zip.startsWith("59") ||
    zip.startsWith("60") ||
    zip.startsWith("61") ||
    zip.startsWith("62") ||
    zip.startsWith("63") ||
    zip.startsWith("64") ||
    zip.startsWith("67") ||
    zip.startsWith("68") ||
    zip.startsWith("69");

  if (isSouth) {
    return {
      rate: 140,
      estimatedDays: "3–5 Business Days",
      zoneName: "DTDC South Express",
    };
  }

  // Special / North-East / Island zones
  const isSpecial =
    normState.includes("assam") ||
    normState.includes("meghalaya") ||
    normState.includes("tripura") ||
    normState.includes("manipur") ||
    normState.includes("mizoram") ||
    normState.includes("nagaland") ||
    normState.includes("arunachal") ||
    normState.includes("sikkim") ||
    normState.includes("kashmir") ||
    normState.includes("jammu") ||
    normState.includes("ladakh") ||
    zip.startsWith("18") ||
    zip.startsWith("19") ||
    zip.startsWith("78") ||
    zip.startsWith("79");

  if (isSpecial) {
    return {
      rate: 180,
      estimatedDays: "4–7 Business Days",
      zoneName: "DTDC Air Priority",
    };
  }

  // East India & Standard Rest of India fallback
  return {
    rate: 140,
    estimatedDays: "3–5 Business Days",
    zoneName: "DTDC Domestic Express",
  };
}

/**
 * Computes exact shipping fee based on subtotal, state, and zipCode.
 */
export function calculateShippingFee(
  subtotal: number,
  state?: string | null,
  zipCode?: string | null,
  customerEmail?: string | null
): ShippingQuote {
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // 1. Free Shipping if cart >= ₹1,499
  if (roundedSubtotal >= FREE_SHIPPING_THRESHOLD) {
    return {
      amount: 0,
      isFree: true,
      threshold: FREE_SHIPPING_THRESHOLD,
      shortfall: 0,
      partner: "Pan-India Free Express",
      zone: "GUJARAT",
      estimatedDays: "2–4 Business Days",
      locationLabel: state || "All India",
    };
  }

  const shortfall = Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - roundedSubtotal) * 100) / 100);
  const normState = (state || "").trim().toLowerCase();
  const zip = (zipCode || "").trim();

  // 2. Gujarat: ₹50
  const isGujarat =
    normState.includes("gujarat") ||
    normState === "gj" ||
    zip.startsWith("36") ||
    zip.startsWith("37") ||
    zip.startsWith("38") ||
    zip.startsWith("39");

  if (isGujarat) {
    return {
      amount: 50,
      isFree: false,
      threshold: FREE_SHIPPING_THRESHOLD,
      shortfall,
      partner: "Gujarat Express (Local)",
      zone: "GUJARAT",
      estimatedDays: "1–2 Business Days",
      locationLabel: "Gujarat (₹50)",
    };
  }

  // 3. Maharashtra: ₹100
  const isMaharashtra =
    normState.includes("maharashtra") ||
    normState === "mh" ||
    normState.includes("mumbai") ||
    normState.includes("pune") ||
    zip.startsWith("40") ||
    zip.startsWith("41") ||
    zip.startsWith("42") ||
    zip.startsWith("43") ||
    zip.startsWith("44");

  if (isMaharashtra) {
    return {
      amount: 100,
      isFree: false,
      threshold: FREE_SHIPPING_THRESHOLD,
      shortfall,
      partner: "Maharashtra Express",
      zone: "MAHARASHTRA",
      estimatedDays: "2–3 Business Days",
      locationLabel: "Maharashtra (₹100)",
    };
  }

  // 4. All Other Locations: DTDC Courier Price
  const dtdc = getDTDCCourierRate(state, zipCode);
  return {
    amount: dtdc.rate,
    isFree: false,
    threshold: FREE_SHIPPING_THRESHOLD,
    shortfall,
    partner: dtdc.zoneName,
    zone: "DTDC_REST_OF_INDIA",
    estimatedDays: dtdc.estimatedDays,
    locationLabel: `${state ? `${state} — ` : ""}DTDC Courier (₹${dtdc.rate})`,
  };
}
