import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Auctions() {
  return (
    <div className="bg-black min-h-screen flex flex-col">
      <Header />
      
      <div 
        className="flex-grow"
        style={{
          backgroundImage: 'url(/images/whitemarble.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
      </div>
      
      <Footer />
    </div>
  );
}