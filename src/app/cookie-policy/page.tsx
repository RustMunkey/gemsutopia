import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CookiePolicy() {
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
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Cookie Policy</h1>
              <p className="text-lg text-neutral-600">Last updated: January 2025</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They help us provide you with a better browsing experience and allow certain features to function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">How We Use Cookies</h2>
              <p>Gemsutopia uses cookies for the following purposes:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic website functionality, shopping cart, and checkout process</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous information</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings to enhance your experience</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign effectiveness</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Types of Cookies We Use</h2>
              
              <h3 className="text-lg font-semibold text-black mb-2">Essential Cookies</h3>
              <p className="mb-4">
                These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting privacy preferences, logging in, or filling in forms.
              </p>

              <h3 className="text-lg font-semibold text-black mb-2">Analytics Cookies</h3>
              <p className="mb-4">
                We use analytics cookies to understand how visitors use our website. This helps us improve our website performance and user experience. All information collected is anonymous.
              </p>

              <h3 className="text-lg font-semibold text-black mb-2">Marketing Cookies</h3>
              <p className="mb-4">
                These cookies track your browsing activity to help us show you relevant advertisements. They may be set by us or third-party advertising partners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Managing Your Cookie Preferences</h2>
              <p>
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to control cookies through their settings preferences</li>
                <li><strong>Cookie Settings:</strong> Use our Cookie Settings page to manage your preferences</li>
                <li><strong>Opt-Out:</strong> You can opt-out of certain cookies, though this may affect website functionality</li>
              </ul>
              <p>
                Please note that disabling certain cookies may impact your browsing experience and prevent some features from working properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Third-Party Cookies</h2>
              <p>
                Some cookies on our website are set by third-party services we use, such as:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Google Analytics (for website analytics)</li>
                <li>Payment processors (for secure transactions)</li>
                <li>Social media platforms (for social sharing features)</li>
                <li>Email marketing services (for newsletter functionality)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Cookie Retention</h2>
              <p>
                Cookies remain on your device for different periods depending on their type:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain for a set period or until you delete them</li>
                <li><strong>Essential Cookies:</strong> Typically expire after 1 year</li>
                <li><strong>Analytics Cookies:</strong> Usually expire after 2 years</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Your Consent</h2>
              <p>
                By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by adjusting your cookie settings or browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We encourage you to review this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us at gemsutopia@gmail.com.
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