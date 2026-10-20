import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | IQ Trousers",
  description:
    "Official Terms and Conditions, Shipping Policy, Refund & Exchange Policy, and Cancellation Policy for IQ Trousers by Krish Clothing Co.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10 text-neutral-700 text-sm leading-relaxed">
        <div className="border-b border-neutral-200 pb-8">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
            Legal & Customer Policies
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight mt-2">
            Terms and Conditions
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Krish Clothing Co. (IQ Trousers) • Last Updated: October 2026
          </p>
        </div>

        {/* Free Shipping Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <h2 className="text-lg font-serif font-bold text-neutral-900">
            1. Shipping Policy
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            At IQ Trousers, we believe premium service shouldn&apos;t cost extra. That’s why we offer <strong className="text-neutral-900">Free Standard Delivery on all orders across India</strong>. Once your order is placed, it will be processed and dispatched quickly. You will receive a tracking link as soon as your trousers leave our warehouse.
          </p>
        </section>

        {/* Strict No Refund Policy & 7-Day Exchange */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-serif font-bold text-neutral-900">
              2. Refund & Exchange Policy (Strictly No Refunds; 7-Day Exchange Only)
            </h2>
            <Link
              href="/refund-policy"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 underline hover:text-black"
            >
              <span>View Full Refund Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            All purchases made on this website are final. At IQ Trousers, we operate under a strict <strong className="text-neutral-900">No Refund Policy</strong>. We do not provide monetary refunds back to bank accounts, credit cards, or digital wallets once an order is delivered.
          </p>
          <p className="text-neutral-700 leading-relaxed">
            However, we want every customer to enjoy a tailored, confident fit. We offer an <strong className="text-neutral-900">Exchange Policy within 7 days of purchase / delivery</strong> for a different size, fit, or color of the same product. Trousers must be unworn, unwashed, unaltered, and with all original brand tags attached. To initiate an exchange, contact our customer service desk at <strong className="text-neutral-900">krishclothingco3@gmail.com</strong> or call <strong className="text-neutral-900">+91 81287 56632</strong>.
          </p>
        </section>

        {/* Cancellation Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-serif font-bold text-neutral-900">
              3. Order Cancellation Policy
            </h2>
            <Link
              href="/cancellation-policy"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 underline hover:text-black"
            >
              <span>View Full Cancellation Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            Orders can be cancelled free of charge at any time <strong className="text-neutral-900">before they are processed and dispatched from our warehouse</strong>. You can cancel directly from your Orders page or by reaching our support desk with your Order ID. For prepaid orders cancelled prior to dispatch, a 100% refund will be credited back to your original payment method (via PayU) within <strong className="text-neutral-900">5 to 7 business days</strong>. Orders cannot be cancelled once dispatched.
          </p>
        </section>

        {/* Business and Manufacturing Details */}
        <section className="space-y-3 pt-4">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            4. About Our Manufacturing & Operations
          </h2>
          <p>
            This website is operated by <strong className="text-neutral-900">Krish Clothing Co.</strong> under the brand name <strong className="text-neutral-900">IQ Trousers</strong>. All products are manufactured in Ahmedabad adhering to strict garment standards and quality control.
          </p>
        </section>

        {/* Contact Info */}
        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            5. Contact & Support
          </h2>
          <p>
            For order inquiries, tracking updates, cancellations, or exchanges, contact us at:
          </p>
          <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5">
            <p className="font-semibold text-neutral-900 text-sm">Krish Clothing Co. (IQ Trousers)</p>
            <p className="text-neutral-600">Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008, Gujarat, India</p>
            <p className="text-neutral-600">Email: krishclothingco3@gmail.com | Phone: +91 81287 56632</p>
            <p className="text-neutral-600">Customer Care Hours: Mon - Sat, 10:00 AM - 7:00 PM IST</p>
          </div>
        </section>
      </div>
    </div>
  );
}
