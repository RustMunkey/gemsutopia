'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconSearch, IconUsers, IconMail } from '@tabler/icons-react';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: string;
  totalSpent: string;
}

function formatCurrency(v: string | number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(typeof v === 'string' ? parseFloat(v) : v);
}

function formatDate(d: string | null) {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 25 });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(pagination.page));

    try {
      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      setCustomers(json.data || []);
      if (json.pagination) setPagination(json.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openEmail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEmailForm({ subject: '', body: '' });
    setEmailOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedCustomer || !emailForm.subject || !emailForm.body) {
      toast.error('Subject and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/customers/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedCustomer.email,
          subject: emailForm.subject,
          body: emailForm.body,
        }),
      });
      if (res.ok) {
        toast.success(`Email sent to ${selectedCustomer.email}`);
        setEmailOpen(false);
      } else {
        toast.error('Failed to send email');
      }
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">{pagination.total} registered customers</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconUsers className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No customers found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {customers.map(customer => (
            <div key={customer.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {(customer.name || customer.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{customer.name || customer.firstName || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
              </div>
              <div className="hidden sm:block text-right text-xs text-muted-foreground">
                <p>{customer.city && `${customer.city}, ${customer.province || ''}`}</p>
                <p>Joined {formatDate(customer.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(customer.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">{customer.orderCount} orders</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEmail(customer)}>
                <IconMail className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground py-2">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button variant="outline" size="sm" disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
            Next
          </Button>
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email {selectedCustomer?.name || selectedCustomer?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">To: {selectedCustomer?.email}</p>
            <div>
              <Label>Subject</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject..." />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} rows={6} placeholder="Write your message..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
