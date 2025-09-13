import { notFound } from 'next/navigation';
import AuctionContent from './AuctionContent';

// Auction interface matching the database schema
interface Auction {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  video_url?: string | null;
  featured_image_index?: number;
  starting_bid: number;
  current_bid: number;
  reserve_price: number | null;
  bid_count: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'pending' | 'cancelled';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

async function getAuction(id: string): Promise<Auction | null> {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsutopia.com'
      : 'http://localhost:3000';
      
    const response = await fetch(`${baseUrl}/api/auctions/${id}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.auction : null;
  } catch (error) {
    console.error('Error fetching auction:', error);
    return null;
  }
}

export default async function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auction = await getAuction(id);

  if (!auction) {
    notFound();
  }

  return <AuctionContent auction={auction} />;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auction = await getAuction(id);
  
  if (!auction) {
    return {
      title: 'Auction Not Found',
    };
  }

  return {
    title: `${auction.title} - Gemsutopia Auction`,
    description: auction.description || `Bid on ${auction.title}. Starting bid: $${auction.starting_bid}`,
    openGraph: {
      title: `${auction.title} - Gemsutopia Auction`,
      description: auction.description || `Bid on ${auction.title}. Starting bid: $${auction.starting_bid}`,
      images: auction.images.length > 0 ? [auction.images[auction.featured_image_index || 0]] : [],
    },
  };
}