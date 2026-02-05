import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductContent from './ProductContent';
import { notFound } from 'next/navigation';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Fetch from Jetbeans Storefront API (supports both ID and slug)
    const { product: jetbeansProduct } = await store.products.get(id);

    // Map to local format expected by ProductContent
    const product = {
      id: jetbeansProduct.id,
      name: jetbeansProduct.name,
      description: jetbeansProduct.description || '',
      price: parseFloat(jetbeansProduct.price),
      salePrice: jetbeansProduct.compareAtPrice ? parseFloat(jetbeansProduct.compareAtPrice) : undefined,
      onSale: !!jetbeansProduct.compareAtPrice && parseFloat(jetbeansProduct.compareAtPrice) > parseFloat(jetbeansProduct.price),
      images: jetbeansProduct.images || [],
      inventory: 99, // TODO: Get from stock when available
      sku: (jetbeansProduct as any).sku || `SKU-${jetbeansProduct.id.slice(0, 8)}`,
      category: jetbeansProduct.category,
      // Gemstone specs from metadata (if stored there)
      ...(jetbeansProduct as any).metadata,
    };

    return (
      <div className="flex min-h-screen flex-col bg-black">
        <Header />
        <div className="relative z-10">
          <ProductContent product={product} />
        </div>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch product:', error);
    notFound();
  }
}
