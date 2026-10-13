"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  Copy,
  Mail,
  MapPin,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function Footer() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subscribeConsent, setSubscribeConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("First Name is mandatory.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last Name is mandatory.");
      return;
    }
    if (!email.trim()) {
      setError("Email Address is mandatory.");
      return;
    }
    if (!subscribeConsent) {
      setError("Please check 'Subscribe to the newsletter' to receive your discount.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          consent: subscribeConsent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Subscription failed. Please check your details.");
      } else {
        setDiscountCode(data.discountCode || "IQTROUSERS10");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (discountCode) {
      navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <footer className="bg-neutral-950 text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <div className="bg-neutral-900/90 rounded-3xl p-8 sm:p-12 border border-neutral-800 mb-16 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Exclusive Welcome Offer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
              Subscribe to the IQ Trousers Newsletter
            </h2>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              Join our sartorial mailing list for new trouser arrivals, fabric insights, and styling edits. Enter your details below to receive an instant <strong className="text-white font-semibold">10% discount code</strong>.
            </p>
          </div>

          {discountCode ? (
            <div className="mt-8 p-6 bg-neutral-800/90 border border-neutral-700 rounded-2xl max-w-xl animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                <Check className="w-4 h-4" />
                <span>Subscription Confirmed! 10% Discount Code Emailed</span>
              </div>
              <p className="text-xs text-neutral-300 mb-4">
                We&apos;ve sent a confirmation to <strong className="text-white">{email}</strong>. You can also use your code immediately:
              </p>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 bg-black border border-neutral-700 rounded-xl font-mono text-base font-bold tracking-wider text-amber-400 select-all">
                  {discountCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="mt-8 space-y-4 max-w-xl">
              {error && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={subscribeConsent}
                    onChange={(e) => setSubscribeConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-neutral-700 bg-neutral-950 text-white focus:ring-white"
                  />
                  <span className="text-xs text-neutral-300 leading-snug">
                    I agree to subscribe to the newsletter and receive promotions, updates, and my 10% discount code. <span className="text-red-400">*</span>
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Submit & Claim 10% Off</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Links & Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Follow Us
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/iqtrousers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
                >
                  <InstagramIcon className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/iqtrouser"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
                >
                  <FacebookIcon className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/faq"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  Terms And Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Physical Address */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Headoffice
            </h3>
            <div className="flex items-start gap-2.5 text-sm text-neutral-300 leading-relaxed">
              <MapPin className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              <p>
                Q-8, Samet Business Park,
                <br />
                Near Parishkar - 2, Khokhra Circle,
                <br />
                Maninagar, Ahmedabad - 380008
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright */}
        <div className="pt-8 text-center text-xs text-neutral-500">
          <p>© 2026 by Krish Clothing Co. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
