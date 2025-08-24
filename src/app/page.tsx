import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Featured from '@/components/Featured';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import Reviews from '@/components/Reviews';
import ScrollToTop from '@/components/ScrollToTop';
import Stats from '@/components/Stats';

export default function Home() {
  return (
    <div className="min-h-[200vh] flex flex-col relative">
      {/* Fixed Background for all screen sizes */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <div className="relative z-10">
        <Header />
      </div>
      <div className="relative z-10">
        <Hero />
      </div>
      <div className="relative z-10">
        <Stats />
      </div>
      <div className="relative z-10">
        <Featured />
      </div>
      <div className="relative z-10">
        <About />
        <Reviews />
        <FAQ />
      </div>
      <div className="flex-grow max-h-20 relative z-10"></div>
      <div className="relative z-10">
        <Footer />
      </div>
      <div className="relative z-10">
        <ScrollToTop />
      </div>
    </div>
  );
}
