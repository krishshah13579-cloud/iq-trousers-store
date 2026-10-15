export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-200">
      {/* Top progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50 overflow-hidden">
        <div className="h-full bg-gray-900 animate-pulse w-full" />
      </div>

      {/* Page Header Skeleton */}
      <div className="bg-gray-50/70 border-b border-gray-100 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-3 w-12 bg-gray-200 rounded-sm animate-pulse" />
            <div className="h-3 w-3 bg-gray-200 rounded-sm" />
            <div className="h-3 w-20 bg-gray-200 rounded-sm animate-pulse" />
          </div>
          <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-200 rounded-sm animate-pulse" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar Skeleton */}
          <aside className="w-full lg:w-64 shrink-0 hidden lg:block space-y-6">
            <div className="h-5 w-24 bg-gray-200 rounded-sm animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-full bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="h-5 w-20 bg-gray-200 rounded-sm animate-pulse" />
              <div className="h-8 w-full bg-gray-50 rounded-lg animate-pulse" />
            </div>
          </aside>

          {/* Product Grid Skeleton */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse bg-white"
                >
                  <div className="aspect-[4/5] w-full rounded-xl bg-gray-100" />
                  <div className="h-3.5 w-20 bg-gray-200 rounded-sm" />
                  <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
                  <div className="h-4 w-1/3 bg-gray-200 rounded-sm" />
                  <div className="pt-2 flex justify-between items-center">
                    <div className="h-6 w-20 bg-gray-200 rounded-sm" />
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
