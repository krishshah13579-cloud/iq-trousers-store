import { Loader2, CreditCard } from "lucide-react";

export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-150">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <div className="h-6 w-36 bg-neutral-200 rounded animate-pulse mb-1" />
          <div className="h-3.5 w-52 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 bg-white space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-40 bg-neutral-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-11 bg-neutral-100 rounded-xl animate-pulse" />
            <div className="h-11 bg-neutral-100 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-neutral-100">
          <div className="h-4 w-36 bg-neutral-200 rounded animate-pulse" />
          <div className="h-20 bg-neutral-100 rounded-xl animate-pulse" />
        </div>
        <div className="pt-4 flex items-center justify-center gap-2 text-xs font-semibold text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
          <span>Preparing secure checkout...</span>
        </div>
      </div>
    </div>
  );
}
