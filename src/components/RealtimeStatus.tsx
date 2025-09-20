'use client';
import { useRealtime } from '@/contexts/RealtimeContext';
import { Wifi, WifiOff } from 'lucide-react';

export default function RealtimeStatus() {
  const { isConnected } = useRealtime();

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
      isConnected
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Connecting...</span>
        </>
      )}
    </div>
  );
}