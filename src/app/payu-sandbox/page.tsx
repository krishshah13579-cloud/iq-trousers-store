"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ArrowRight,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

function PayUSandboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txnid = searchParams.get("txnid") || `PAYU_${Date.now()}`;
  const amount = searchParams.get("amount") || "0.00";
  const productinfo = searchParams.get("productinfo") || "IQ Trousers Order";
  const firstname = searchParams.get("firstname") || "Customer";
  const email = searchParams.get("email") || "customer@example.com";
  const phone = searchParams.get("phone") || "9999999999";
  const surl = searchParams.get("surl") || "/api/payment/payu/response";
  const furl = searchParams.get("furl") || "/api/payment/payu/response";
  const udf1 = searchParams.get("udf1") || "";
  const key = searchParams.get("key") || "TEST_PAYU_KEY";

  const [activeTab, setActiveTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  const [upiId, setUpiId] = useState("user@okaxis");
  const [isProcessing, setIsProcessing] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  const handleSimulatePayment = (status: "success" | "failure") => {
    setIsProcessing(true);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = status === "success" ? surl : furl;

    const params: Record<string, string> = {
      status,
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1,
      mihpayid: status === "success" ? `PAYU_REF_${Date.now()}` : "",
      mode: activeTab.toUpperCase(),
      error_Message: status === "failure" ? "Payment cancelled by user" : "",
    };

    // Append inputs to form
    Object.entries(params).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden">
        {/* PayU Branded Top Header */}
        <div className="bg-[#183b56] text-white p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-[#183b56] flex items-center justify-center font-black text-xl tracking-tighter">
                Pay<span className="text-[#00a852]">U</span>
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase block">
                  Secure Checkout
                </span>
                <span className="font-bold text-sm text-white">IQ TROUSERS</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-300 block">Total Amount</span>
              <span className="text-2xl font-black text-white">
                {formatPrice(numAmount)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-300">
            <span>TXN: <strong className="text-white font-mono">{txnid}</strong></span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              PayU Sandbox Simulator
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/70">
          <button
            type="button"
            onClick={() => setActiveTab("upi")}
            className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "upi"
                ? "border-[#00a852] text-[#00a852] bg-white"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>UPI / QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "card"
                ? "border-[#00a852] text-[#00a852] bg-white"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("netbanking")}
            className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "netbanking"
                ? "border-[#00a852] text-[#00a852] bg-white"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Net Banking</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6">
          {activeTab === "upi" && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-500 mb-2">
                Select your preferred UPI App to simulate instant payment:
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {["Google Pay", "PhonePe", "Paytm"].map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setSelectedUpiApp(app)}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      selectedUpiApp === app
                        ? "border-[#00a852] bg-emerald-50/50 text-[#00a852] ring-1 ring-[#00a852]"
                        : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1 opacity-70" />
                    <span>{app}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Virtual Payment Address (UPI ID)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okaxis"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50"
                />
              </div>
            </div>
          )}

          {activeTab === "card" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Card Number</label>
                <input
                  type="text"
                  readOnly
                  value="4111 •••• •••• 1111 (Test Visa Card)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 font-mono text-neutral-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Valid Thru</label>
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">CVV</label>
                  <input
                    type="password"
                    readOnly
                    value="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "netbanking" && (
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-neutral-700">Select Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank"].map((bank, i) => (
                  <div
                    key={bank}
                    className={`p-3 rounded-xl border font-semibold flex items-center gap-2 cursor-pointer ${
                      i === 0
                        ? "border-[#00a852] bg-emerald-50 text-[#00a852]"
                        : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Building className="w-4 h-4 shrink-0" />
                    <span>{bank}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Simulation Buttons */}
          <div className="mt-8 space-y-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSimulatePayment("success")}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#00a852] hover:bg-[#009247] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing PayU Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Successful Payment ({formatPrice(numAmount)})</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSimulatePayment("failure")}
              className="w-full py-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Simulate Cancelled / Failed Payment</span>
            </button>
          </div>

          <div className="mt-5 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            <span>256-bit SSL encrypted • PayU Payments Private Limited</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayUSandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-100">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      }
    >
      <PayUSandboxContent />
    </Suspense>
  );
}
