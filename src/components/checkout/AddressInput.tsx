'use client';
import { useState, useEffect, useRef } from 'react';
import { getAddressSuggestions } from '@/lib/utils/addressValidation';
import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (addressComponents: any) => void;
  onValidationResult?: (result: { isValid: boolean; formattedAddress?: string; error?: string }) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  country?: 'Canada' | 'United States';
}

export default function AddressInput({
  value,
  onChange,
  onAddressSelect,
  onValidationResult,
  placeholder = "Start typing your address...",
  className = "",
  error,
  country = 'Canada'
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationStatus, setValidationStatus] = useState<'none' | 'validating' | 'valid' | 'invalid'>('none');
  const [validatedAddress, setValidatedAddress] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear suggestions when value is empty
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce address suggestions
    debounceRef.current = setTimeout(async () => {
      if (value.trim().length >= 3) {
        setLoading(true);
        try {
          const addressSuggestions = await getAddressSuggestions(value.trim(), country);
          setSuggestions(addressSuggestions);
          setShowSuggestions(addressSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching address suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, country]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Mark as validated since it came from our API
    setValidationStatus('valid');
    setValidatedAddress(suggestion);
    
    if (onValidationResult) {
      onValidationResult({
        isValid: true,
        formattedAddress: suggestion
      });
    }
    
    // Parse the suggestion to extract address components
    if (onAddressSelect) {
      const components = parseAddressFromSuggestion(suggestion);
      onAddressSelect(components);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const parseAddressFromSuggestion = (suggestion: string) => {
    // Basic parsing of address components from OpenStreetMap suggestion
    // Format is usually: "Street Number Street Name, City, Province/State, Postal Code, Country"
    const parts = suggestion.split(', ');
    if (parts.length >= 4) {
      const streetAddress = parts[0];
      const city = parts[1];
      const state = parts[2];
      const remaining = parts.slice(3);
      
      // Extract postal code (pattern matching)
      let postalCode = '';
      let country = '';
      
      for (const part of remaining) {
        if (/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(part)) {
          // Canadian postal code
          postalCode = part;
        } else if (/^\d{5}(-\d{4})?$/.test(part)) {
          // US zip code
          postalCode = part;
        } else if (part.toLowerCase().includes('canada') || part.toLowerCase().includes('united states')) {
          country = part.includes('canada') ? 'Canada' : 'United States';
        }
      }
      
      return {
        address: streetAddress,
        city: city,
        state: state,
        zipCode: postalCode,
        country: country || 'Canada'
      };
    }
    
    return null;
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={loading ? "Finding addresses..." : placeholder}
          className={`${className} ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} pr-10`}
          disabled={loading}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Validation status */}
      {validationStatus === 'valid' && validatedAddress && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Address Verified</p>
              <p className="text-xs text-green-700">{validatedAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="mt-1 text-xs text-gray-500">
        Start typing your address for suggestions (powered by OpenStreetMap)
      </p>
    </div>
  );
}