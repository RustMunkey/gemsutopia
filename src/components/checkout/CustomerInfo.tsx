'use client';
import { useState, useEffect } from 'react';
import { validateAddress, AddressData } from '@/lib/utils/addressValidation';
import AddressInput from './AddressInput';

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface CustomerInfoProps {
  data: CustomerData;
  onContinue: (data: CustomerData) => void;
}

export default function CustomerInfo({ data, onContinue }: CustomerInfoProps) {
  const [formData, setFormData] = useState<CustomerData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

  // Load saved customer data from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    
    const savedCustomerData = localStorage.getItem('customerShippingInfo');
    if (savedCustomerData) {
      try {
        const parsed = JSON.parse(savedCustomerData);
        // Only load if the current data is empty (first time on checkout)
        if (!data.email && !data.firstName && !data.lastName) {
          setFormData(parsed);
        }
      } catch (error) {
        console.error('Error loading saved customer data:', error);
      }
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressSelect = (addressComponents: any) => {
    console.log('handleAddressSelect called with:', addressComponents); // Debug log
    
    if (addressComponents) {
      // Update all available address components for full autofill
      const newFormData = {
        ...formData,
        address: addressComponents.address || formData.address,
        city: addressComponents.city || formData.city,
        state: addressComponents.state || formData.state,
        zipCode: addressComponents.zipCode || formData.zipCode,
        country: addressComponents.country || formData.country,
      };
      
      console.log('Updating form data with all components:', newFormData); // Debug log
      setFormData(newFormData);
      
      // Clear related errors
      setErrors(prev => ({
        ...prev,
        address: '',
        city: addressComponents.city ? '' : prev.city,
        state: addressComponents.state ? '' : prev.state,
        zipCode: addressComponents.zipCode ? '' : prev.zipCode,
      }));
    }
  };

  const handleAddressValidation = (result: { isValid: boolean; formattedAddress?: string; error?: string }) => {
    if (result.isValid && result.formattedAddress) {
      // Clear any address errors
      setErrors(prev => ({
        ...prev,
        address: ''
      }));
    }
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'Province/State is required';
    if (!formData.zipCode) newErrors.zipCode = 'Postal/Zip code is required';

    // Validate address using free OpenStreetMap validation
    if (formData.address && formData.city && formData.state && formData.zipCode) {
      setIsValidatingAddress(true);
      try {
        const addressValidation = await validateAddress({
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        });
        
        if (!addressValidation.isValid) {
          newErrors.address = addressValidation.error || 'Address validation failed';
          if (addressValidation.suggestions && addressValidation.suggestions.length > 0) {
            setAddressSuggestions(addressValidation.suggestions);
          }
        }
      } catch (error) {
        console.error('Address validation error:', error);
        // Don't block submission if validation service fails
      } finally {
        setIsValidatingAddress(false);
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await validateForm()) {
      // Save customer data to localStorage for future use
      if (isClient) {
        try {
          localStorage.setItem('customerShippingInfo', JSON.stringify(formData));
        } catch (error) {
          console.error('Error saving customer data:', error);
        }
      }
      
      onContinue(formData);
    }
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black";
  const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${inputClasses} ${errors.email ? errorClasses : ''}`}
              placeholder="your@email.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        {/* Name */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Full Name</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`${inputClasses} ${errors.firstName ? errorClasses : ''}`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`${inputClasses} ${errors.lastName ? errorClasses : ''}`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street Address *
              </label>
              <AddressInput
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                onAddressSelect={handleAddressSelect}
                onValidationResult={handleAddressValidation}
                className={`${inputClasses} ${errors.address ? errorClasses : ''}`}
                placeholder="Start typing your address..."
                error={errors.address}
                country={formData.country as 'Canada' | 'United States'}
              />
              {addressSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">Did you mean:</p>
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const components = suggestion.split(', ');
                        if (components.length >= 2) {
                          setFormData(prev => ({
                            ...prev,
                            city: components[1] || prev.city
                          }));
                        }
                        setAddressSuggestions([]);
                      }}
                      className="block text-xs text-blue-600 hover:text-blue-800 underline mb-1"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="apartment" className="block text-sm font-medium text-gray-700">
                Apartment, suite, etc. (optional)
              </label>
              <input
                type="text"
                id="apartment"
                name="apartment"
                value={formData.apartment || ''}
                onChange={handleChange}
                className={inputClasses}
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`${inputClasses} ${errors.city ? errorClasses : ''}`}
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  Province/State *
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`${inputClasses} ${errors.state ? errorClasses : ''}`}
                >
                  <option value="">Select...</option>
                  <option value="AB">Alberta</option>
                  <option value="BC">British Columbia</option>
                  <option value="MB">Manitoba</option>
                  <option value="NB">New Brunswick</option>
                  <option value="NL">Newfoundland and Labrador</option>
                  <option value="NT">Northwest Territories</option>
                  <option value="NS">Nova Scotia</option>
                  <option value="NU">Nunavut</option>
                  <option value="ON">Ontario</option>
                  <option value="PE">Prince Edward Island</option>
                  <option value="QC">Quebec</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="YT">Yukon</option>
                </select>
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`${inputClasses} ${errors.zipCode ? errorClasses : ''}`}
                  placeholder="K1A 0A6"
                />
                {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="Canada">Canada</option>
                <option value="United States">United States</option>
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number (optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={inputClasses}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>


        <button
          type="submit"
          disabled={isValidatingAddress}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidatingAddress ? 'Validating Address...' : 'Continue to Payment Method'}
        </button>
      </form>
    </div>
  );
}