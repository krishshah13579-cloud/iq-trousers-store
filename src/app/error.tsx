"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Application Error:", error);
  }, [error]);

  // If this is a Next.js notFound() trigger, re-throw it so Next.js renders not-found.tsx
  if (error?.digest === "NEXT_NOT_FOUND" || error?.message?.includes("NEXT_NOT_FOUND")) {
    throw error;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-bold text-rose-600">
            Unexpected Issue
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
            We encountered a temporary issue while loading this page. Please try refreshing or return home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-50 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
