'use client';
import { useState, useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { X, Eye, Database, Zap } from 'lucide-react';

export default function RealtimeDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const { isConnected, getAllData, subscribe } = useRealtime();

  useEffect(() => {
    // Subscribe to all auction changes for debugging
    const unsubscribeAuctions = subscribe('auctions', (data, type) => {
      const event = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        table: 'auctions',
        type,
        data: data,
        auction_id: data.id
      };
      setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    });

    // Subscribe to product changes
    const unsubscribeProducts = subscribe('products', (data, type) => {
      const event = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        table: 'products',
        type,
        data: data,
        product_id: data.id
      };
      setEvents(prev => [event, ...prev.slice(0, 49)]);
    });

    return () => {
      unsubscribeAuctions();
      unsubscribeProducts();
    };
  }, [subscribe]);

  const clearEvents = () => setEvents([]);

  const auctions = getAllData('auctions');
  const products = getAllData('products');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Open Real-time Debug Panel"
      >
        <Database className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-gray-800">Real-time Debug</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{Object.keys(auctions).length}</div>
            <div className="text-gray-600">Auctions</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{Object.keys(products).length}</div>
            <div className="text-gray-600">Products</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{events.length}</div>
            <div className="text-gray-600">Events</div>
          </div>
        </div>
      </div>

      {/* Events Log */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-medium text-gray-800">Live Events</span>
          </div>
          <button
            onClick={clearEvents}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              <Eye className="h-4 w-4 mx-auto mb-2" />
              Waiting for real-time events...
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`text-xs p-2 rounded ${
                  event.type === 'INSERT'
                    ? 'bg-green-50 border border-green-200'
                    : event.type === 'UPDATE'
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {event.table} {event.type}
                  </span>
                  <span className="text-gray-500">{event.timestamp}</span>
                </div>
                {event.table === 'auctions' && (
                  <div className="text-gray-700">
                    Bid: ${event.data.current_bid} | Count: {event.data.bid_count}
                  </div>
                )}
                {event.table === 'products' && (
                  <div className="text-gray-700">
                    Stock: {event.data.inventory} | {event.data.name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Test Actions */}
      <div className="border-t p-4 bg-gray-50">
        <div className="text-xs text-gray-600">
          <strong>Test:</strong> Open multiple tabs and place bids to see real-time updates
        </div>
      </div>
    </div>
  );
}