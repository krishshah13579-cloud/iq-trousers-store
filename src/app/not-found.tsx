import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-900 border border-neutral-200 shadow-sm">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">
            404 Error • Page Not Found
          </p>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
            The trouser style or page you requested may have moved or is no longer available in our collection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Collection</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
