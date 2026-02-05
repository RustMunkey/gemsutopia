'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { IconPlus, IconGavel, IconEdit, IconTrash } from '@tabler/icons-react';

interface Auction {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  startingBid: string;
  currentBid: string;
  reservePrice: string | null;
  buyNowPrice: string | null;
  bidIncrement: string;
  bidCount: number;
  startTime: string;
  endTime: string;
  status: string;
  isActive: boolean;
  autoExtend: boolean;
  extendMinutes: number;
  extendThresholdMinutes: number;
  gemstoneType: string | null;
  caratWeight: string | null;
  origin: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  sold: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_sale: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const emptyAuction = {
  title: '', description: '', startingBid: '', reservePrice: '', buyNowPrice: '',
  bidIncrement: '1', startTime: '', endTime: '', autoExtend: true,
  extendMinutes: 5, extendThresholdMinutes: 5, gemstoneType: '', caratWeight: '',
  origin: '', images: [''],
};

function formatCurrency(v: string | number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(typeof v === 'string' ? parseFloat(v) : v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTimeRemaining(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [form, setForm] = useState(emptyAuction);
  const [saving, setSaving] = useState(false);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);

    try {
      const res = await fetch(`/api/auctions?${params}`);
      const json = await res.json();
      setAuctions(json.data || []);
    } catch {
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  const openNew = () => {
    setEditingAuction(null);
    setForm(emptyAuction);
    setDialogOpen(true);
  };

  const openEdit = (auction: Auction) => {
    setEditingAuction(auction);
    setForm({
      title: auction.title,
      description: auction.description || '',
      startingBid: auction.startingBid,
      reservePrice: auction.reservePrice || '',
      buyNowPrice: auction.buyNowPrice || '',
      bidIncrement: auction.bidIncrement,
      startTime: auction.startTime ? new Date(auction.startTime).toISOString().slice(0, 16) : '',
      endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : '',
      autoExtend: auction.autoExtend,
      extendMinutes: auction.extendMinutes,
      extendThresholdMinutes: auction.extendThresholdMinutes,
      gemstoneType: auction.gemstoneType || '',
      caratWeight: auction.caratWeight || '',
      origin: auction.origin || '',
      images: auction.images,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startingBid || !form.startTime || !form.endTime) {
      toast.error('Title, starting bid, start and end time are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingAuction ? `/api/auctions/${editingAuction.id}` : '/api/auctions';
      const method = editingAuction ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startingBid: parseFloat(form.startingBid),
          reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : null,
          buyNowPrice: form.buyNowPrice ? parseFloat(form.buyNowPrice) : null,
          bidIncrement: parseFloat(form.bidIncrement),
          caratWeight: form.caratWeight ? parseFloat(form.caratWeight) : null,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        }),
      });
      if (res.ok) {
        toast.success(editingAuction ? 'Auction updated' : 'Auction created');
        setDialogOpen(false);
        fetchAuctions();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this auction?')) return;
    try {
      await fetch(`/api/auctions/${id}`, { method: 'DELETE' });
      toast.success('Auction deleted');
      fetchAuctions();
    } catch {}
  };

  const handleStatusChange = async (auction: Auction, status: string) => {
    try {
      await fetch(`/api/auctions/${auction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast.success('Status updated');
      fetchAuctions();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Auctions</h1>
          <p className="text-sm text-muted-foreground">Manage reserve auctions</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <IconPlus className="h-4 w-4 mr-1" /> New Auction
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {['all', 'active', 'upcoming', 'ended'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Auctions List */}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconGavel className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No auctions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {auctions.map(auction => (
            <div key={auction.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {auction.images?.[0] && auction.images[0] !== '' ? (
                  <img src={auction.images[0]} alt="" className="h-12 w-12 object-cover" />
                ) : (
                  <IconGavel className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{auction.title}</p>
                  <Badge variant="secondary" className={`text-[10px] ${statusColors[auction.status] || ''}`}>
                    {auction.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>Start: {formatCurrency(auction.startingBid)}</span>
                  {auction.currentBid !== '0' && <span>Current: {formatCurrency(auction.currentBid)}</span>}
                  {auction.reservePrice && <span>Reserve: {formatCurrency(auction.reservePrice)}</span>}
                  <span>{auction.bidCount} bids</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Ends: {formatDate(auction.endTime)}</span>
                  {auction.status === 'active' && <span className="text-green-600 dark:text-green-400 font-medium">{getTimeRemaining(auction.endTime)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Select value={auction.status} onValueChange={v => handleStatusChange(auction, v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['pending', 'scheduled', 'active', 'ended', 'sold', 'cancelled', 'no_sale'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(auction)}>
                  <IconEdit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(auction.id)}>
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAuction ? 'Edit Auction' : 'New Auction'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Starting Bid *</Label>
                <Input type="number" step="0.01" value={form.startingBid} onChange={e => setForm(f => ({ ...f, startingBid: e.target.value }))} />
              </div>
              <div>
                <Label>Reserve Price</Label>
                <Input type="number" step="0.01" value={form.reservePrice} onChange={e => setForm(f => ({ ...f, reservePrice: e.target.value }))} placeholder="Min to sell" />
              </div>
              <div>
                <Label>Buy Now Price</Label>
                <Input type="number" step="0.01" value={form.buyNowPrice} onChange={e => setForm(f => ({ ...f, buyNowPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Bid Increment</Label>
                <Input type="number" step="0.01" value={form.bidIncrement} onChange={e => setForm(f => ({ ...f, bidIncrement: e.target.value }))} />
              </div>
              <div>
                <Label>Gemstone Type</Label>
                <Input value={form.gemstoneType} onChange={e => setForm(f => ({ ...f, gemstoneType: e.target.value }))} />
              </div>
              <div>
                <Label>Carat Weight</Label>
                <Input type="number" step="0.01" value={form.caratWeight} onChange={e => setForm(f => ({ ...f, caratWeight: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch checked={form.autoExtend} onCheckedChange={v => setForm(f => ({ ...f, autoExtend: v }))} />
                <Label>Auto-extend on last-minute bids</Label>
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.images[0] || ''} onChange={e => setForm(f => ({ ...f, images: [e.target.value] }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingAuction ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
