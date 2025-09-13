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
  placeholder = "Enter your address (suggestions optional)...",
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
      setLoading(false);
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
        
        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
          console.warn('Address suggestion timeout - stopping loading state');
          setLoading(false);
        }, 10000); // 10 second timeout
        
        try {
          const addressSuggestions = await getAddressSuggestions(value.trim(), country);
          setSuggestions(addressSuggestions);
          setShowSuggestions(addressSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching address suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      } else {
        setLoading(false);
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
    // Enhanced parsing of address components from OpenStreetMap suggestion
    // Format varies but usually: "Street Address, City, Province/State, Postal Code, Country"
    console.log('Parsing suggestion:', suggestion); // Debug log
    
    const parts = suggestion.split(', ');
    console.log('Address parts:', parts); // Debug log
    
    if (parts.length >= 3) {
      const streetAddress = parts[0];
      let city = '';
      let state = '';
      let postalCode = '';
      let country = 'Canada'; // Default
      
      // More flexible parsing - scan all parts for different components
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        
        // Check for postal codes first (most specific)
        if (/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(part)) {
          // Canadian postal code (K1A 0A6 format)
          postalCode = part;
        } else if (/^\d{5}(-\d{4})?$/.test(part)) {
          // US zip code (12345 or 12345-6789)
          postalCode = part;
        } else if (part.toLowerCase().includes('canada')) {
          country = 'Canada';
        } else if (part.toLowerCase().includes('united states') || part.toLowerCase() === 'usa') {
          country = 'United States';
        } else if (isCanadianProvince(part) || isUSState(part)) {
          // This looks like a province/state - normalize Canadian provinces to abbreviations
          state = country === 'Canada' ? normalizeCanadianProvince(part) : part;
        } else if (!city && i === 1) {
          // Usually the first part after street address is the city
          city = part;
        } else if (!city && !state) {
          // If we haven't found city yet, this could be it
          city = part;
        }
      }
      
      // If we didn't find a state, try to extract from the parts again
      if (!state && parts.length >= 3) {
        // Check the part that's typically the state/province position
        const potentialState = parts[parts.length - 3] || parts[2];
        if (isCanadianProvince(potentialState) || isUSState(potentialState)) {
          state = country === 'Canada' ? normalizeCanadianProvince(potentialState) : potentialState;
        }
      }
      
      const result = {
        address: streetAddress,
        city: city,
        state: state,
        zipCode: postalCode,
        country: country
      };
      
      console.log('Parsed result:', result); // Debug log
      return result;
    }
    
    console.log('Could not parse address parts'); // Debug log
    return null;
  };

  // Helper functions for state/province detection
  const isCanadianProvince = (text: string): boolean => {
    const provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
                     'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
                     'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
                     'Quebec', 'Saskatchewan', 'Yukon'];
    return provinces.some(province => text.toLowerCase().includes(province.toLowerCase()));
  };

  const normalizeCanadianProvince = (text: string): string => {
    const provinceMap: { [key: string]: string } = {
      'alberta': 'AB',
      'british columbia': 'BC',
      'manitoba': 'MB',
      'new brunswick': 'NB',
      'newfoundland and labrador': 'NL',
      'northwest territories': 'NT',
      'nova scotia': 'NS',
      'nunavut': 'NU',
      'ontario': 'ON',
      'prince edward island': 'PE',
      'quebec': 'QC',
      'saskatchewan': 'SK',
      'yukon': 'YT'
    };
    
    const normalized = text.toLowerCase();
    return provinceMap[normalized] || text;
  };

  const isUSState = (text: string): boolean => {
    const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 
                   'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
                   'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 
                   'VA', 'WA', 'WV', 'WI', 'WY'];
    return states.some(state => text.toUpperCase() === state);
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
          disabled={false}
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
      
      {/* Validation status - Optional helper message */}
      {validationStatus === 'valid' && validatedAddress && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Address Suggestion Selected</p>
              <p className="text-xs text-green-700">{validatedAddress}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Optional helper text - only show if user seems to be looking for suggestions */}
      {!loading && suggestions.length === 0 && value.trim().length >= 10 && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">
                Address verification is optional. You can proceed with your manually entered address.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}