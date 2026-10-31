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

/**
 * Initiates an automated refund through PayU's Web Service API for cancelled orders.
 * Command: cancel_refund_transaction
 * Hash formula: sha512(key|command|var1|salt)
 */
export async function initiatePayURefund({
  paymentId,
  orderId,
  amount,
}: {
  paymentId: string;
  orderId: string;
  amount: number;
}): Promise<{ success: boolean; message: string; refundId?: string }> {
  const config = getPayUConfig();
  if (!config.isConfigured) {
    console.log("[PAYU REFUND SIMULATED - DEV MODE]", { paymentId, orderId, amount });
    return {
      success: true,
      message: "Refund simulated (PayU test mode)",
      refundId: `SIM_REF_${Date.now()}`,
    };
  }

  const endpoint = config.isLive
    ? "https://info.payu.in/merchant/postservice?form=2"
    : "https://test.payu.in/merchant/postservice?form=2";

  const command = "cancel_refund_transaction";
  const refundRequestId = `ref_${orderId.slice(-8)}_${Date.now()}`;
  const formattedAmount = Number(amount || 0).toFixed(2);

  // PayU web service hash: sha512(key|command|var1|salt)
  const hashString = `${config.key}|${command}|${paymentId}|${config.salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  const formData = new URLSearchParams();
  formData.append("key", config.key);
  formData.append("command", command);
  formData.append("var1", paymentId); // mihpayid or txnid
  formData.append("var2", refundRequestId);
  formData.append("var3", formattedAmount);
  formData.append("hash", hash);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await res.json().catch(async () => {
      const text = await res.text().catch(() => "");
      return { raw: text };
    });

    console.log("[PAYU REFUND RESPONSE]", data);
    const isSuccess = data?.status === 1 || data?.status === "1" || data?.status === "success";

    return {
      success: isSuccess,
      message: data?.msg || data?.message || (isSuccess ? "Refund initiated successfully" : "Refund request submitted to PayU"),
      refundId: data?.request_id || refundRequestId,
    };
  } catch (err: any) {
    console.error("[PAYU REFUND SERVICE ERROR]", err);
    return {
      success: false,
      message: err.message || "Failed to reach PayU refund service",
    };
  }
}

export interface PayURefundStatusResult {
  isAvailable: boolean;
  liveStatus: "QUEUED" | "PROCESSING" | "SUCCESS" | "FAILED" | "INITIATED";
  statusText: string;
  bankRefNum?: string | null;
  refundAmount?: number | null;
  raw?: any;
}

/**
 * Fetches real-time refund status directly from PayU's Web Service API.
 * Uses check_action_status (by refund request ID) and verify_payment (by transaction ID).
 */
export async function fetchPayURefundStatus({
  paymentId,
  refundId,
}: {
  paymentId?: string | null;
  refundId?: string | null;
}): Promise<PayURefundStatusResult> {
  const config = getPayUConfig();
  if (!config.isConfigured || (!paymentId && !refundId)) {
    return {
      isAvailable: false,
      liveStatus: "INITIATED",
      statusText: "100% Refund Initiated",
    };
  }

  const endpoint = config.isLive
    ? "https://info.payu.in/merchant/postservice?form=2"
    : "https://test.payu.in/merchant/postservice?form=2";

  // Strategy 1: Check by refund Request ID using check_action_status
  if (refundId && !refundId.startsWith("SIM_REF")) {
    try {
      const command = "check_action_status";
      const hashString = `${config.key}|${command}|${refundId}|${config.salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const formData = new URLSearchParams();
      formData.append("key", config.key);
      formData.append("command", command);
      formData.append("var1", refundId);
      formData.append("hash", hash);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      if (data && (data.status === 1 || data.status === "1" || data.result)) {
        const resultStr = String(data.result || data.msg || "").toLowerCase();
        let liveStatus: PayURefundStatusResult["liveStatus"] = "PROCESSING";
        if (
          resultStr.includes("success") ||
          resultStr.includes("completed") ||
          resultStr.includes("settled")
        ) {
          liveStatus = "SUCCESS";
        } else if (resultStr.includes("fail") || resultStr.includes("declined")) {
          liveStatus = "FAILED";
        } else if (resultStr.includes("queue")) {
          liveStatus = "QUEUED";
        }

        return {
          isAvailable: true,
          liveStatus,
          statusText:
            liveStatus === "SUCCESS"
              ? "Refund Completed by PayU"
              : liveStatus === "QUEUED"
              ? "Queued with PayU"
              : "Processing with Bank",
          bankRefNum: data.bank_ref_num || data.bank_ref_no || null,
          raw: data,
        };
      }
    } catch (err) {
      console.warn("[PAYU CHECK_ACTION_STATUS NOTICE]", err);
    }
  }

  // Strategy 2: Check by Payment ID (txnid/mihpayid) using verify_payment
  if (paymentId) {
    try {
      const command = "verify_payment";
      const hashString = `${config.key}|${command}|${paymentId}|${config.salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const formData = new URLSearchParams();
      formData.append("key", config.key);
      formData.append("command", command);
      formData.append("var1", paymentId);
      formData.append("hash", hash);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      if (data?.transaction_details) {
        const tx =
          data.transaction_details[paymentId] ||
          Object.values(data.transaction_details)[0];
        if (tx) {
          const txStatus = String(tx.status || "").toLowerCase();
          let liveStatus: PayURefundStatusResult["liveStatus"] = "PROCESSING";
          if (txStatus === "refunded" || txStatus.includes("success")) {
            liveStatus = "SUCCESS";
          } else if (txStatus.includes("fail")) {
            liveStatus = "FAILED";
          }

          return {
            isAvailable: true,
            liveStatus,
            statusText:
              liveStatus === "SUCCESS"
                ? "Refund Completed by PayU"
                : "Processing with Bank",
            bankRefNum: tx.bank_ref_num || tx.bank_ref_no || null,
            refundAmount: tx.refund_amount ? Number(tx.refund_amount) : null,
            raw: tx,
          };
        }
      }
    } catch (err) {
      console.warn("[PAYU VERIFY_PAYMENT NOTICE]", err);
    }
  }

  return {
    isAvailable: false,
    liveStatus: "INITIATED",
    statusText: "100% Refund Initiated",
  };
}
