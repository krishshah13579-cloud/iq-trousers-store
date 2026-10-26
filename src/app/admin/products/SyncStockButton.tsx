"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function SyncStockButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to synchronize with stock.");
      }

      setStatusMessage({
        type: "success",
        text: `Successfully synced ${data.updatedCount} products with wholesale stock! Colors, sizes, and quantities are now 100% matched.`,
      });

      router.refresh();
    } catch (err: any) {
      console.error("Sync failed:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to sync products from stock.",
      });
    } finally {
      setSyncing(false);
      // Auto-clear message after 8 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        title="Sync colors, sizes, and inventory directly from wholesale stock"
      >
        <RefreshCw className={`w-4 h-4 text-gray-600 ${syncing ? "animate-spin text-black" : ""}`} />
        <span>{syncing ? "Syncing Stock..." : "Sync from Stock"}</span>
      </button>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
