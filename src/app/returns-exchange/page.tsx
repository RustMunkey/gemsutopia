import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReturnsExchange() {
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
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Returns & Exchange</h1>
              <p className="text-lg text-neutral-600">We want you to love your gemstones</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Our Return Policy</h2>
              <p>
                At Gemsutopia, we want you to be completely satisfied with your purchase. If for any reason you&apos;re not happy with your gemstones, we offer a hassle-free return policy.
              </p>
              <p>
                <strong>Return Window:</strong> You have 30 days from the date of delivery to return your items for a full refund or exchange.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">What Can Be Returned</h2>
              <p>We accept returns for:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Gemstones in their original condition</li>
                <li>Jewelry pieces that haven&apos;t been resized or altered</li>
                <li>Items that are unworn and undamaged</li>
                <li>Products in their original packaging with all certificates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Items We Cannot Accept</h2>
              <p>For hygiene and safety reasons, we cannot accept returns for:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Custom or personalized jewelry pieces</li>
                <li>Items that have been resized or altered</li>
                <li>Gemstones that show signs of damage or wear</li>
                <li>Items without original packaging or certificates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">How to Start a Return</h2>
              <p>To initiate a return, please follow these simple steps:</p>
              <ol className="list-decimal ml-6 space-y-2">
                <li>Contact us at gemsutopia@gmail.com with your order number</li>
                <li>Include photos of the item(s) you wish to return</li>
                <li>Specify the reason for return (exchange, refund, damaged, etc.)</li>
                <li>We&apos;ll provide you with return instructions and a return authorization number</li>
                <li>Package the items securely with all original materials</li>
                <li>Ship using a trackable method (we recommend insurance for valuable items)</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Exchange Process</h2>
              <p>
                If you&apos;d like to exchange your item for a different size, style, or gemstone:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Follow the return process above and specify &ldquo;exchange&rdquo; as your reason</li>
                <li>Let us know what you&apos;d like to exchange it for</li>
                <li>We&apos;ll confirm availability and any price differences</li>
                <li>Upon receiving your return, we&apos;ll ship your new item</li>
                <li>If there&apos;s a price difference, we&apos;ll refund or charge accordingly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Refund Processing</h2>
              <p>
                Once we receive and inspect your returned item:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>We&apos;ll send you an email confirming receipt</li>
                <li>Refunds are processed within 3-5 business days</li>
                <li>Refunds are issued to your original payment method</li>
                <li>You&apos;ll receive an email confirmation when the refund is processed</li>
                <li>Please allow 5-10 business days for the refund to appear in your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Shipping Costs</h2>
              <p>
                <strong>Returns:</strong> Customers are responsible for return shipping costs unless the item was damaged or incorrectly sent.
              </p>
              <p>
                <strong>Exchanges:</strong> We&apos;ll cover the cost of shipping your new item to you. You cover the return shipping cost.
              </p>
              <p>
                <strong>Damaged Items:</strong> If you received a damaged item, we&apos;ll provide a prepaid return label and cover all shipping costs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Damaged or Incorrect Items</h2>
              <p>
                If you received a damaged or incorrect item, please contact us immediately at gemsutopia@gmail.com. We&apos;ll make it right with:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>A full refund including original shipping costs</li>
                <li>A replacement item at no additional cost</li>
                <li>Prepaid return shipping labels</li>
                <li>Expedited processing of your replacement or refund</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Questions?</h2>
              <p>
                Our team is here to help make your return or exchange as smooth as possible. If you have any questions about our return policy, please don&apos;t hesitate to contact us at gemsutopia@gmail.com.
              </p>
              <p>
                <strong>Response Time:</strong> We typically respond to all emails within 24 hours.
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