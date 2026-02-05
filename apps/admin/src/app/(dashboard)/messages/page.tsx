'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconMail,
  IconMailOpened,
  IconTrash,
  IconAlertTriangle,
  IconArchive,
  IconSend,
  IconArrowLeft,
} from '@tabler/icons-react';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string | null;
  replyMessage: string | null;
  repliedAt: string | null;
  createdAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  read: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  replied: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  spam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  archived: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        if (selected?.id === id) {
          setSelected(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selected?.id === id) setSelected(null);
        toast.success('Message deleted');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText }),
      });
      if (res.ok) {
        toast.success(`Reply sent to ${selected.email}`);
        setMessages(prev => prev.map(m =>
          m.id === selected.id
            ? { ...m, status: 'replied', replyMessage: replyText, repliedAt: new Date().toISOString() }
            : m
        ));
        setSelected(prev => prev ? { ...prev, status: 'replied', replyMessage: replyText, repliedAt: new Date().toISOString() } : null);
        setReplyText('');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const selectMessage = (msg: Message) => {
    setSelected(msg);
    setReplyText('');
    if (msg.status === 'new') {
      updateStatus(msg.id, 'read');
    }
  };

  const filtered = messages.filter(m => {
    if (filter === 'all') return m.status !== 'archived' && m.status !== 'spam';
    return m.status === filter;
  });

  const newCount = messages.filter(m => m.status === 'new').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div><h1 className="text-2xl font-bold">Messages</h1></div>
        <div className="grid gap-3 md:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Messages
            {newCount > 0 && (
              <Badge variant="secondary" className="text-xs">{newCount} new</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Contact form submissions from customers</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {[
          { id: 'all', label: 'Inbox' },
          { id: 'new', label: 'Unread' },
          { id: 'read', label: 'Read' },
          { id: 'replied', label: 'Replied' },
          { id: 'spam', label: 'Spam' },
          { id: 'archived', label: 'Archived' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={filter === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Message list */}
        <Card className={`overflow-hidden ${selected ? 'hidden md:block' : ''}`}>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No messages</p>
              ) : (
                filtered.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => selectMessage(msg)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selected?.id === msg.id
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {msg.status === 'new' ? (
                        <IconMail className="h-4 w-4 flex-shrink-0 text-blue-500" />
                      ) : (
                        <IconMailOpened className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span className={`truncate text-sm ${msg.status === 'new' ? 'font-semibold' : ''}`}>
                        {msg.name}
                      </span>
                      {msg.status && (
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[msg.status] || ''}`}>
                          {msg.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate pl-6 text-xs text-muted-foreground">
                      {msg.subject || 'No subject'}
                    </p>
                    <p className="mt-0.5 pl-6 text-xs text-muted-foreground/70">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Message detail */}
        {selected ? (
          <Card className="flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => setSelected(null)}>
                      <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold truncate">{selected.subject || 'No subject'}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From <span className="font-medium text-foreground">{selected.name}</span> &lt;{selected.email}&gt;
                  </p>
                  {selected.phone && (
                    <p className="text-xs text-muted-foreground">Phone: {selected.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(selected.id, 'spam')} title="Spam">
                    <IconAlertTriangle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(selected.id, 'archived')} title="Archive">
                    <IconArchive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMessage(selected.id)} title="Delete">
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Message body */}
              <div className="rounded-lg bg-muted/50 p-4 mb-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p>
              </div>

              {/* Previous reply */}
              {selected.replyMessage && (
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 p-4 mb-4">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    Replied {selected.repliedAt ? new Date(selected.repliedAt).toLocaleString() : ''}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-900 dark:text-green-200">
                    {selected.replyMessage}
                  </p>
                </div>
              )}

              {/* Reply form */}
              <div className="mt-auto space-y-2 pt-4 border-t border-border">
                <Textarea
                  placeholder={`Reply to ${selected.name}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Sends via Resend to {selected.email}
                  </p>
                  <Button size="sm" onClick={sendReply} disabled={sending || !replyText.trim()}>
                    <IconSend className="h-4 w-4 mr-1" />
                    {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hidden md:flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <IconMail className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a message to view</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
