'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsData {
  general?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
  payments?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  store?: Record<string, unknown>;
  admin?: Record<string, unknown>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(json => setSettings(json.data || {}))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const getValue = (category: string, key: string, fallback: unknown = '') => {
    const cat = settings[category as keyof SettingsData] as Record<string, unknown> | undefined;
    if (!cat || cat[key] === undefined) return fallback;
    const val = cat[key];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  };

  const setValue = (category: string, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...(prev[category as keyof SettingsData] as Record<string, unknown> || {}), [key]: value },
    }));
  };

  const saveCategory = async (category: string) => {
    setSaving(category);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          settings: settings[category as keyof SettingsData] || {},
        }),
      });
      if (res.ok) {
        toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved`);
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div><h1 className="text-2xl font-bold">Settings</h1></div>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your store and admin panel settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site Information</CardTitle>
              <CardDescription>Basic details about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Store Name</Label>
                  <Input
                    value={getValue('general', 'store_name', 'Gemsutopia') as string}
                    onChange={e => setValue('general', 'store_name', e.target.value)}
                    placeholder="Gemsutopia"
                  />
                </div>
                <div>
                  <Label>Store Tagline</Label>
                  <Input
                    value={getValue('general', 'store_tagline', '') as string}
                    onChange={e => setValue('general', 'store_tagline', e.target.value)}
                    placeholder="Premium Canadian Gemstones"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={getValue('general', 'contact_email', '') as string}
                    onChange={e => setValue('general', 'contact_email', e.target.value)}
                    placeholder="info@gemsutopia.ca"
                  />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={getValue('general', 'support_email', '') as string}
                    onChange={e => setValue('general', 'support_email', e.target.value)}
                    placeholder="support@gemsutopia.ca"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Default Currency</Label>
                  <Select
                    value={getValue('general', 'default_currency', 'CAD') as string}
                    onValueChange={v => setValue('general', 'default_currency', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={getValue('general', 'timezone', 'America/Toronto') as string}
                    onValueChange={v => setValue('general', 'timezone', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Toronto">Eastern (Toronto)</SelectItem>
                      <SelectItem value="America/Vancouver">Pacific (Vancouver)</SelectItem>
                      <SelectItem value="America/Edmonton">Mountain (Edmonton)</SelectItem>
                      <SelectItem value="America/Winnipeg">Central (Winnipeg)</SelectItem>
                      <SelectItem value="America/Halifax">Atlantic (Halifax)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Weight Unit</Label>
                  <Select
                    value={getValue('general', 'weight_unit', 'g') as string}
                    onValueChange={v => setValue('general', 'weight_unit', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="ct">Carats (ct)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dimension Unit</Label>
                  <Select
                    value={getValue('general', 'dimension_unit', 'mm') as string}
                    onValueChange={v => setValue('general', 'dimension_unit', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">Millimeters (mm)</SelectItem>
                      <SelectItem value="cm">Centimeters (cm)</SelectItem>
                      <SelectItem value="in">Inches (in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveCategory('general')} disabled={saving === 'general'}>
              {saving === 'general' ? 'Saving...' : 'Save General Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping Configuration</CardTitle>
              <CardDescription>Manage shipping rates and processing times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Processing Time (days)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'processing_days', '2') as string}
                    onChange={e => setValue('shipping', 'processing_days', e.target.value)}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Free Shipping Threshold ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'free_shipping_threshold', '100') as string}
                    onChange={e => setValue('shipping', 'free_shipping_threshold', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <Separator />
              <h4 className="text-sm font-medium">Domestic (Canada)</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Standard Rate ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'canada_standard_rate', '9.99') as string}
                    onChange={e => setValue('shipping', 'canada_standard_rate', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Express Rate ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'canada_express_rate', '19.99') as string}
                    onChange={e => setValue('shipping', 'canada_express_rate', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Delivery Days</Label>
                  <Input
                    value={getValue('shipping', 'canada_delivery_days', '3-7') as string}
                    onChange={e => setValue('shipping', 'canada_delivery_days', e.target.value)}
                    placeholder="3-7"
                  />
                </div>
              </div>
              <Separator />
              <h4 className="text-sm font-medium">United States</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Standard Rate ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'usa_standard_rate', '14.99') as string}
                    onChange={e => setValue('shipping', 'usa_standard_rate', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Express Rate ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'usa_express_rate', '29.99') as string}
                    onChange={e => setValue('shipping', 'usa_express_rate', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Delivery Days</Label>
                  <Input
                    value={getValue('shipping', 'usa_delivery_days', '5-10') as string}
                    onChange={e => setValue('shipping', 'usa_delivery_days', e.target.value)}
                    placeholder="5-10"
                  />
                </div>
              </div>
              <Separator />
              <h4 className="text-sm font-medium">International</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Standard Rate ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'intl_standard_rate', '24.99') as string}
                    onChange={e => setValue('shipping', 'intl_standard_rate', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Express Rate ($)</Label>
                  <Input
                    type="number"
                    value={getValue('shipping', 'intl_express_rate', '49.99') as string}
                    onChange={e => setValue('shipping', 'intl_express_rate', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Delivery Days</Label>
                  <Input
                    value={getValue('shipping', 'intl_delivery_days', '10-20') as string}
                    onChange={e => setValue('shipping', 'intl_delivery_days', e.target.value)}
                    placeholder="10-20"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Insurance Required</Label>
                  <p className="text-xs text-muted-foreground">Require shipping insurance on orders</p>
                </div>
                <Switch
                  checked={getValue('shipping', 'insurance_required', false) as boolean}
                  onCheckedChange={v => setValue('shipping', 'insurance_required', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Signature Required</Label>
                  <p className="text-xs text-muted-foreground">Require signature on delivery</p>
                </div>
                <Switch
                  checked={getValue('shipping', 'signature_required', false) as boolean}
                  onCheckedChange={v => setValue('shipping', 'signature_required', v)}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveCategory('shipping')} disabled={saving === 'shipping'}>
              {saving === 'shipping' ? 'Saving...' : 'Save Shipping Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Methods</CardTitle>
              <CardDescription>Enable or disable payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Stripe</Label>
                  <p className="text-xs text-muted-foreground">Credit/debit card payments via Stripe</p>
                </div>
                <Switch
                  checked={getValue('payments', 'stripe_enabled', true) as boolean}
                  onCheckedChange={v => setValue('payments', 'stripe_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>PayPal</Label>
                  <p className="text-xs text-muted-foreground">PayPal Smart Buttons checkout</p>
                </div>
                <Switch
                  checked={getValue('payments', 'paypal_enabled', true) as boolean}
                  onCheckedChange={v => setValue('payments', 'paypal_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cryptocurrency</Label>
                  <p className="text-xs text-muted-foreground">Coinbase Commerce crypto payments</p>
                </div>
                <Switch
                  checked={getValue('payments', 'crypto_enabled', false) as boolean}
                  onCheckedChange={v => setValue('payments', 'crypto_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Interac e-Transfer</Label>
                  <p className="text-xs text-muted-foreground">Manual Interac e-Transfer payments</p>
                </div>
                <Switch
                  checked={getValue('payments', 'etransfer_enabled', false) as boolean}
                  onCheckedChange={v => setValue('payments', 'etransfer_enabled', v)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax Configuration</CardTitle>
              <CardDescription>Manage tax rates and collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Collect Tax</Label>
                  <p className="text-xs text-muted-foreground">Enable tax collection on orders</p>
                </div>
                <Switch
                  checked={getValue('payments', 'tax_enabled', true) as boolean}
                  onCheckedChange={v => setValue('payments', 'tax_enabled', v)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={getValue('payments', 'tax_rate', '13') as string}
                    onChange={e => setValue('payments', 'tax_rate', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Tax Label</Label>
                  <Input
                    value={getValue('payments', 'tax_label', 'HST') as string}
                    onChange={e => setValue('payments', 'tax_label', e.target.value)}
                    placeholder="HST"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveCategory('payments')} disabled={saving === 'payments'}>
              {saving === 'payments' ? 'Saving...' : 'Save Payment Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Notifications</CardTitle>
              <CardDescription>Choose which events trigger email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Order</Label>
                  <p className="text-xs text-muted-foreground">Email when a new order is placed</p>
                </div>
                <Switch
                  checked={getValue('notifications', 'notify_new_order', true) as boolean}
                  onCheckedChange={v => setValue('notifications', 'notify_new_order', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Contact Message</Label>
                  <p className="text-xs text-muted-foreground">Email when someone uses the contact form</p>
                </div>
                <Switch
                  checked={getValue('notifications', 'notify_contact_form', true) as boolean}
                  onCheckedChange={v => setValue('notifications', 'notify_contact_form', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Stock Alert</Label>
                  <p className="text-xs text-muted-foreground">Email when a product is running low</p>
                </div>
                <Switch
                  checked={getValue('notifications', 'notify_low_stock', true) as boolean}
                  onCheckedChange={v => setValue('notifications', 'notify_low_stock', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Customer</Label>
                  <p className="text-xs text-muted-foreground">Email when a new account is created</p>
                </div>
                <Switch
                  checked={getValue('notifications', 'notify_new_customer', false) as boolean}
                  onCheckedChange={v => setValue('notifications', 'notify_new_customer', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auction Ended</Label>
                  <p className="text-xs text-muted-foreground">Email when an auction ends with bids</p>
                </div>
                <Switch
                  checked={getValue('notifications', 'notify_auction_ended', true) as boolean}
                  onCheckedChange={v => setValue('notifications', 'notify_auction_ended', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Review</Label>
                  <p className="text-xs text-muted-foreground">Email when a customer leaves a review</p>
                </div>
                <Switch
                  checked={getValue('notifications', 'notify_new_review', false) as boolean}
                  onCheckedChange={v => setValue('notifications', 'notify_new_review', v)}
                />
              </div>
              <Separator />
              <div>
                <Label>Low Stock Threshold</Label>
                <p className="text-xs text-muted-foreground mb-2">Alert when stock drops below this number</p>
                <Input
                  type="number"
                  value={getValue('notifications', 'low_stock_threshold', '3') as string}
                  onChange={e => setValue('notifications', 'low_stock_threshold', e.target.value)}
                  min="1"
                  className="max-w-[120px]"
                />
              </div>
              <Separator />
              <div>
                <Label>Notification Email</Label>
                <p className="text-xs text-muted-foreground mb-2">Where to send admin notifications</p>
                <Input
                  type="email"
                  value={getValue('notifications', 'admin_email', '') as string}
                  onChange={e => setValue('notifications', 'admin_email', e.target.value)}
                  placeholder="reese@gemsutopia.ca"
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveCategory('notifications')} disabled={saving === 'notifications'}>
              {saving === 'notifications' ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Store Status</CardTitle>
              <CardDescription>Control store availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Show maintenance page to visitors</p>
                </div>
                <Switch
                  checked={getValue('store', 'maintenance_mode', false) as boolean}
                  onCheckedChange={v => setValue('store', 'maintenance_mode', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Guest Checkout</Label>
                  <p className="text-xs text-muted-foreground">Let customers buy without an account</p>
                </div>
                <Switch
                  checked={getValue('store', 'guest_checkout', true) as boolean}
                  onCheckedChange={v => setValue('store', 'guest_checkout', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Out of Stock Products</Label>
                  <p className="text-xs text-muted-foreground">Display products that are out of stock</p>
                </div>
                <Switch
                  checked={getValue('store', 'show_out_of_stock', true) as boolean}
                  onCheckedChange={v => setValue('store', 'show_out_of_stock', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Reviews</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to leave reviews</p>
                </div>
                <Switch
                  checked={getValue('store', 'reviews_enabled', true) as boolean}
                  onCheckedChange={v => setValue('store', 'reviews_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Wishlists</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to save items to wishlist</p>
                </div>
                <Switch
                  checked={getValue('store', 'wishlists_enabled', true) as boolean}
                  onCheckedChange={v => setValue('store', 'wishlists_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Auctions</Label>
                  <p className="text-xs text-muted-foreground">Enable auction functionality on the store</p>
                </div>
                <Switch
                  checked={getValue('store', 'auctions_enabled', true) as boolean}
                  onCheckedChange={v => setValue('store', 'auctions_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Discount Codes</Label>
                  <p className="text-xs text-muted-foreground">Allow promo code usage at checkout</p>
                </div>
                <Switch
                  checked={getValue('store', 'discounts_enabled', true) as boolean}
                  onCheckedChange={v => setValue('store', 'discounts_enabled', v)}
                />
              </div>
              <Separator />
              <div>
                <Label>Max Items Per Order</Label>
                <p className="text-xs text-muted-foreground mb-2">Maximum number of items in a single order</p>
                <Input
                  type="number"
                  value={getValue('store', 'max_items_per_order', '20') as string}
                  onChange={e => setValue('store', 'max_items_per_order', e.target.value)}
                  min="1"
                  className="max-w-[120px]"
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveCategory('store')} disabled={saving === 'store'}>
              {saving === 'store' ? 'Saving...' : 'Save Store Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Admin Settings */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Panel</CardTitle>
              <CardDescription>Configure admin panel behaviour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Admin Name</Label>
                <p className="text-xs text-muted-foreground mb-2">Display name for the admin user</p>
                <Input
                  value={getValue('admin', 'admin_name', '') as string}
                  onChange={e => setValue('admin', 'admin_name', e.target.value)}
                  placeholder="Reese"
                />
              </div>
              <div>
                <Label>Admin Email</Label>
                <p className="text-xs text-muted-foreground mb-2">Primary admin email address</p>
                <Input
                  type="email"
                  value={getValue('admin', 'admin_email', '') as string}
                  onChange={e => setValue('admin', 'admin_email', e.target.value)}
                  placeholder="reese@gemsutopia.ca"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Require 2FA for admin login</p>
                </div>
                <Switch
                  checked={getValue('admin', 'two_factor_enabled', false) as boolean}
                  onCheckedChange={v => setValue('admin', 'two_factor_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Session Timeout</Label>
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity (hours)</p>
                </div>
                <Input
                  type="number"
                  value={getValue('admin', 'session_timeout_hours', '24') as string}
                  onChange={e => setValue('admin', 'session_timeout_hours', e.target.value)}
                  min="1"
                  className="max-w-[80px]"
                />
              </div>
              <Separator />
              <div>
                <Label>Items Per Page</Label>
                <p className="text-xs text-muted-foreground mb-2">Default pagination size in admin lists</p>
                <Select
                  value={getValue('admin', 'items_per_page', '20') as string}
                  onValueChange={v => setValue('admin', 'items_per_page', v)}
                >
                  <SelectTrigger className="max-w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveCategory('admin')} disabled={saving === 'admin'}>
              {saving === 'admin' ? 'Saving...' : 'Save Admin Settings'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
