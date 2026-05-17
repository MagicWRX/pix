'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { Coins, Send, AlertTriangle, Zap, ShoppingCart, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const TOKEN_COST_PER_MESSAGE = 2;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your Trusties AI assistant. I can help you with:\n\n• Understanding trusts and wills\n• Estate planning questions\n• Beneficiary management\n• Document preparation\n\nEach message costs **2 tokens**. What would you like to know?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?next=/chat');
    }
    if (!loading && user) {
      setReady(true);
    }
  }, [user, loading, router]);

  // Fetch token balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/tokens/balance');
      const data = await res.json();
      if (data.tokens !== undefined) {
        setTokenBalance(data.tokens);
      }
    } catch {
      // Silent fail
    }
    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    if (ready) {
      fetchBalance();
    }
  }, [ready, fetchBalance]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    // Check if user has enough tokens
    if (tokenBalance !== null && tokenBalance < TOKEN_COST_PER_MESSAGE) {
      return; // Paywall will show
    }

    setSending(true);
    const userMsgId = `msg-${Date.now()}`;

    // Optimistically add user message
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }]);
    setInput('');

    // Optimistically deduct tokens
    if (tokenBalance !== null) {
      setTokenBalance(prev => (prev !== null ? prev - TOKEN_COST_PER_MESSAGE : prev));
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.error || 'No response received.',
        timestamp: new Date().toISOString(),
      }]);

      // If the API failed and didn't charge, restore tokens
      if (data.error || !res.ok) {
        setTokenBalance(prev => (prev !== null ? prev + TOKEN_COST_PER_MESSAGE : prev));
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Your tokens have been refunded.',
        timestamp: new Date().toISOString(),
      }]);
      // Refund
      setTokenBalance(prev => (prev !== null ? prev + TOKEN_COST_PER_MESSAGE : prev));
    }
    setSending(false);

    // Refresh balance in background
    fetchBalance();
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="flex items-center gap-2 justify-center mb-3">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Trusties AI Chat</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const outOfTokens = tokenBalance !== null && tokenBalance < TOKEN_COST_PER_MESSAGE;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Trusties AI</h1>
              <p className="text-xs text-muted-foreground">AI-assisted trust & estate planning</p>
            </div>
          </div>

          {/* Token Balance Badge */}
          <Link href="/account" className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5 transition-colors">
            <Coins className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">
              {balanceLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                tokenBalance ?? 0
              )}
            </span>
            <span className="text-xs text-blue-500">tokens</span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${
                msg.role === 'system' ? 'justify-center' : ''
              }`}
            >
              {msg.role === 'system' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800 max-w-[90%]">
                  {msg.content}
                </div>
              ) : (
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Paywall Overlay */}
      {outOfTokens && (
        <div className="px-4 pb-2">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 text-sm">Out of Tokens</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    Each message costs {TOKEN_COST_PER_MESSAGE} tokens. Purchase more to continue chatting.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/pricing">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                        <ShoppingCart className="w-3 h-3 mr-1" /> Buy Tokens
                      </Button>
                    </Link>
                    <Link href="/account">
                      <Button variant="outline" size="sm" className="text-xs">
                        Check Balance
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input Bar */}
      <div className={`border-t border-border bg-card p-4 ${outOfTokens ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={outOfTokens ? 'Buy more tokens to continue...' : 'Ask about trusts, wills, estate planning...'}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                disabled={sending || outOfTokens}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={sending || !input.trim() || outOfTokens}
              className="rounded-xl bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {TOKEN_COST_PER_MESSAGE} tokens per message · AI responses are for informational purposes only
          </p>
        </div>
      </div>
    </div>
  );
}
