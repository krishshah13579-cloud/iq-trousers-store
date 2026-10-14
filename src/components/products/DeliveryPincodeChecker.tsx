"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { getDTDCCourierRate } from "@/lib/shipping";

interface DeliveryPincodeCheckerProps {
  className?: string;
}

interface DeliveryEstimate {
  pincode: string;
  locationName: string;
  processingDays: number;
  courierDaysMin: number;
  courierDaysMax: number;
  courierPartner: string;
  formattedRange: string;
  formattedDates: string;
}

function computeDeliveryEstimate(pincode: string): DeliveryEstimate | null {
  const cleanPin = pincode.trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) return null;

  const prefix2 = cleanPin.slice(0, 2);
  let locationName = "India";
  let courierDaysMin = 3;
  let courierDaysMax = 5;
  let partner = "DTDC Domestic Express";

  // Check Gujarat (Ahmedabad origin)
  if (["36", "37", "38", "39"].includes(prefix2)) {
    locationName = "Gujarat (Local Express)";
    courierDaysMin = 1;
    courierDaysMax = 2;
    partner = "DTDC Gujarat Express";
  } else if (["40", "41", "42", "43", "44"].includes(prefix2)) {
    locationName = "Maharashtra";
    courierDaysMin = 2;
    courierDaysMax = 3;
    partner = "DTDC West Express";
  } else if (
    ["11", "12", "13", "14", "15", "16", "20", "21", "22", "23", "24", "25", "26", "27", "28", "30", "31", "32", "33", "34", "45", "46", "47", "48"].includes(prefix2)
  ) {
    locationName = "North & Central India";
    courierDaysMin = 2;
    courierDaysMax = 4;
    partner = "DTDC North Express";
  } else if (
    ["50", "51", "52", "53", "56", "57", "58", "59", "60", "61", "62", "63", "64", "67", "68", "69"].includes(prefix2)
  ) {
    locationName = "South India";
    courierDaysMin = 3;
    courierDaysMax = 5;
    partner = "DTDC South Express";
  } else if (["18", "19", "78", "79"].includes(prefix2)) {
    locationName = "North-East / J&K";
    courierDaysMin = 4;
    courierDaysMax = 7;
    partner = "DTDC Air Priority";
  } else {
    locationName = "Rest of India";
    courierDaysMin = 3;
    courierDaysMax = 5;
    partner = "DTDC Domestic Express";
  }

  const processingDays = 2; // Mandatory 2 processing days from warehouse
  const totalMinDays = processingDays + courierDaysMin;
  const totalMaxDays = processingDays + courierDaysMax;

  // Calculate target calendar dates
  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(now.getDate() + totalMinDays);

  const maxDate = new Date(now);
  maxDate.setDate(now.getDate() + totalMaxDays);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  const minDateStr = minDate.toLocaleDateString("en-IN", dateOptions);
  const maxDateStr = maxDate.toLocaleDateString("en-IN", dateOptions);

  const formattedDates =
    minDateStr === maxDateStr ? minDateStr : `${minDateStr} – ${maxDateStr}`;

  return {
    pincode: cleanPin,
    locationName,
    processingDays,
    courierDaysMin,
    courierDaysMax,
    courierPartner: partner,
    formattedRange: `${totalMinDays}–${totalMaxDays} Days Total`,
    formattedDates,
  };
}

export default function DeliveryPincodeChecker({ className = "" }: DeliveryPincodeCheckerProps) {
  const [pincode, setPincode] = useState("");
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Auto-load saved pincode from previous session
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem("iq_delivery_pincode");
      if (savedPin && savedPin.length === 6) {
        setPincode(savedPin);
        const est = computeDeliveryEstimate(savedPin);
        if (est) setEstimate(est);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPin = pincode.trim().replace(/\D/g, "");
    if (!cleanPin) {
      setError("Please enter a 6-digit Pincode");
      return;
    }
    if (cleanPin.length !== 6) {
      setError("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    setIsChecking(true);
    setTimeout(() => {
      const result = computeDeliveryEstimate(cleanPin);
      if (result) {
        setEstimate(result);
        try {
          localStorage.setItem("iq_delivery_pincode", cleanPin);
        } catch {}
      } else {
        setError("Invalid PIN code format");
      }
      setIsChecking(false);
    }, 250);
  };

  const handleReset = () => {
    setEstimate(null);
    setPincode("");
    try {
      localStorage.removeItem("iq_delivery_pincode");
    } catch {}
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200/90 bg-gray-50/50 p-4 sm:p-5 space-y-3.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-[#162082] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              Estimated Delivery
            </h4>
            <p className="text-[11px] text-gray-500">
              Dispatched from Ahmedabad warehouse (2 processing days)
            </p>
          </div>
        </div>

        {estimate && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-[#162082] hover:underline cursor-pointer"
          >
            Change
          </button>
        )}
      </div>

      {!estimate ? (
        <form onSubmit={handleCheck} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (error) setError(null);
                }}
                placeholder="Enter 6-digit Pincode (e.g. 380001)"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isChecking || pincode.trim().length !== 6}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isChecking ? "Checking..." : "Check"}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-medium animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Pan-India DTDC Network
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Doorstep Tracking
            </span>
          </div>
        </form>
      ) : (
        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200/80 animate-fadeIn">
          {/* Main Delivery Date Line */}
          <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                Estimated Delivery
              </span>
              <p className="text-sm sm:text-base font-bold text-gray-900">
                {estimate.formattedDates}
              </p>
              <p className="text-xs text-gray-500">
                Pincode <strong className="text-gray-800">{estimate.pincode}</strong> ({estimate.locationName})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-600 block">
                {estimate.formattedRange}
              </span>
            </div>
          </div>

          {/* Breakdown: 2 Processing Days + DTDC Courier Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-0.5">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>2 Processing Days</strong> (Warehouse packaging)
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>{estimate.courierDaysMin}–{estimate.courierDaysMax} Days</strong> ({estimate.courierPartner})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
