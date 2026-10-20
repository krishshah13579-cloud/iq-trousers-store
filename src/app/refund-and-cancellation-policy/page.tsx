import Link from "next/link";
import {
  RotateCcw,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Clock,
  MapPin,
  PackageCheck,
} from "lucide-react";

export const metadata = {
  title: "Refund and Cancellation Policy | IQ Trousers",
  description:
    "Official Refund and Cancellation Policy for IQ Trousers by Krish Clothing Co. No monetary refunds; 7-day exchange for unworn trousers; pre-dispatch cancellations.",
};

export default function RefundAndCancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 text-neutral-700 text-sm leading-relaxed">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-800" />
            <span>PayU & Merchant Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Krish Clothing Co. (Brand: IQ Trousers) • Official Store Policy
          </p>
        </div>

        {/* Quick Highlights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-2">
            <div className="flex items-center gap-2.5 text-amber-900 font-bold">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700" />
              <span>No Refund • Exchange Only</span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              We strictly adhere to a <strong>No Refund Policy</strong> once an order is delivered. In place of refunds, we offer a hassle-free <strong>Exchange Policy within 7 days of delivery</strong> for size adjustments, color variants, or damaged pieces.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-50 border-2 border-neutral-200 space-y-2">
            <div className="flex items-center gap-2.5 text-neutral-900 font-bold">
              <Clock className="w-5 h-5 shrink-0 text-neutral-700" />
              <span>Pre-Dispatch Cancellations</span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Orders can be cancelled free of charge at any time <strong>prior to shipment</strong> directly from your account or by contacting support. 100% full reversal is credited to your payment method within 5–7 business days.
            </p>
          </div>
        </div>

        {/* SECTION 1: REFUND POLICY */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
            <RotateCcw className="w-6 h-6 text-neutral-900" />
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Part I: Refund & Exchange Policy
            </h2>
          </div>

          <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-2.5 text-neutral-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3>1. Strict No-Refund Policy</h3>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              All transactions conducted on IQ Trousers are final once delivered. We do not provide monetary refunds back to bank accounts, credit/debit cards, or UPI under any circumstances.
            </p>
          </section>

          <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-2.5 text-neutral-900 font-bold text-base">
              <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3>2. 7-Day Exchange Policy</h3>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              We want you to find the perfect fit. Customers are entitled to request an <strong className="text-neutral-900">exchange within 7 calendar days from the date of delivery</strong>.
            </p>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-neutral-900">Exchange Conditions:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-neutral-700">
                <li>Garment must be unworn, unwashed, unaltered, and free of stains or odors.</li>
                <li>All original brand tags, labels, and packaging must be intact.</li>
                <li>Exchange request must be submitted within 7 days of confirmed delivery.</li>
              </ul>
            </div>
          </section>

          <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
            <h3 className="font-serif font-bold text-neutral-900 text-base">
              3. How to Initiate an Exchange
            </h3>
            <p className="text-neutral-700 text-xs leading-relaxed">
              Email our support desk at <a href="mailto:krishclothingco3@gmail.com" className="text-neutral-900 font-semibold underline">krishclothingco3@gmail.com</a> or WhatsApp <strong className="text-neutral-900">+91 81287 56632</strong> with your Order ID and desired size. We will arrange a reverse pickup or courier instructions and dispatch your replacement once inspected.
            </p>
          </section>
        </div>

        {/* SECTION 2: CANCELLATION POLICY */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
            <XCircle className="w-6 h-6 text-neutral-900" />
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Part II: Order Cancellation Policy
            </h2>
          </div>

          <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
            <h3 className="font-serif font-bold text-neutral-900 text-base">
              1. Pre-Dispatch Cancellations
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Orders may be cancelled at any time before they enter the shipping stage. Customers can cancel directly from their <Link href="/orders" className="text-neutral-900 underline font-semibold">Orders Page</Link> or by contacting our support team with their Order ID.
            </p>
          </section>

          <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
            <h3 className="font-serif font-bold text-neutral-900 text-base">
              2. Cancellation After Dispatch
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Once an order has shipped, it cannot be cancelled. Customers can exchange the product upon delivery within 7 days in accordance with Part I of this policy.
            </p>
          </section>

          <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
            <h3 className="font-serif font-bold text-neutral-900 text-base">
              3. Refund Turnaround for Pre-Dispatch Cancellations
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              If a prepaid order is cancelled prior to dispatch, a 100% refund is initiated automatically through PayU back to the original payment source. Funds reflect within <strong className="text-neutral-900">5 to 7 business days</strong> depending on your bank&apos;s settlement schedule.
            </p>
          </section>
        </div>

        {/* Business & Support Details */}
        <section className="pt-6 border-t border-neutral-200 space-y-4">
          <h2 className="text-lg font-serif font-bold text-neutral-900">
            Contact & Support
          </h2>
          <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-3">
            <div className="font-semibold text-neutral-900 text-sm">
              Krish Clothing Co. (IQ Trousers)
            </div>
            <div className="flex items-start gap-2.5 text-neutral-700">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <span>
                Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008, Gujarat, India
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-neutral-700">
              <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>krishclothingco3@gmail.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-neutral-700">
              <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>+91 81287 56632</span>
            </div>
            <div className="flex items-center gap-2.5 text-neutral-700">
              <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Mon - Sat: 10:00 AM – 7:00 PM IST</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
