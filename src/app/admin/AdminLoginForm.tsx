"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  ShieldAlert,
} from "lucide-react";

export default function AdminLoginForm() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");
  const [email, setEmail] = useState("");
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
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

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

  // Step 1: Send credentials and request 2FA verification OTP for ADMIN portal
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
          portal: "ADMIN",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to authenticate administrator. Access Denied.");
        setLoading(false);
        return;
      }

      setMaskedEmail(data.maskedEmail || email.trim());
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setStep("twoFactor");
      setCountdown(60);
      setSuccessMsg(`A 6-digit administrator verification code has been dispatched to ${data.maskedEmail || email.trim()}`);
      setLoading(false);
    } catch {
      setError("Unable to connect to authentication server. Please try again.");
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
          portal: "ADMIN",
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
        setSuccessMsg(`A fresh administrator code has been sent to ${data.maskedEmail || maskedEmail}`);
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

  // Step 2: Verify OTP and complete sign-in through NextAuth with portal: "ADMIN"
  const handleVerifyAndSignIn = async (codeOverride?: string) => {
    const fullCode = (codeOverride || otp.join("")).trim();
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code sent to your administrator email.");
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
        portal: "ADMIN",
        callbackUrl: "/admin",
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.ok) {
        try {
          await fetch("/api/auth/2fa/sync-admin", { method: "POST" });
        } catch {
          // Non-blocking sync
        }

        let role = "ADMIN";
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData?.user?.role) {
              role = sessionData.user.role;
            }
          }
        } catch {
          // fallback
        }

        const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
        if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError("Sign in could not be completed. Access Denied.");
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred during administrator authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-950 text-white antialiased selection:bg-amber-400 selection:text-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 text-white px-8 py-10 shadow-2xl rounded-2xl sm:px-10">
          {/* Header branding */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <img
                src="/iq-trousers-logo-dark-mode.png"
                alt="IQ Trousers"
                className="h-16 w-auto mx-auto object-contain"
              />
            </div>

            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700/80">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Control Portal</span>
              </span>
            </div>

            {step === "credentials" ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Administrator Sign-In
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Enter administrator credentials & 2FA to access Admin Panel
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 text-amber-400 mb-3 shadow-inner border border-zinc-700">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Two-Factor Authorization
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Verification code dispatched to{" "}
                  <span className="font-semibold text-amber-300">{maskedEmail}</span>
                </p>
              </>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-start gap-3 text-emerald-200 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Admin Email and Password Form */}
          {step === "credentials" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium mb-1.5 text-zinc-300"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@iqtrousers.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all bg-zinc-800/90 border border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-sm font-medium text-zinc-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all bg-zinc-800/90 border border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-amber-400 focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 focus:outline-none cursor-pointer"
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
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-amber-400 hover:bg-amber-300 text-zinc-950 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize & Send 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Restricted Access • Monitored Session</span>
              </div>
            </form>
          ) : (
            /* Step 2: 2FA Verification Form */
            <div className="space-y-6">
              {devCode && (
                <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-600/50 text-center animate-in fade-in">
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    Security Verification Code (Auto-Detected)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devCode.slice(0, 6).split("");
                      setOtp(digits);
                    }}
                    className="text-2xl font-mono font-bold tracking-widest text-amber-300 hover:text-white transition-colors cursor-pointer"
                    title="Click to autofill"
                  >
                    {devCode}
                  </button>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Click code above to autofill, or enter manually below.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-center text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
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
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border-2 focus:outline-none transition-all shadow-sm bg-zinc-800 border-zinc-700 text-white focus:border-amber-400 focus:bg-zinc-800 focus:ring-2 focus:ring-amber-400/20"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code Section */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-zinc-400">
                    Resend code available in{" "}
                    <span className="font-semibold text-amber-400">
                      {countdown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                    <span>{resending ? "Dispatching code..." : "Resend code to email"}</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyAndSignIn()}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-amber-400 hover:bg-amber-300 text-zinc-950 active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-zinc-950" />
                      <span>Verify & Enter Admin Panel</span>
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
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use different credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 pt-5 border-t border-zinc-800/80 text-center text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 text-[11px]">
              <ShieldAlert className="w-3 h-3 text-zinc-400" />
              Administrative portal is strictly for authorized personnel.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
