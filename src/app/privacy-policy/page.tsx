import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <Header />
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Privacy Policy</h1>
              <p className="text-lg text-neutral-600">Last updated: January 2025</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our newsletter, or contact us for support.
              </p>
              <p>
                This may include your name, email address, phone number, shipping and billing addresses, payment information, and any other information you choose to provide.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and our services</li>
                <li>Send you promotional emails and newsletters (with your consent)</li>
                <li>Improve our website and customer service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">3. Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
              </p>
              <p>We may share your information with:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Payment processors to handle transactions</li>
                <li>Shipping carriers to deliver your orders</li>
                <li>Email service providers to send newsletters (if subscribed)</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">5. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookie settings through your browser preferences.
              </p>
              <p>
                For detailed information about our cookie usage, please refer to our Cookie Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">6. Email Communications</h2>
              <p>
                If you subscribe to our newsletter, you will receive promotional emails about new products, sales, and special offers. You can unsubscribe at any time by clicking the unsubscribe link in our emails.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Access the personal information we have about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">8. Children&apos;s Privacy</h2>
              <p>
                Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">9. International Users</h2>
              <p>
                Gemsutopia operates from Canada. If you are accessing our website from outside Canada, please be aware that your information may be transferred to and stored in Canada.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated &ldquo;Last updated&rdquo; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at gemsutopia@gmail.com.
              </p>
            </section>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}