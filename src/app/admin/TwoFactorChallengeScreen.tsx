"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/clientLogout";
import {
  ShieldCheck,
  Lock,
  Mail,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronLeft,
  Inbox,
} from "lucide-react";

interface TwoFactorChallengeScreenProps {
  userEmail: string;
  userName?: string | null;
}

export default function TwoFactorChallengeScreen({
  userEmail,
  userName = "Administrator",
}: TwoFactorChallengeScreenProps) {
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean>(true);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const canResend = countdown <= 0;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendNewCode = async () => {
    setSendingCode(true);
    setError(null);
    setSendSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/2fa/send", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate verification password");
      }
      setSendSuccessMessage(data.message || `Code sent to ${userEmail}`);
      if (data.smtpConfigured !== undefined) {
        setSmtpConfigured(Boolean(data.smtpConfigured));
      }
      if (data.devCode) {
        setDevCode(data.devCode);
      } else {
        setDevCode(null);
      }
      setCountdown(30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setSendingCode(false);
    }
  };

  // Request code on mount
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) sendNewCode();
    });
    return () => {
      active = false;
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");

    if (cleanValue.length > 1) {
      // User pasted multiple numbers in one box
      handlePastedCode(cleanValue);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanValue;
    setDigits(nextDigits);
    setError(null);

    // Auto-advance
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    if (cleanValue && index === 5) {
      const fullCode = nextDigits.join("");
      if (fullCode.length === 6) {
        submitCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePastedCode = (pasted: string) => {
    const clean = pasted.replace(/[^0-9]/g, "").slice(0, 6);
    if (!clean) return;

    const nextDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < clean.length; i++) {
      nextDigits[i] = clean[i];
    }
    setDigits(nextDigits);
    setError(null);

    const targetIndex = Math.min(clean.length, 5);
    inputRefs.current[targetIndex]?.focus();

    if (clean.length === 6) {
      submitCode(clean);
    }
  };

  const submitCode = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || digits.join("");
    if (finalCode.length !== 6) {
      setError("Please enter the complete 6-digit code sent to your email.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: finalCode,
          rememberDevice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess(true);

      // Reload page to enter admin dashboard smoothly
      setTimeout(() => {
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or expired code. Please check your email or request a new code."
      );
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        {/* Brand Shield Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center shadow-inner relative">
            <Lock className="w-8 h-8 text-neutral-100" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-neutral-900 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Direct Database &amp; Email Verification Gate
            </p>
          </div>
        </div>

        {/* User Identity Chip */}
        <div className="p-3.5 bg-neutral-900/80 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-200">
              {userName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white">{userName}</p>
              <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Admin
          </span>
        </div>

        {/* Email Instruction Box */}
        <div className="p-4 bg-neutral-950/80 border border-neutral-800/90 rounded-2xl text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>One-Time Password Sent to Email</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            A temporary 6-digit verification password has been generated and sent to:
          </p>
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 font-medium break-all flex items-center gap-2">
            <Inbox className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{userEmail}</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Please check your inbox (and spam/junk folder). The code expires in 10 minutes.
          </p>
        </div>

        {/* Development SMTP Alert (shown only when SMTP is not configured in .env) */}
        {!smtpConfigured && devCode && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Email Service Not Connected Yet</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Outgoing email could not be delivered to <strong className="text-white">{userEmail}</strong> because mail server credentials (<code className="text-amber-300">SMTP_PASS</code>) are currently empty in your <code className="text-amber-300">.env</code> file.
            </p>
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">Your Security Code:</span>
              <button
                type="button"
                onClick={() => handlePastedCode(devCode)}
                className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 text-sm bg-neutral-950 px-2.5 py-1 rounded-lg border border-amber-500/30 hover:border-amber-400 hover:text-white transition-all cursor-pointer"
                title="Click to auto-fill code"
              >
                <span>{devCode}</span>
                <span className="text-[10px] font-sans font-normal text-amber-400/80 underline">(Click to Fill)</span>
              </button>
            </div>
          </div>
        )}

        {/* Sent Success Toast */}
        {sendSuccessMessage && !error && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sendSuccessMessage}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit PIN Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCode();
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300 text-center uppercase tracking-wider">
              Enter 6-Digit Email Code
            </label>

            <div className="flex justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  disabled={submitting || success}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text");
                    handlePastedCode(text);
                  }}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border transition-all focus:outline-hidden ${
                    digit
                      ? "bg-neutral-900 border-white text-white shadow-xs"
                      : "bg-neutral-900/60 border-neutral-800 text-neutral-300 focus:border-neutral-500 focus:bg-neutral-900"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Remember Device Option */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-white focus:ring-0"
              />
              <span>Remember this device for 7 days</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || success || digits.some((d) => d === "")}
            className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
              success
                ? "bg-emerald-500 text-white"
                : "bg-white text-neutral-950 hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {success ? (
              <>
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                <span>Identity Verified! Loading Admin...</span>
              </>
            ) : submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Database Record...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
                <span>Verify &amp; Unlock Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Resend & Session Footer */}
        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
          <button
            type="button"
            disabled={!canResend || sendingCode}
            onClick={sendNewCode}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sendingCode ? "animate-spin" : ""}`} />
            <span>
              {canResend ? "Resend code to email" : `Resend email code in ${countdown}s`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => performLogout("/")}
            className="inline-flex items-center gap-1 text-neutral-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
