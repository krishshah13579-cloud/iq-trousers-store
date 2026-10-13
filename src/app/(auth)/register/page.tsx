"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Phone OTP verification state
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    setError(null);
    setOtpMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address first to receive your verification code.");
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile phone number first.");
      return;
    }

    setOtpSending(true);

    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code");
      } else {
        setIsOtpSent(true);
        setOtpMessage(data.message || `A 6-digit verification code has been emailed to ${email.trim()}.`);
        setOtpCode(""); // Keep input empty so user enters code from their email
        setResendCountdown(60);
      }
    } catch {
      setError("Unable to connect to verification server. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpVerifying(true);

    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid verification code");
      } else {
        setIsPhoneVerified(true);
        setOtpMessage("Phone number verified successfully!");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError("Phone number is mandatory.");
      return;
    }

    if (!isPhoneVerified) {
      setError("Please verify your phone number with the 6-digit code before creating an account.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          verificationCode: otpCode.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Success: Redirect to login with confirmation
      router.push(
        `/login?registered=1&email=${encodeURIComponent(email.trim())}&welcomeCode=${encodeURIComponent(
          data.couponCode || ""
        )}`
      );
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50/50">
      <div className="w-full max-w-md">
        <div className="bg-white px-8 py-10 shadow-sm border border-gray-100 rounded-2xl sm:px-10">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-3">
              <img
                src="/iq-trousers-logo-transparent.png"
                alt="IQ Trousers"
                className="h-16 w-auto mx-auto object-contain hover:opacity-90 transition-opacity"
              />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Create an Account
            </h1>
            <p className="mt-1.5 text-xs text-gray-500">
              Exclusive bespoke tailoring & precision menswear
            </p>
          </div>

          {/* Welcome Promo Incentive Banner */}
          <div className="mb-6 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold text-amber-950">10% Welcome Discount:</strong> Register and verify your mobile number to receive your unique coupon code valid for 7 days!
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {otpMessage && !error && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{otpMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Mobile Phone Number (Mandatory) */}
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                Mobile Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    disabled={isPhoneVerified}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setIsPhoneVerified(false);
                      setIsOtpSent(false);
                    }}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                {!isPhoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || resendCountdown > 0 || !phone.trim()}
                    className="px-3.5 py-2 text-xs font-medium bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 shrink-0 transition-colors"
                  >
                    {otpSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : resendCountdown > 0 ? (
                      `Resend (${resendCountdown}s)`
                    ) : isOtpSent ? (
                      "Resend Code"
                    ) : (
                      "Send Code"
                    )}
                  </button>
                )}

                {isPhoneVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                A 6-digit verification code will be sent to your email to verify this mobile number and issue your 10% coupon.
              </p>
            </div>

            {/* OTP Code Entry (When OTP is sent but not yet verified) */}
            {isOtpSent && !isPhoneVerified && (
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl animate-fadeIn">
                <label htmlFor="otp" className="block text-xs font-medium text-gray-700 mb-1">
                  Enter 6-Digit Code Sent to Your Email <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2 font-mono text-center tracking-widest text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otpCode.trim().length !== 6}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 disabled:opacity-50 shrink-0 transition-colors"
                  >
                    {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Phone"}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPhoneVerified}
              className="w-full !mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Create Account & Claim 10% Off</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-gray-900 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
