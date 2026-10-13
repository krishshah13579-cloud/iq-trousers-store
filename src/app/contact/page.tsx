"use client";

import { useState } from "react";
import { MapPin, Mail, Phone, Clock, CheckCircle2, Send, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-neutral-900 tracking-tight mt-2">
            Contact IQ Trousers
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base mt-3 leading-relaxed">
            Have questions about fit, fabric care, or wholesale bulk manufacturing? Our team at Krish Clothing Co. is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details & Address */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200 space-y-6">
              <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-4">
                Headquarters
              </h2>

              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-neutral-900 shrink-0 mt-1" />
                <div className="text-sm text-neutral-700 leading-relaxed">
                  <p className="font-semibold text-neutral-900">Krish Clothing Co.</p>
                  <p>Q-8, Samet Business Park,</p>
                  <p>Near Parishkar - 2, Khokhra Circle,</p>
                  <p>Maninagar, Ahmedabad - 380008</p>
                  <p className="text-xs text-neutral-500 mt-1">Gujarat, India</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Mail className="w-5 h-5 text-neutral-900 shrink-0" />
                <div className="text-sm text-neutral-700">
                  <p className="font-semibold text-neutral-900">Email Inquiries</p>
                  <p className="text-xs text-neutral-500">krishclothingco3@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Phone className="w-5 h-5 text-neutral-900 shrink-0" />
                <div className="text-sm text-neutral-700">
                  <p className="font-semibold text-neutral-900">Client Care Line</p>
                  <p className="text-xs text-neutral-500">+91 81287 56632</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Clock className="w-5 h-5 text-neutral-900 shrink-0" />
                <div className="text-sm text-neutral-700">
                  <p className="font-semibold text-neutral-900">Customer Care Hours</p>
                  <p className="text-xs text-neutral-500">
                    Mon - Sat, 10:00 AM - 7:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-neutral-900 mb-2">
                Send Us a Message
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Fill out the form below and an IQ Trousers representative will respond within 24 hours.
              </p>

              {submitted ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3 animate-fadeIn">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-serif font-bold text-neutral-900">
                    Message Received
                  </h3>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                    Thank you, {name}. Our client support desk in Ahmedabad has received your inquiry and will be in touch shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setSubject("");
                      setMessage("");
                    }}
                    className="mt-4 px-5 py-2 text-xs font-semibold text-neutral-700 hover:text-black border border-neutral-300 rounded-lg"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Inquiry Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Fit question, order status, etc."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we assist you with IQ Trousers?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Inquiry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
