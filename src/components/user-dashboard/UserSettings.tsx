'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faLock, 
  faEye, 
  faTrash, 
  faEnvelope,
  faToggleOn,
  faToggleOff
} from '@fortawesome/free-solid-svg-icons';

export default function UserSettings() {
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    newArrivals: true,
    priceDrops: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    showPurchases: false,
    showWishlist: false
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    if (key === 'profileVisibility') return; // Handle differently for select
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key as 'showPurchases' | 'showWishlist']
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FontAwesomeIcon icon={faBell} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </h3>
                <p className="text-sm text-gray-600">
                  {key === 'orderUpdates' && 'Get notified about order status changes'}
                  {key === 'promotions' && 'Receive promotional offers and deals'}
                  {key === 'newsletter' && 'Monthly newsletter with gemstone insights'}
                  {key === 'newArrivals' && 'Be first to know about new products'}
                  {key === 'priceDrops' && 'Alert when wishlist items go on sale'}
                </p>
              </div>
              <button
                onClick={() => toggleNotification(key as keyof typeof notifications)}
                className={`text-2xl transition-colors ${
                  value ? 'text-purple-600 hover:text-purple-700' : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                <FontAwesomeIcon icon={value ? faToggleOn : faToggleOff} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FontAwesomeIcon icon={faEye} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Profile Visibility</h3>
              <select
                value={privacy.profileVisibility}
                onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
                <option value="public">Public</option>
              </select>
            </div>
            <p className="text-sm text-gray-600">Control who can see your profile information</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Show Purchase History</h3>
              <p className="text-sm text-gray-600">Allow others to see your purchase history</p>
            </div>
            <button
              onClick={() => togglePrivacy('showPurchases')}
              className={`text-2xl transition-colors ${
                privacy.showPurchases ? 'text-purple-600 hover:text-purple-700' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <FontAwesomeIcon icon={privacy.showPurchases ? faToggleOn : faToggleOff} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Show Wishlist</h3>
              <p className="text-sm text-gray-600">Make your wishlist visible to others</p>
            </div>
            <button
              onClick={() => togglePrivacy('showWishlist')}
              className={`text-2xl transition-colors ${
                privacy.showWishlist ? 'text-purple-600 hover:text-purple-700' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <FontAwesomeIcon icon={privacy.showWishlist ? faToggleOn : faToggleOff} />
            </button>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FontAwesomeIcon icon={faLock} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <span className="text-purple-600">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add extra security to your account</p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
              Not Enabled
            </span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Login History</h3>
              <p className="text-sm text-gray-600">View your recent login activity</p>
            </div>
            <span className="text-purple-600">→</span>
          </button>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FontAwesomeIcon icon={faEnvelope} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Communication</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Email Frequency</h3>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Never</option>
            </select>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Preferred Contact Method</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="contact" value="email" className="mr-2" defaultChecked />
                Email
              </label>
              <label className="flex items-center">
                <input type="radio" name="contact" value="sms" className="mr-2" />
                SMS (if phone provided)
              </label>
              <label className="flex items-center">
                <input type="radio" name="contact" value="both" className="mr-2" />
                Both
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <div className="flex items-center space-x-3 mb-6">
          <FontAwesomeIcon icon={faTrash} className="text-red-600 text-xl" />
          <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
            <div className="text-left">
              <h3 className="font-medium text-red-900">Export Account Data</h3>
              <p className="text-sm text-red-700">Download all your account data</p>
            </div>
            <span className="text-red-600">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
            <div className="text-left">
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
            </div>
            <span className="text-red-600">→</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Reset to Defaults
        </button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}