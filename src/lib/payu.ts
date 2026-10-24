import crypto from "crypto";

export interface PayUConfig {
  key: string;
  salt: string;
  mode: "TEST" | "LIVE";
  isLive: boolean;
  isConfigured: boolean;
  gatewayUrl: string;
}

export function getPayUConfig(): PayUConfig {
  const key =
    process.env.PAYU_MERCHANT_KEY?.trim() ||
    process.env.PAYU_KEY?.trim() ||
    process.env.PAYU_MERCHANT_ID?.trim() ||
    "";
  const salt =
    process.env.PAYU_MERCHANT_SALT?.trim() ||
    process.env.PAYU_SALT?.trim() ||
    "";
  const rawMode = (process.env.PAYU_MODE || "TEST").toUpperCase();
  const mode: "TEST" | "LIVE" = rawMode === "LIVE" || rawMode === "PROD" ? "LIVE" : "TEST";

  const isConfigured = Boolean(
    key &&
    salt &&
    key !== "placeholder" &&
    salt !== "placeholder" &&
    key.length > 3 &&
    salt.length > 3
  );

  const isLive = mode === "LIVE";
  const gatewayUrl = isLive
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";

  return {
    key: isConfigured ? key : "TEST_PAYU_KEY",
    salt: isConfigured ? salt : "TEST_PAYU_SALT",
    mode,
    isLive,
    isConfigured,
    gatewayUrl,
  };
}

/**
 * Generates the SHA512 hash required by PayU for initiating a payment request.
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayUHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  salt,
  udf1 = "",
  udf2 = "",
  udf3 = "",
  udf4 = "",
  udf5 = "",
}: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  salt: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}): string {
  // PayU format: 11 parameters, then 5 empty parameters (udf6 to udf10), then salt.
  // Between udf5 and salt there are 6 pipe delimiters: ||||||
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

/**
 * Verifies the return hash sent by PayU in the response callback.
 * Formula: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Or with additionalCharges:
 * sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(
  response: Record<string, string>,
  salt: string
): boolean {
  const hash = response.hash?.trim()?.toLowerCase();
  if (!hash) return false;

  const key = response.key || "";
  const txnid = response.txnid || "";
  const amount = response.amount || "";
  const productinfo = response.productinfo || "";
  const firstname = response.firstname || "";
  const email = response.email || "";
  const status = response.status || "";
  const udf1 = response.udf1 || "";
  const udf2 = response.udf2 || "";
  const udf3 = response.udf3 || "";
  const udf4 = response.udf4 || "";
  const udf5 = response.udf5 || "";
  const addCharges = (response.additionalCharges || response.additional_charges || "").trim();
  const netAmount = (response.net_amount_debit || "").trim();

  // PayU may format the amount with 2 decimals, 1 decimal, or no decimals. Test all variations.
  const amountsToTest = new Set<string>([amount]);
  const parsedNum = parseFloat(amount);
  if (!isNaN(parsedNum)) {
    amountsToTest.add(parsedNum.toFixed(2));
    amountsToTest.add(parsedNum.toFixed(1));
    amountsToTest.add(parsedNum.toString());
  }
  if (netAmount) amountsToTest.add(netAmount);

  const candidateStrings: string[] = [];

  for (const amt of amountsToTest) {
    // 1. Standard formula without additional charges
    candidateStrings.push(
      `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amt}|${txnid}|${key}`
    );

    // 2. Formula with additional charges if present
    if (addCharges) {
      candidateStrings.push(
        `${addCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amt}|${txnid}|${key}`
      );
    }
  }

  for (const seq of candidateStrings) {
    const calc = crypto.createHash("sha512").update(seq).digest("hex").toLowerCase();
    if (calc === hash) {
      return true;
    }
  }

  return false;
}
