'use client';
import { useEffect, useRef, useState } from 'react';

interface GoogleAddressInputProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  onPlaceSelect?: (place: any) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

export default function GoogleAddressInput({ 
  value, 
  onChange, 
  placeholder = "Enter your address", 
  className = "",
  error,
  onPlaceSelect 
}: GoogleAddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeAutocomplete();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Set up callback
    window.initGoogleMaps = () => {
      setIsGoogleLoaded(true);
      initializeAutocomplete();
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || !window.google.maps) return;

    // Create autocomplete instance
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: ['us', 'ca'] }, // Restrict to US and Canada
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'name',
          'place_id'
        ]
      }
    );

    // Add listener for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (place && place.formatted_address) {
        onChange(place.formatted_address, place);
        
        // Call the place select callback with parsed address components
        if (onPlaceSelect) {
          const addressComponents = parseAddressComponents(place.address_components || []);
          onPlaceSelect({
            ...place,
            parsedAddress: addressComponents
          });
        }
      }
    });
  };

  const parseAddressComponents = (components: any[]) => {
    const parsed: any = {};
    
    components.forEach((component) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        parsed.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        parsed.route = component.long_name;
      } else if (types.includes('locality')) {
        parsed.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.state = component.short_name;
      } else if (types.includes('postal_code')) {
        parsed.zipCode = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.short_name;
      } else if (types.includes('subpremise')) {
        parsed.apartment = component.long_name;
      }
    });

    // Construct full street address
    if (parsed.streetNumber && parsed.route) {
      parsed.fullAddress = `${parsed.streetNumber} ${parsed.route}`;
    } else if (parsed.route) {
      parsed.fullAddress = parsed.route;
    }

    return parsed;
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isGoogleLoaded ? placeholder : 'Loading address suggestions...'}
        className={`${className} ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
        disabled={!isGoogleLoaded}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!isGoogleLoaded && (
        <p className="mt-1 text-xs text-gray-500">Loading Google Maps...</p>
      )}
    </div>
  );
}