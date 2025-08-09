import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsOfService() {
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
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Terms of Service</h1>
              <p className="text-lg text-neutral-600">Last updated: January 2025</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Gemsutopia&apos;s website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">2. Products and Services</h2>
              <p>
                Gemsutopia offers premium gemstones and jewelry pieces, many of which are hand-mined and ethically sourced from Alberta, Canada. All product descriptions, images, and specifications are provided to the best of our knowledge and ability.
              </p>
              <p>
                We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">3. Orders and Payment</h2>
              <p>
                By placing an order through our website, you are making an offer to purchase products subject to these terms. All orders are subject to availability and confirmation.
              </p>
              <p>
                Payment is required at the time of purchase. We accept major credit cards, PayPal, and other payment methods as displayed on our website. All prices are in Canadian dollars unless otherwise stated.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">4. Shipping and Delivery</h2>
              <p>
                Shipping times are estimates and may vary. We are not responsible for delays caused by shipping carriers, customs, or other factors beyond our control.
              </p>
              <p>
                Risk of loss and title for items purchased from Gemsutopia pass to you upon delivery to the shipping carrier.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">5. Returns and Refunds</h2>
              <p>
                Please refer to our Returns & Exchange policy for detailed information about returns, exchanges, and refunds. All returns must be authorized and comply with our return policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">6. Intellectual Property</h2>
              <p>
                All content on this website, including text, graphics, logos, images, and software, is the property of Gemsutopia and is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">7. Limitation of Liability</h2>
              <p>
                Gemsutopia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">8. Privacy</h2>
              <p>
                Your privacy is important to us. Please refer to our Privacy Policy for information about how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at gemsutopia@gmail.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the service constitutes acceptance of the modified terms.
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