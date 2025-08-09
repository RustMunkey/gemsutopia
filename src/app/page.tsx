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
    <div className="min-h-[200vh] flex flex-col">
      <Header />
      <Hero />
      <div
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed"
        }}
      >
        <About />
        <Featured />
        <Reviews />
        <FAQ />
      </div>
      <div className="flex-grow max-h-20"></div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
