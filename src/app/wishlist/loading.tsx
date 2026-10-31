import { Loader2, Heart } from "lucide-react";

export default function WishlistLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-150">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
          <Heart className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-1" />
          <div className="h-3.5 w-48 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 sm:p-4 rounded-2xl border border-neutral-200 bg-white space-y-3 animate-pulse"
          >
            <div className="aspect-[3/4] w-full rounded-xl bg-neutral-100" />
            <div className="h-4 w-3/4 bg-neutral-200 rounded" />
            <div className="h-4 w-1/3 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8 text-xs font-medium text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
        <span>Loading saved wishlist items...</span>
      </div>
    </div>
  );
}
