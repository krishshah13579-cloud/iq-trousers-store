import Link from "next/link";
import {
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Clock,
  MapPin,
  ArrowRight,
  PackageCheck,
} from "lucide-react";

export const metadata = {
  title: "Refund & Exchange Policy | IQ Trousers",
  description:
    "Official Refund and Exchange Policy for IQ Trousers by Krish Clothing Co. No monetary refunds; 7-day exchange for unworn trousers.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10 text-neutral-700 text-sm leading-relaxed">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Customer Service & Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
            Refund & Exchange Policy
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Last Updated: October 2026 • Krish Clothing Co. (IQ Trousers)
          </p>
        </div>

        {/* Core Summary Alert Box */}
        <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-serif font-bold text-neutral-900">
                Summary of Our Policy: No Refund, Exchange Within 7 Days
              </h2>
              <p className="text-neutral-800 text-sm leading-relaxed">
                At IQ Trousers, we operate under a strict <strong>No Refund Policy</strong>. We do not provide monetary refunds back to bank accounts, credit/debit cards, UPI, or digital wallets once an order is delivered. However, we are fully committed to ensuring you find the right fit and style: we offer an <strong>Exchange Policy within 7 days of purchase / delivery</strong> for size adjustments, color preferences, or manufacturing replacements.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Strict No Refund Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
          <div className="flex items-center gap-3 text-neutral-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-xl font-serif font-bold">1. No Refund Policy</h2>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            All purchases made through our website (<strong>iqtrousers.com</strong> / <strong>iq-trousers-store-uge4.vercel.app</strong>) are non-refundable. Once an order has been successfully confirmed, dispatched, and delivered to the customer&apos;s shipping address:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-neutral-700">
            <li>No cash, bank transfer, card reversal, or wallet refunds will be issued under any circumstances.</li>
            <li>Orders cannot be returned for a cash equivalent or balance transfer.</li>
            <li>In the event of fitting issues or dissatisfaction with size, the customer is eligible for an <strong>exchange only</strong>, subject to the conditions outlined below.</li>
          </ul>
        </section>

        {/* 2. 7-Day Exchange Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
          <div className="flex items-center gap-3 text-neutral-900">
            <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <h2 className="text-xl font-serif font-bold">
              2. 7-Day Exchange Policy
            </h2>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            We want every customer to experience the supreme comfort and precision tailoring of IQ Trousers. If your trousers do not fit perfectly, you may exchange them within <strong className="text-neutral-900">7 calendar days from the date of delivery</strong>.
          </p>

          <div className="mt-4 space-y-3">
            <h3 className="font-semibold text-neutral-900 text-sm">
              Exchange Eligibility Criteria:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Garment must be <strong>unworn, unwashed, and unaltered</strong>.</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>All <strong>original tags, labels, and packaging</strong> must be intact.</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Exchange request must be raised within <strong>7 days</strong> of delivery.</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Valid proof of purchase / Order ID must be provided.</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Non-Exchangeable Items:</strong> Trousers showing signs of wear, stains, alterations (hemming/shortening), perfume scents, washing, or missing tags are strictly ineligible for exchange and will be sent back to the customer.
          </div>
        </section>

        {/* 3. How to Initiate an Exchange */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900">
            3. How to Initiate an Exchange
          </h2>
          <ol className="space-y-4 text-neutral-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-neutral-900">Submit an Exchange Request:</strong>
                <p className="mt-0.5 text-xs text-neutral-600">
                  Email our support team at <a href="mailto:krishclothingco3@gmail.com" className="text-neutral-900 underline font-medium">krishclothingco3@gmail.com</a> or message on WhatsApp at <strong className="text-neutral-900">+91 81287 56632</strong> within 7 days of delivery. Mention your <strong>Order ID</strong> and the replacement size or color you desire.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-neutral-900">Reverse Pickup / Dispatch:</strong>
                <p className="mt-0.5 text-xs text-neutral-600">
                  Our customer service team will coordinate a reverse courier pickup from your address (serviceable pin-codes) or provide our return warehouse address for self-shipment.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-neutral-900">Quality Inspection & Replacement:</strong>
                <p className="mt-0.5 text-xs text-neutral-600">
                  Upon receiving the original pair at our Ahmedabad tailoring facility, our quality team conducts a standard tag and garment inspection within 24–48 hours. Your newly requested size will then be dispatched immediately with free tracking.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* 4. Defective or Damaged Products */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <h2 className="text-xl font-serif font-bold text-neutral-900">
            4. Damaged, Defective, or Incorrect Items
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            Every trouser goes through multiple inspection stages before dispatch. However, if you receive a damaged piece, a fabric defect, or an incorrect size/model, please notify us within <strong className="text-neutral-900">48 hours of delivery</strong> with photos or video of the issue. We will expedite a hassle-free, complimentary exchange for a brand-new replacement pair at zero additional cost.
          </p>
        </section>

        {/* Contact & Support Section */}
        <section className="space-y-4 pt-4">
          <h2 className="text-lg font-serif font-bold text-neutral-900">
            Customer Support & Grievance Contact
          </h2>
          <p className="text-neutral-600 text-xs">
            For all exchange requests, tracking updates, and questions regarding this policy, reach us directly:
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

        {/* Quick Link to Cancellation Policy */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-neutral-900 text-white rounded-2xl">
          <div>
            <p className="text-sm font-semibold">Need information on Order Cancellations?</p>
            <p className="text-xs text-neutral-400">View terms for cancelling an order before dispatch.</p>
          </div>
          <Link
            href="/cancellation-policy"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors shrink-0"
          >
            <span>Cancellation Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
