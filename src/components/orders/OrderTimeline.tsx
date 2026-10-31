"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Navigation,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  XCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export interface OrderTimelineProps {
  status: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  trackingNumber?: string | null;
  estimatedDeliveryDate?: string | Date | null;
}

interface StepConfig {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof CheckCircle2;
}

const TIMELINE_STEPS: StepConfig[] = [
  {
    key: "ORDER_PLACED",
    title: "Order Placed",
    shortTitle: "Placed",
    description: "Your order has been received and verified",
    icon: CheckCircle2,
  },
  {
    key: "CONFIRMED",
    title: "Confirmed",
    shortTitle: "Confirmed",
    description: "Seller confirmed order and reserved items",
    icon: ShieldCheck,
  },
  {
    key: "DISPATCHED",
    title: "Dispatched",
    shortTitle: "Dispatched",
    description: "Package packed and handed to logistics partner",
    icon: Package,
  },
  {
    key: "IN_TRANSIT",
    title: "In Transit",
    shortTitle: "In Transit",
    description: "Package is on the way to your delivery hub",
    icon: Truck,
  },
  {
    key: "OUT_FOR_DELIVERY",
    title: "Out For Delivery",
    shortTitle: "Out for Delivery",
    description: "Delivery executive is arriving at your address",
    icon: Navigation,
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    shortTitle: "Delivered",
    description: "Package delivered to your doorstep",
    icon: CheckCircle,
  },
];

/**
 * Maps database order status to step index:
 * 0: Order Placed
 * 1: Confirmed
 * 2: Dispatched (or PROCESSING)
 * 3: In Transit (or SHIPPED)
 * 4: Out For Delivery
 * 5: Delivered
 */
import { getStepIndex } from "@/lib/utils";
export { getStepIndex };

export function OrderTimeline({
  status,
  createdAt,
  updatedAt,
  trackingNumber,
  estimatedDeliveryDate,
}: OrderTimelineProps) {
  const [copied, setCopied] = useState(false);
  const isCancelled = status?.toUpperCase() === "CANCELLED";
  const currentStep = getStepIndex(status);

  const safeDate = (val: string | Date | null | undefined): Date | null => {
    if (!val) return null;
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const validPlacedDate = safeDate(createdAt) || new Date();
  const validEstDate =
    safeDate(estimatedDeliveryDate) ||
    new Date(validPlacedDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  const formatStepDate = (stepIndex: number) => {
    try {
      if (stepIndex === 0) {
        return validPlacedDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }

      const validUpdated = safeDate(updatedAt);
      if (stepIndex <= currentStep && validUpdated) {
        const stepTime = new Date(
          validPlacedDate.getTime() +
            ((validUpdated.getTime() - validPlacedDate.getTime()) * stepIndex) /
              Math.max(currentStep, 1)
        );
        if (!isNaN(stepTime.getTime())) {
          return stepTime.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          });
        }
      }

      if (stepIndex === 5) {
        return `Est. ${validEstDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        })}`;
      }
    } catch {
      return null;
    }

    return null;
  };

  const copyTracking = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Percentage progress for the connecting bar
  const progressPercent = isCancelled
    ? 0
    : Math.round((currentStep / (TIMELINE_STEPS.length - 1)) * 100);

  if (isCancelled) {
    return (
      <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 bg-red-50/60 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-neutral-900">
            Your order has been cancelled.
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Delivery Tracking
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                currentStep === 5
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {TIMELINE_STEPS[currentStep].title}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mt-1">
            {currentStep === 5 ? (
              "Package Delivered"
            ) : (
              <>
                Estimated Delivery by{" "}
                <span className="text-emerald-700">
                  {validEstDate.toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            {TIMELINE_STEPS[currentStep].description}
          </p>
        </div>

        {/* Tracking Number Pill */}
        {trackingNumber && (
          <div className="flex items-center gap-2 bg-neutral-100/90 hover:bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs transition-colors">
            <Truck className="w-4 h-4 text-neutral-500 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block leading-tight">
                AWB / Courier Ref
              </span>
              <span className="font-mono font-medium text-neutral-800 block">
                {trackingNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={copyTracking}
              title="Copy Tracking Number"
              className="p-1 hover:text-neutral-900 text-neutral-500 rounded transition-colors ml-1 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP TIMELINE (Horizontal) */}
      <div className="hidden md:block p-8">
        <div className="relative">
          {/* Background Connecting Line */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-neutral-100 rounded-full" />

          {/* Active Progress Line */}
          <div
            className="absolute top-5 left-6 h-1 bg-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `calc(${progressPercent}% * 0.9 + 4px)` }}
          />

          {/* Steps Grid */}
          <div className="relative grid grid-cols-6 gap-2">
            {TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep && !isCancelled;
              const isUpcoming = idx > currentStep;
              const dateText = formatStepDate(idx);

              return (
                <div key={step.key} className="flex flex-col items-center text-center group">
                  {/* Step Bubble */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isPast
                        ? "bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-50"
                        : isCurrent
                        ? "bg-white border-2 border-emerald-600 text-emerald-600 ring-4 ring-emerald-100 shadow-md"
                        : "bg-neutral-100 border border-neutral-200 text-neutral-400"
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${
                          isCurrent ? "animate-pulse text-emerald-600" : ""
                        }`}
                      />
                    )}

                    {/* Pulsing indicator on current active step */}
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-3">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? "text-emerald-700"
                          : isPast
                          ? "text-neutral-900"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    {dateText && (
                      <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                        {dateText}
                      </p>
                    )}
                    {isCurrent && (
                      <span className="mt-1.5 inline-block text-[10px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE TIMELINE (Vertical Stepper) */}
      <div className="block md:hidden p-5 sm:p-6">
        <div className="relative pl-7 space-y-6">
          {/* Vertical Track Line */}
          <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-neutral-200 -translate-x-1/2" />

          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isPast = idx < currentStep;
            const isCurrent = idx === currentStep && !isCancelled;
            const isUpcoming = idx > currentStep;
            const dateText = formatStepDate(idx);

            return (
              <div key={step.key} className="relative flex items-start gap-3">
                {/* Step Circle Node */}
                <div
                  className={`absolute -left-7 w-7 h-7 rounded-full flex items-center justify-center -translate-x-1/2 z-10 ${
                    isPast
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : isCurrent
                      ? "bg-white border-2 border-emerald-600 text-emerald-600 ring-4 ring-emerald-100"
                      : "bg-neutral-100 border border-neutral-300 text-neutral-400"
                  }`}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? "text-emerald-700 font-bold"
                          : isPast
                          ? "text-neutral-900"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    {dateText && (
                      <span className="text-[11px] font-medium text-neutral-500 whitespace-nowrap">
                        {dateText}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                  {isCurrent && (
                    <span className="mt-1.5 inline-block text-[10px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ● Active Stage
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Support / Fast Track Callout */}
      <div className="px-5 py-3.5 bg-neutral-50/80 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Need real-time shipment updates? Tracking is synchronized with our delivery partners.</span>
        </span>
        <a
          href="/contact"
          className="font-medium text-neutral-900 hover:text-neutral-600 flex items-center gap-1 hover:underline"
        >
          <span>Delivery Help</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
