import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Featured from '@/components/Featured';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import Reviews from '@/components/Reviews';
import ScrollToTop from '@/components/ScrollToTop';

export default function Home() {
  return (
    <div className="min-h-[200vh] flex flex-col relative">
      {/* Mobile-only Fixed Background */}
      <div 
        className="md:hidden fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <div className="relative z-10 md:z-auto">
        <Header />
      </div>
      <div className="relative z-10 md:z-auto">
        <Hero />
      </div>
      <div className="relative z-10 md:z-auto">
        <Featured />
      </div>
      <div
        className="relative z-10 md:z-auto"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed"
        }}
      >
        <About />
        <Reviews />
        <FAQ />
      </div>
      <div className="flex-grow max-h-20 relative z-10 md:z-auto"></div>
      <div className="relative z-10 md:z-auto">
        <Footer />
      </div>
      <div className="relative z-10 md:z-auto">
        <ScrollToTop />
      </div>
    </div>
  );
}
