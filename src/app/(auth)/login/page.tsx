"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  KeyRound,
} from "lucide-react";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");
  const registered = searchParams.get("registered");
  const welcomeCode = searchParams.get("welcomeCode");
  const reset = searchParams.get("reset");
  const initialEmail = searchParams.get("email") || "";

  // Step state
  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  // OTP State (6 digits)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(
    urlError ? "Invalid credentials or session expired. Please sign in again." : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(
    reset
      ? "Your password has been successfully reset! Please sign in with your new password."
      : registered
      ? welcomeCode
        ? `Account created! Your 10% welcome coupon (${welcomeCode}) has been emailed to you and is valid for 7 days. Sign in below to use it!`
        : "Account registered successfully! Please sign in below."
      : null
  );
  const [devCode, setDevCode] = useState<string | null>(null);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Autofocus the first OTP input when transitioning to twoFactor step
  useEffect(() => {
    if (step === "twoFactor") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Step 1: Send credentials and request 2FA verification OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: "STORE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to verify credentials. Please try again.");
        setLoading(false);
        return;
      }

      setMaskedEmail(data.maskedEmail || email.trim());
      if (data.role) {
        setDetectedRole(data.role);
      }
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setStep("twoFactor");
      setCountdown(60);
      setSuccessMsg(`A 6-digit verification code has been dispatched to ${data.maskedEmail || email.trim()}`);
      setLoading(false);
    } catch {
      setError("Unable to connect to verification service. Please try again.");
      setLoading(false);
    }
  };

  // Resend 2FA verification code
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/2fa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: "STORE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend verification code. Please wait a moment.");
      } else {
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setCountdown(60);
        setOtp(["", "", "", "", "", ""]);
        setSuccessMsg(`A fresh verification code has been sent to ${data.maskedEmail || maskedEmail}`);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error while resending verification code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const digit = cleanValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      const fullCode = newOtp.join("");
      if (fullCode.length === 6) {
        handleVerifyAndSignIn(fullCode);
      }
    }
  };

  // Handle backspace navigation between OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting 6-digit code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const targetFocus = Math.min(pasted.length, 5);
    inputRefs.current[targetFocus]?.focus();

    if (pasted.length === 6) {
      handleVerifyAndSignIn(pasted);
    }
  };

  // Step 2: Verify OTP and complete sign-in through NextAuth
  const handleVerifyAndSignIn = async (codeOverride?: string) => {
    const fullCode = (codeOverride || otp.join("")).trim();
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code sent to your email.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        code: fullCode,
        portal: "STORE",
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.ok) {
        let role = detectedRole;
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData?.user?.role) {
              role = sessionData.user.role;
            }
          }
        } catch {
          // fallback to detectedRole
        }

        const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
        const hasSpecificDestination =
          callbackUrl && callbackUrl !== "/" && callbackUrl !== "/login";

        if (hasSpecificDestination) {
          router.push(callbackUrl);
        } else if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError("Sign in could not be completed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred during verification.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50/50">
      <div className="w-full max-w-md">
        <div className="bg-white px-8 py-10 shadow-sm border border-gray-100 rounded-2xl sm:px-10">
          {/* Header branding */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/iq-trousers-logo-transparent.png"
                alt="IQ Trousers"
                className="h-16 w-auto mx-auto object-contain hover:opacity-90 transition-opacity"
              />
            </Link>

            {step === "credentials" ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Welcome back
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Sign in with two-factor email verification
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 text-amber-400 mb-3 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Two-Factor Verification
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  We sent a 6-digit one-time code to{" "}
                  <span className="font-semibold text-zinc-900">{maskedEmail}</span>
                </p>
              </>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Email and Password Form */}
          {step === "credentials" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5 text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-gray-600 hover:text-black hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-gray-900 hover:bg-gray-800 text-white"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Continue with 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Protected by IQ Two-Factor Verification</span>
              </div>
            </form>
          ) : (
            /* Step 2: 2FA Verification Form */
            <div className="space-y-6">
              {devCode && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center animate-in fade-in">
                  <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
                    Security Verification Code (Auto-Detected)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devCode.slice(0, 6).split("");
                      setOtp(digits);
                    }}
                    className="text-2xl font-mono font-bold tracking-widest text-gray-900 hover:text-black transition-colors cursor-pointer"
                    title="Click to autofill"
                  >
                    {devCode}
                  </button>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Click code above to autofill, or enter manually below.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-center text-xs uppercase tracking-wider font-semibold text-gray-400 mb-3">
                  Enter 6-Digit Verification Code
                </label>
                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border-2 focus:outline-none transition-all shadow-sm bg-zinc-50 border-gray-200 text-gray-900 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code Section */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">
                    Resend code available in{" "}
                    <span className="font-semibold text-gray-600">
                      {countdown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline disabled:opacity-50 cursor-pointer text-gray-900 hover:text-black"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                    <span>{resending ? "Sending fresh code..." : "Resend code to email"}</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyAndSignIn()}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verify & Complete Sign In</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp(["", "", "", "", "", ""]);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors cursor-pointer text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use different email or re-enter password</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Registration Link */}
          {step === "credentials" && (
            <div className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-gray-900 hover:underline"
              >
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
