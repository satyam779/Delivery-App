'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

interface OrderChatProps {
  orderId: string;
  recipientName: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderChat({ orderId, recipientName, currentUserId, isOpen, onClose }: OrderChatProps) {
  const { state } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    fetchMessages();

    // Subscribe to new messages with improved fault tolerance
    const channel = supabase
      .channel(`chat_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            // Merging optimistic message
            const existingOptIdx = prev.findIndex(p => p.text === msg.text && p.sender_id === msg.sender_id && p.id.toString().startsWith('0.'));
            if (existingOptIdx !== -1) {
              const next = [...prev];
              next[existingOptIdx] = msg;
              return next;
            }
            if (prev.some(p => p.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Optimistic update
      const tempId = Math.random().toString();
      const optimisticMsg: Message = {
        id: tempId,
        order_id: orderId,
        sender_id: currentUserId,
        text: messageText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);

      const { error } = await supabase.from('messages').insert({
        order_id: orderId,
        sender_id: currentUserId,
        text: messageText,
      });

      if (error) {
         setMessages(prev => prev.filter(m => m.id !== tempId));
         throw error;
      }
    } catch (err: any) {
      console.error('Failed to send message:', err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[2000] w-80 md:w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl">👤</div>
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full animate-pulse"></div>
            )}
          </div>
          <div>
            <p className="text-white font-black leading-tight">{recipientName}</p>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">{isConnected ? 'Live' : 'Connecting...'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors bg-white/10 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
      </div>

      <div ref={scrollRef} className="flex-1 h-80 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id.toString().toLowerCase() === currentUserId.toString().toLowerCase();
            
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <p className={`text-[9px] font-black mt-1 uppercase tracking-widest ${isMe ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-indigo-700 active:scale-95"
        >
          🚀
        </button>
      </form>
    </div>
  );
}
