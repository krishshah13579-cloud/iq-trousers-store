"use client";

import { useEffect, useState } from "react";
import { Truck, ExternalLink, Copy, Check, Clock, MapPin, RefreshCw } from "lucide-react";

interface DTDCTrackingEvent {
  date: string;
  time?: string;
  location: string;
  activity: string;
  status?: string;
}

interface DTDCTrackingData {
  success: boolean;
  awb: string;
  carrier: string;
  currentStatus: "BOOKED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "PENDING";
  statusLabel: string;
  directTrackUrl: string;
  events: DTDCTrackingEvent[];
  source: string;
}

export function DTDCTrackingCard({
  trackingNumber,
  orderStatus,
}: {
  trackingNumber: string;
  orderStatus?: string;
}) {
  const [data, setData] = useState<DTDCTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchTracking = async () => {
    if (!trackingNumber) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tracking/dtdc?awb=${encodeURIComponent(trackingNumber)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn("Failed to fetch DTDC live tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [trackingNumber]);

  const copyAWB = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const directTrackUrl =
    data?.directTrackUrl ||
    `https://www.dtdc.in/tracking/shipment-tracking.asp?tracking_no=${encodeURIComponent(
      trackingNumber
    )}`;

  const isDelivered =
    data?.currentStatus === "DELIVERED" || orderStatus?.toUpperCase() === "DELIVERED";
  const isOutForDelivery =
    data?.currentStatus === "OUT_FOR_DELIVERY" || orderStatus?.toUpperCase() === "OUT_FOR_DELIVERY";

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-red-50/40 via-neutral-50 to-white border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#cc0000] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-900 tracking-tight">
                DTDC Express Courier
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isDelivered
                    ? "bg-emerald-100 text-emerald-800"
                    : isOutForDelivery
                    ? "bg-teal-100 text-teal-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {data?.statusLabel || (isDelivered ? "Delivered" : "In Transit")}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-neutral-500">AWB:</span>
              <span className="font-mono font-semibold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                {trackingNumber}
              </span>
              <button
                type="button"
                onClick={copyAWB}
                className="text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                title="Copy AWB number"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTracking}
            disabled={loading}
            className="p-2 text-neutral-500 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh DTDC status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href={directTrackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <span>Track on DTDC Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Events / Timeline List */}
      <div className="p-5 sm:p-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
          Live Shipment Milestones
        </h4>

        {loading && !data ? (
          <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Fetching real-time status from DTDC...</span>
          </div>
        ) : data?.events && data.events.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
            {data.events.map((evt, idx) => {
              const isFirst = idx === 0;
              return (
                <div key={idx} className="relative group">
                  {/* Bullet */}
                  <div
                    className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 ${
                      isFirst
                        ? "bg-[#cc0000] border-white ring-4 ring-red-100"
                        : "bg-white border-neutral-400"
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <p className="text-xs font-semibold text-neutral-900">{evt.activity}</p>
                    <span className="text-[11px] text-neutral-400 sm:shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 inline" />
                      {evt.date} {evt.time ? `• ${evt.time}` : ""}
                    </span>
                  </div>
                  {evt.location && (
                    <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 inline text-neutral-400" />
                      {evt.location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            Consignment has been registered with DTDC Express. Real-time scanning events will display here as the package progresses through hubs.
          </p>
        )}
      </div>
    </div>
  );
}
