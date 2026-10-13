export const metadata = {
  title: "Terms and Conditions & Shipping Policy | IQ Trousers",
  description: "Official shipping policy, exchange policy, and terms of service by Krish Clothing Co.",
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
        </div>

        {/* Shipping Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <h2 className="text-lg font-serif font-bold text-neutral-900">
            Shipping Policy
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            At IQ Trousers, we believe premium service shouldn&apos;t cost extra. That’s why we offer <strong className="text-neutral-900">Free Standard Delivery on all orders across India</strong>. Once your order is placed, it will be processed and dispatched quickly. You will receive a tracking link as soon as your trousers leave our warehouse.
          </p>
        </section>

        {/* Exchange Policy */}
        <section className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-3">
          <h2 className="text-lg font-serif font-bold text-neutral-900">
            Exchange Policy
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            We want you to find the perfect fit. While we do not offer refunds or returns, we are happy to offer an <strong className="text-neutral-900">exchange for a different size or color</strong>. Exchanges are accepted within <strong className="text-neutral-900">7 days of delivery</strong>, provided the trousers are unworn, unwashed, and still have their original tags attached. Please contact our support team to initiate an exchange.
          </p>
        </section>

        {/* Business and Manufacturing Details */}
        <section className="space-y-3 pt-4">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            About Our Manufacturing & Operations
          </h2>
          <p>
            This website is operated by <strong className="text-neutral-900">Krish Clothing Co.</strong> under the brand name <strong className="text-neutral-900">IQ Trousers</strong>. All products are manufactured in Ahmedabad adhering to strict garment standards and quality control.
          </p>
        </section>

        {/* Contact Info */}
        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            Contact & Support
          </h2>
          <p>
            For order inquiries, tracking updates, or exchanges, contact us at:
          </p>
          <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5">
            <p className="font-semibold text-neutral-900 text-sm">Krish Clothing Co. (IQ Trousers)</p>
            <p className="text-neutral-600">Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008</p>
            <p className="text-neutral-600">Customer Care: Mon - SAT, 10am - 7pm</p>
          </div>
        </section>
      </div>
    </div>
  );
}
