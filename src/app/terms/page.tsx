export const metadata = {
  title: "Terms and Conditions | IQ Trousers",
  description: "Terms and Conditions of sale, use, and service by Krish Clothing Co.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-neutral-700 text-sm leading-relaxed">
        <div className="border-b border-neutral-200 pb-8">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
            Legal & Policy
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight mt-2">
            Terms and Conditions
          </h1>
          <p className="text-xs text-neutral-500 mt-2">
            Effective Date: January 1, 2026 | Krish Clothing Co.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            1. Overview & Agreement
          </h2>
          <p>
            This website is operated by <strong className="text-neutral-900">Krish Clothing Co.</strong> doing business as <strong className="text-neutral-900">IQ Trousers</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), registered at Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008, Gujarat, India. By accessing or purchasing from our platform, you agree to comply with and be bound by the following terms and conditions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            2. Products & Sizing Accuracy
          </h2>
          <p>
            We take every precaution to display our trouser fabrics, cuts, and colors with utmost fidelity. Available sizes range from 28 to 44. Minor variations in fabric batch shade and measurement tolerances within +/- 0.5 inches are considered acceptable industrial standards in bespoke and ready-to-wear tailoring.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            3. Promotional Codes & Discounts
          </h2>
          <p>
            The 10% welcome discount code (<code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-900">IQTROUSERS10</code>) generated via our newsletter subscription is non-transferable, intended for single use per customer, and cannot be stacked with other promotional vouchers unless specified otherwise.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            4. Shipping & Delivery
          </h2>
          <p>
            Orders are processed and dispatched within 24 to 48 business hours from Ahmedabad. Tracking numbers are transmitted via email upon courier handover. We are not liable for delays resulting from logistical carrier strikes, weather emergencies, or incorrect recipient addresses.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-serif font-bold text-neutral-900">
            5. Contact Information
          </h2>
          <p>
            Questions regarding these Terms and Conditions should be directed to our legal and customer compliance desk:
          </p>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
            <p className="font-semibold text-neutral-900">Krish Clothing Co. (IQ Trousers)</p>
            <p>Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008</p>
            <p>Email: support@iqtrousers.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
