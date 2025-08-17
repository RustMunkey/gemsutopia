import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductContent from './ProductContent';
import { notFound } from 'next/navigation';

async function getProduct(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/${id}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.success ? data.product : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="min-h-[200vh] flex flex-col relative">
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
        <ProductContent product={product} />
      </div>
      <Footer />
    </div>
  );
}