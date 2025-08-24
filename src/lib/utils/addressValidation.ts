// Address validation using Google Maps Geocoding API or similar service

export interface ValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  components?: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    postalCode?: string;
    country?: string;
  };
  error?: string;
}

export interface AddressData {
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Using Google Maps Geocoding API for address validation
export async function validateAddress(addressData: AddressData): Promise<ValidationResult> {
  try {
    // Construct full address string
    const fullAddress = `${addressData.address}${addressData.apartment ? `, ${addressData.apartment}` : ''}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}, ${addressData.country}`;
    
    // Use Google Maps Geocoding API (required)
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is required for address validation');
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components;
      
      // Extract address components
      const addressComponents: ValidationResult['components'] = {};
      
      components.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number')) {
          addressComponents.streetNumber = component.long_name;
        } else if (types.includes('route')) {
          addressComponents.route = component.long_name;
        } else if (types.includes('locality')) {
          addressComponents.locality = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.administrativeAreaLevel1 = component.short_name;
        } else if (types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        } else if (types.includes('country')) {
          addressComponents.country = component.short_name;
        }
      });
      
      // Verify the address matches what user entered (basic check)
      const isReasonableMatch = result.formatted_address.toLowerCase().includes(addressData.city.toLowerCase());
      
      if (!isReasonableMatch) {
        return {
          isValid: false,
          error: `Address not found in ${addressData.city}. Did you mean: ${result.formatted_address}?`,
          formattedAddress: result.formatted_address
        };
      }
      
      return {
        isValid: true,
        formattedAddress: result.formatted_address,
        components: addressComponents
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return {
        isValid: false,
        error: 'Address not found. Please check your address and try again.'
      };
    } else if (data.status === 'INVALID_REQUEST') {
      return {
        isValid: false,
        error: 'Invalid address format. Please check all fields.'
      };
    } else {
      return {
        isValid: false,
        error: `Address validation failed: ${data.status}`
      };
    }
  } catch (error) {
    console.error('Google Maps address validation error:', error);
    return {
      isValid: false,
      error: 'Unable to validate address. Please ensure all fields are correct and try again.'
    };
  }
}


// Get user's approximate location for default country/state
export async function getUserLocation(): Promise<{ country: string; state: string } | null> {
  try {
    // Use IP geolocation API (free services available)
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_code || 'US',
        state: data.region_code || ''
      };
    }
  } catch (error) {
    console.error('Failed to get user location:', error);
  }
  return null;
}