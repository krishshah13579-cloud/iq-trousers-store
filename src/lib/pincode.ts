/**
 * Pincode Auto-detection helper for India
 * Resolves City, District, and State from any 6-digit Indian Postal PIN code.
 */

interface PincodeLookupResult {
  city: string;
  state: string;
  country: string;
}

// In-memory cache to prevent repeated network requests for the same pincode
const pincodeCache: Record<string, PincodeLookupResult> = {};

// Fallback lookup table for major Indian PIN prefixes (zero-latency instant fill)
const PREFIX_MAP: Record<string, { city: string; state: string }> = {
  // Gujarat
  "380": { city: "Ahmedabad", state: "Gujarat" },
  "382": { city: "Gandhinagar", state: "Gujarat" },
  "390": { city: "Vadodara", state: "Gujarat" },
  "395": { city: "Surat", state: "Gujarat" },
  "360": { city: "Rajkot", state: "Gujarat" },
  "361": { city: "Jamnagar", state: "Gujarat" },
  "364": { city: "Bhavnagar", state: "Gujarat" },
  "370": { city: "Bhuj", state: "Gujarat" },
  // Maharashtra
  "400": { city: "Mumbai", state: "Maharashtra" },
  "401": { city: "Thane", state: "Maharashtra" },
  "411": { city: "Pune", state: "Maharashtra" },
  "422": { city: "Nashik", state: "Maharashtra" },
  "431": { city: "Aurangabad", state: "Maharashtra" },
  "440": { city: "Nagpur", state: "Maharashtra" },
  // Delhi / NCR
  "110": { city: "New Delhi", state: "Delhi / NCR" },
  "122": { city: "Gurugram", state: "Haryana" },
  "201": { city: "Noida", state: "Uttar Pradesh" },
  // Karnataka
  "560": { city: "Bengaluru", state: "Karnataka" },
  "570": { city: "Mysuru", state: "Karnataka" },
  // Tamil Nadu
  "600": { city: "Chennai", state: "Tamil Nadu" },
  "641": { city: "Coimbatore", state: "Tamil Nadu" },
  // Telangana & Andhra Pradesh
  "500": { city: "Hyderabad", state: "Telangana" },
  "530": { city: "Visakhapatnam", state: "Andhra Pradesh" },
  // Rajasthan
  "302": { city: "Jaipur", state: "Rajasthan" },
  "342": { city: "Jodhpur", state: "Rajasthan" },
  // West Bengal
  "700": { city: "Kolkata", state: "West Bengal" },
  // Uttar Pradesh
  "226": { city: "Lucknow", state: "Uttar Pradesh" },
  "208": { city: "Kanpur", state: "Uttar Pradesh" },
};

export async function lookupIndianPincode(pincode: string): Promise<PincodeLookupResult | null> {
  const clean = pincode.replace(/\D/g, "").trim();
  if (clean.length !== 6) return null;

  // 1. Check in-memory cache
  if (pincodeCache[clean]) {
    return pincodeCache[clean];
  }

  // 2. Fetch from Postal Pincode API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Name || "";
        const state = po.State || "";
        if (city && state) {
          const result: PincodeLookupResult = {
            city: city.trim(),
            state: state.trim(),
            country: "India",
          };
          pincodeCache[clean] = result;
          return result;
        }
      }
    }
  } catch {
    // Failover to prefix fallback
  }

  // 3. Fallback to 3-digit prefix mapping
  const prefix3 = clean.substring(0, 3);
  if (PREFIX_MAP[prefix3]) {
    const result: PincodeLookupResult = {
      ...PREFIX_MAP[prefix3],
      country: "India",
    };
    pincodeCache[clean] = result;
    return result;
  }

  return null;
}
