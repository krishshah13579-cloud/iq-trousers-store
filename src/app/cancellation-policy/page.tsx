import Link from "next/link";
import {
  XCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

export const metadata = {
  title: "Cancellation Policy | IQ Trousers",
  description:
    "Official Order Cancellation Policy for IQ Trousers by Krish Clothing Co. Hassle-free pre-dispatch cancellations with full refund within 5-7 days.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10 text-neutral-700 text-sm leading-relaxed">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <XCircle className="w-3.5 h-3.5" />
            <span>Customer Service & Order Guidelines</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
            Cancellation Policy
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Last Updated: October 2026 • Krish Clothing Co. (IQ Trousers)
          </p>
        </div>

        {/* Core Summary Alert Box */}
        <div className="bg-neutral-50 border-2 border-neutral-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-serif font-bold text-neutral-900">
                Summary: Cancellations Permitted Prior to Dispatch
              </h2>
              <p className="text-neutral-800 text-sm leading-relaxed">
                Orders can be cancelled free of charge at any time <strong>before they are processed, packed, and dispatched from our warehouse</strong>. Once an order has been shipped and handed over to our courier partners, it cannot be cancelled. In that case, you may exchange the trousers within <strong>7 days of delivery</strong> as per our Exchange Policy.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Pre-Dispatch Cancellation Window */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
          <div className="flex items-center gap-3 text-neutral-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <h2 className="text-xl font-serif font-bold">
              1. Cancellation Before Dispatch
            </h2>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            We process orders rapidly to guarantee quick delivery. If you wish to cancel an order after placing it:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-neutral-700">
            <li>You can cancel your order directly from your account by navigating to <Link href="/orders" className="text-neutral-900 underline font-semibold">My Orders</Link> as long as the status is marked as <strong>PENDING</strong> or <strong>CONFIRMED</strong>.</li>
            <li>Alternatively, you can contact our customer support team immediately at <a href="mailto:krishclothingco3@gmail.com" className="text-neutral-900 underline font-medium">krishclothingco3@gmail.com</a> or call/WhatsApp <strong className="text-neutral-900">+91 81287 56632</strong> with your <strong>Order ID</strong>.</li>
            <li>Upon pre-dispatch cancellation, any applied discount coupons are immediately restored to your account for future use.</li>
          </ul>
        </section>

        {/* 2. Post-Dispatch Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
          <div className="flex items-center gap-3 text-neutral-900">
            <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-xl font-serif font-bold">
              2. Cancellation After Dispatch
            </h2>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            Once an order status has changed to <strong>SHIPPED</strong> and tracking credentials have been generated, the consignment is in transit with third-party logistics partners and <strong>cannot be cancelled or intercepted</strong>.
          </p>
          <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-700 leading-relaxed">
            <strong>Next Step:</strong> Upon receiving your shipment, if the trousers do not meet your size or style expectations, please take advantage of our <strong className="text-neutral-900">7-Day Exchange Policy</strong>. We will happily exchange the trousers for your preferred size or color variant.
          </div>
        </section>

        {/* 3. Refund Process for Cancelled Orders */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900">
            3. Refund Process for Pre-Dispatch Cancellations
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            When an order is successfully cancelled before dispatch:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% Full Reversal</span>
              </div>
              <p className="text-neutral-600">
                The entire order amount including taxes and shipping will be refunded to the original payment method used during checkout (Credit Card, Debit Card, Net Banking, or UPI via PayU).
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-semibold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>5 to 7 Working Days</span>
              </div>
              <p className="text-neutral-600">
                Refunds are processed automatically through PayU and typically reflect in your bank account or card statement within 5 to 7 business days, in accordance with standard Indian banking settlement cycles.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Cancellation by IQ Trousers */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <h2 className="text-xl font-serif font-bold text-neutral-900">
            4. Cancellation by IQ Trousers / Krish Clothing Co.
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            In rare events such as unexpected stock discrepancies, non-serviceable pin codes, or failed pre-shipment quality audits, IQ Trousers reserves the right to cancel an order. If this occurs:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-700 text-xs">
            <li>You will be immediately informed via email and SMS.</li>
            <li>A 100% full refund will be initiated to your original payment method immediately.</li>
          </ul>
        </section>

        {/* Contact & Support Section */}
        <section className="space-y-4 pt-4">
          <h2 className="text-lg font-serif font-bold text-neutral-900">
            Assistance & Order Help Desk
          </h2>
          <p className="text-neutral-600 text-xs">
            If you need help cancelling an order or have questions regarding a reversal, contact us:
          </p>
          <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-3">
            <div className="font-semibold text-neutral-900 text-sm">
              Krish Clothing Co. (Brand: IQ Trousers)
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
              <span>Monday to Saturday: 10:00 AM – 7:00 PM IST</span>
            </div>
          </div>
        </section>

        {/* Quick Link to Refund Policy */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-neutral-900 text-white rounded-2xl">
          <div>
            <p className="text-sm font-semibold">Have you already received your order?</p>
            <p className="text-xs text-neutral-400">Read our 7-Day Exchange Policy for size and color swaps.</p>
          </div>
          <Link
            href="/refund-policy"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund & Exchange Policy</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
