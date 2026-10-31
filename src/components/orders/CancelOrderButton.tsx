"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, XCircle, Tag, CheckCircle2 } from "lucide-react";

interface CancelOrderButtonProps {
  orderId: string;
  currentStatus: string;
  discountCode?: string | null;
  variant?: "button" | "compact";
  onCancelled?: (restoredCoupon?: string | null) => void;
}

export function CancelOrderButton({
  orderId,
  currentStatus,
  discountCode,
  variant = "button",
  onCancelled,
}: CancelOrderButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCancellable = ["PENDING", "CONFIRMED", "PROCESSING"].includes(currentStatus);

  if (!isCancellable && !successMessage) {
    return null;
  }

  const shortId = orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to cancel order. Please try again.");
        setIsCancelling(false);
        return;
      }

      setSuccessMessage(
        data.message ||
          (data.restoredCouponCode
            ? `Order #${shortId} cancelled. Coupon ${data.restoredCouponCode} restored!`
            : `Order #${shortId} cancelled successfully.`)
      );
      setIsOpen(false);

      if (onCancelled) {
        onCancelled(data.restoredCouponCode);
      }

      // Refresh the page so Server Components re-render with the latest CANCELLED status
      router.refresh();
    } catch (err) {
      console.error("Order cancellation error:", err);
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (successMessage) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{successMessage}</span>
      </div>
    );
  }

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-200"
          title="Cancel order before it is processed"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-2xs hover:border-red-300"
        >
          <XCircle className="w-4 h-4 text-red-600" />
          <span>Cancel Order</span>
        </button>
      )}

      {/* Confirmation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 text-neutral-900 relative">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-neutral-900">
                  Cancel Order #{shortId}?
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Are you sure you want to cancel order?
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isCancelling) setIsOpen(false);
                }}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs disabled:opacity-70"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Order</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
