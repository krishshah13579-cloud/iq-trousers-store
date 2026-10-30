export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-200">
      {/* Top progress accent line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-100 z-50 overflow-hidden">
        <div className="h-full bg-[#162082] animate-pulse w-full" />
      </div>

      {/* Hero Carousel Skeleton */}
      <div className="relative w-full aspect-[3.2/1] min-h-[380px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[460px] max-h-[500px] bg-neutral-950 flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full">
          <div className="max-w-lg space-y-4">
            <div className="h-5 w-36 bg-neutral-800/80 rounded-full animate-pulse" />
            <div className="h-10 sm:h-12 w-3/4 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-neutral-800/60 rounded animate-pulse" />
            <div className="pt-2 flex gap-3">
              <div className="h-10 w-40 bg-neutral-800 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Brand Value Props Skeleton */}
      <div className="bg-neutral-50/70 border-y border-neutral-200/80 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center p-3 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-neutral-200/70 animate-pulse" />
                <div className="h-3.5 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-neutral-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 p-3 sm:p-4 space-y-3 bg-white animate-pulse"
            >
              <div className="aspect-[3/4] w-full rounded-xl bg-gray-100" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
