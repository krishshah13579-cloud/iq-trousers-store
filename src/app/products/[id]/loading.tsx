export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-200">
      {/* Top indeterminate progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50 overflow-hidden">
        <div className="h-full bg-gray-900 animate-pulse w-full" />
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-12 bg-gray-200 rounded-sm animate-pulse" />
            <div className="h-3 w-3 bg-gray-200 rounded-sm" />
            <div className="h-3 w-16 bg-gray-200 rounded-sm animate-pulse" />
            <div className="h-3 w-3 bg-gray-200 rounded-sm" />
            <div className="h-3 w-32 bg-gray-200 rounded-sm animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Product Info Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Product Image Skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 animate-pulse flex flex-col items-center justify-center border border-gray-100 shadow-xs">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                <div className="absolute w-2.5 h-2.5 bg-gray-900 rounded-full animate-ping" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Loading Product Details...
              </span>
              <span className="text-[11px] text-gray-400 mt-1">
                Please wait a moment
              </span>
            </div>

            {/* Thumbnail Row Skeleton */}
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200/50 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Right: Product Details Skeleton */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
            <div>
              {/* Category Tag */}
              <div className="h-3.5 w-24 bg-gray-200 rounded-sm animate-pulse mb-3" />
              {/* Product Title */}
              <div className="h-8 w-4/5 bg-gray-200 rounded-md animate-pulse mb-3" />
              {/* Reviews Stars */}
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-28 bg-gray-200 rounded-sm animate-pulse" />
                <div className="h-4 w-14 bg-gray-200 rounded-sm animate-pulse" />
              </div>
            </div>

            {/* Price line */}
            <div className="flex items-baseline gap-3 pt-1">
              <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-5 w-20 bg-gray-100 rounded-md animate-pulse" />
            </div>

            {/* Colors Skeleton */}
            <div className="space-y-2 pt-2">
              <div className="h-3 w-16 bg-gray-200 rounded-sm animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-24 bg-gray-100 rounded-full animate-pulse border border-gray-200/40"
                  />
                ))}
              </div>
            </div>

            {/* Sizes Selector Skeleton */}
            <div className="space-y-2 pt-2">
              <div className="h-3 w-20 bg-gray-200 rounded-sm animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-12 bg-gray-100 rounded-lg animate-pulse border border-gray-200/40"
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="space-y-3 pt-4">
              <div className="h-12 w-full bg-gray-900/10 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            </div>

            {/* Delivery Pincode Checker Skeleton */}
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="h-3.5 w-32 bg-gray-200 rounded-sm animate-pulse" />
              <div className="h-10 w-full bg-white rounded-lg border border-gray-200 animate-pulse" />
            </div>

            {/* Accordion Skeletons */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-gray-50 rounded-lg border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
