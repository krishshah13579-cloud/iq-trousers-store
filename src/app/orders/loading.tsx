import { Loader2, Package } from "lucide-react";

export default function OrdersLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-150">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
          <Package className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-1" />
          <div className="h-3.5 w-44 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 sm:p-6 rounded-2xl border border-neutral-200 bg-white space-y-4 animate-pulse"
          >
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-neutral-200 rounded" />
                <div className="h-3 w-24 bg-neutral-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-neutral-100 rounded-full" />
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-20 rounded-lg bg-neutral-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                <div className="h-3 w-1/4 bg-neutral-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8 text-xs font-medium text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
        <span>Loading orders history...</span>
      </div>
    </div>
  );
}
