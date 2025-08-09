import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function About() {
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
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">About Gemsutopia</h1>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700">
            <p className="text-xl leading-relaxed mb-8">
              First of all, thanks for stopping by — I&apos;m Reese, founder of Gemsutopia and a proud Canadian gem dealer based in Alberta.
            </p>
            
            <p className="mb-6">
              At Gemsutopia, we believe in gemstones with integrity. Every mineral and specimen you see in my shop is hand-selected, ethically sourced, and personally inspected by me. Many pieces — like our Blue Jay sapphires, Alberta peridot, and Canadian ammolite — were even mined by yours truly, straight from the earth with care and respect.
            </p>
            
            <p className="mb-6">
              This isn&apos;t just a business — it&apos;s a passion. I don&apos;t list anything I wouldn&apos;t be proud to have in my own collection.
            </p>
            
            <p className="mb-6">
              Each order is thoughtfully packed by my amazing spouse (she&apos;s the best), and we often include a small bonus gift as a thank-you for supporting our dream.
            </p>
            
            <p className="mb-8">
              You can shop with confidence knowing we stand behind every piece, from quality to safe delivery.
            </p>
            
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Shipping & Processing</h2>
            <ul className="mb-6">
              <li>Processing time: 1–2 business days</li>
              <li>Estimated delivery (Canada): 3–15 business days (not guaranteed)</li>
              <li>Estimated delivery (USA): 5–20 business days (not guaranteed)</li>
            </ul>
            
            <p className="mb-6">
              Have a question or issue? Reach out anytime! I&apos;ll always do my best to help.
            </p>
            
            <p className="text-xl leading-relaxed mb-8">
              Thanks so much for supporting Gemsutopia. You&apos;re not just buying a gem.. you&apos;re also investing in a story, a journey, and a small Canadian business that truly cares.
            </p>
            
            <p className="text-right font-semibold text-black">
              — Reese @ Gemsutopia
            </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}