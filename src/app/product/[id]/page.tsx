import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductContent from './ProductContent';

const images = [
  '/images/Review1.jpg',
  '/images/Review2.jpg', 
  '/images/Review3.jpg',
  '/images/Review4.jpg',
  '/images/Review5.jpg',
  '/images/Review6.jpg',
  '/images/Review7.jpg',
  '/images/Review8.jpg',
  '/images/Review9.jpg',
  '/images/Review10.jpg',
  '/images/Review12.jpg',
  '/images/Review13.jpg',
  '/images/Review14.jpg',
  '/images/8680a65c-0c82-4529-a8f2-a051344e565a.webp',
  '/images/c07009ff-cd86-45d0-858e-441993683280.webp',
  '/images/Review-5.jpg'
];

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id);
  const productImage = images[productId - 1] || images[0];
  
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
      <div className="relative z-10">
        <ProductContent productId={productId} productImage={productImage} />
      </div>
      <Footer />
    </div>
  );
}