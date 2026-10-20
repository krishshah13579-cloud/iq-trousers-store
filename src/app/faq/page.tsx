import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions | IQ Trousers",
  description: "Common questions and answers regarding IQ Trousers sizing, shipping, fabrics, and returns.",
};

const FAQS = [
  {
    q: "What sizes are available in IQ Trousers?",
    a: "We produce an extensive sizing range engineered with specific waist, rise, and thigh proportions to ensure an optimal tailored fit. Please consult our Size Guide in the navigation bar for detailed measurements.",
  },
  {
    q: "How do I choose between Casual Everyday and Formal Wear?",
    a: "Our Casual Everyday line features flexible 4-way stretch cotton twill, relaxed chinos, and durable denim engineered for daily work and weekend versatility. Our Formal Wear line utilizes high-twist tropical wool and Super 120s Italian fabrics designed for black-tie, boardrooms, and ceremonial events.",
  },
  {
    q: "How does the 10% Newsletter discount code work?",
    a: "When you subscribe via the form in our footer with your First Name, Last Name, and Email, an exclusive 10% discount promo code is delivered straight to your email. Simply enter the code from your email at checkout to receive 10% off your purchase.",
  },
  {
    q: "Where are IQ Trousers shipped from?",
    a: "All orders are fulfilled and dispatched directly from our Krish Clothing Co. headquarters at Samet Business Park, Khokhra Circle, Maninagar, Ahmedabad.",
  },
  {
    q: "What is your refund, exchange, and cancellation policy?",
    a: "We operate under a strict No Refund Policy once an order has been delivered. However, we offer hassle-free size and color exchanges within 7 days of purchase / delivery for unworn, unwashed garments with tags intact. Orders can also be cancelled before dispatch for a 100% full refund within 5–7 business days. Contact our support desk at krishclothingco3@gmail.com or +91 81287 56632 to initiate an exchange or cancellation.",
  },
  {
    q: "How should I care for my wool and linen trousers?",
    a: "For pure wool formal trousers, we recommend eco-friendly dry cleaning. For our casual cotton chinos and denim, wash cold inside-out and hang dry to preserve color intensity and fabric elasticity.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Customer Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-neutral-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-neutral-500 text-sm mt-3">
            Everything you need to know about IQ Trousers tailoring, orders, and care.
          </p>
        </div>

        <div className="space-y-6">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-neutral-50 rounded-2xl p-6 sm:p-8 border border-neutral-200"
            >
              <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 mb-2">
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-neutral-900 text-white rounded-2xl text-center">
          <h3 className="text-lg font-serif font-bold">Still have a question?</h3>
          <p className="text-xs text-neutral-400 mt-1 mb-5">
            Our customer concierge in Ahmedabad is available to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
