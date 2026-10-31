import { Loader2, ShoppingBag } from "lucide-react";

export default function CartLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-150">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-1" />
          <div className="h-3.5 w-48 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white flex gap-4 animate-pulse"
            >
              <div className="w-24 h-32 rounded-xl bg-neutral-200 shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                <div className="h-3 w-1/3 bg-neutral-100 rounded" />
                <div className="h-5 w-24 bg-neutral-200 rounded pt-2" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 h-fit space-y-4">
          <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <div className="h-3.5 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-neutral-200 rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-3.5 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-11 w-full bg-neutral-900/10 rounded-xl animate-pulse mt-4 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}
