"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Star, MessageSquare, Check, AlertCircle } from "lucide-react";
import { Review } from "@/types";

interface ProductReviewsSectionProps {
  productId: string;
  initialReviews: Review[];
}

export default function ProductReviewsSection({
  productId,
  initialReviews,
}: ProductReviewsSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!comment.trim()) {
      setErrorMsg("Please provide your review thoughts.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccessMsg("Thank you! Your review has been published.");
      setComment("");

      // Update local review state
      if (data.review) {
        setReviews((prev) => {
          const filtered = prev.filter((r) => r.id !== data.review.id);
          return [data.review, ...filtered];
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight">
            Customer <span className="font-medium">Reviews</span>
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200 fill-gray-100"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {avgRating > 0 ? avgRating.toFixed(1) : "0.0"} out of 5
            </span>
            <span className="text-xs text-gray-400">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Reviews List */}
        <div className="lg:col-span-7 space-y-6">
          {reviews.length === 0 ? (
            <div className="py-12 px-6 bg-gray-50/70 rounded-2xl text-center border border-dashed border-gray-200">
              <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">No reviews yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Be the first to share your experience with this product!
              </p>
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-gray-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-6 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold uppercase">
                        {(rev.user?.name || "Customer").slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {rev.user?.name || "Verified Customer"}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200 fill-gray-100"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <time className="text-xs text-gray-400">
                      {new Date(rev.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Form */}
        <div className="lg:col-span-5">
          <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Write a Review
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Share your honest feedback to help other shoppers.
            </p>

            {session ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 -m-1 focus:outline-none transition-transform hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gray-700 ml-2">
                      {hoverRating || rating} / 5
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Your Review
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike? How was the fit and quality?"
                    className="w-full text-sm p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none transition-all"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting ? "Submitting review..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500 mb-4">
                  You must be signed in to leave a review.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors shadow-xs"
                >
                  Sign In to Review
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
