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

    // Create a high-speed broadcast channel for instant delivery
    const channel = supabase
      .channel(`chat_${orderId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUserId }
        }
      })
      // 1. Listen for Database Inserts (for history sync)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const msg = payload.new as Message;
          if (msg.order_id !== orderId) return;
          console.log("DB Realtime received:", msg);
          addMessage(msg);
        }
      )
      // 2. Listen for Direct Broadcasts (Visual speed lane)
      .on(
        'broadcast',
        { event: 'msg' },
        (payload: any) => {
          console.log("Broadcast speed-lane received:", payload.payload);
          addMessage(payload.payload as Message);
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, orderId, currentUserId]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => {
      // Intelligently merge optimistic or broadcast messages with DB messages
      const isDuplicate = prev.some(p => p.id === msg.id || (p.text === msg.text && p.sender_id === msg.sender_id && p.id.toString().startsWith('0.')));
      if (isDuplicate) {
        // If we find an optimistic version, replace it with the real one
        return prev.map(p => (p.text === msg.text && p.sender_id === msg.sender_id && p.id.toString().startsWith('0.')) ? msg : p);
      }
      return [...prev, msg];
    });
  };

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
      const tempId = Math.random().toString();
      const msgData: Message = {
        id: tempId,
        order_id: orderId,
        sender_id: currentUserId,
        text: messageText,
        created_at: new Date().toISOString()
      };

      // 1. Optimistic Update (Instant for Sender)
      setMessages(prev => [...prev, msgData]);

      // 2. Broadcast (Instant for Receiver)
      supabase.channel(`chat_${orderId}`).send({
        type: 'broadcast',
        event: 'msg',
        payload: msgData
      });

      // 3. Persist to DB
      const { data, error } = await supabase.from('messages').insert({
        order_id: orderId,
        sender_id: currentUserId,
        text: messageText,
      }).select().single();

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
    <div className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-6 md:right-6 z-[2000] md:w-96 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 ease-out">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl">👤</div>
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-indigo-600 rounded-full animate-pulse shadow-sm"></div>
            )}
          </div>
          <div>
            <p className="text-white font-black leading-tight text-sm md:text-base">{recipientName}</p>
            <p className="text-indigo-200 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{isConnected ? 'Online' : 'Connecting...'}</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-white/60 hover:text-white transition-all bg-white/10 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90"
        >
          ✕
        </button>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 h-[60vh] md:h-96 overflow-y-auto p-5 md:p-6 space-y-4 bg-slate-50/40">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">💬</div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No Messages Yet</p>
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
                  className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100'
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

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 md:p-5 bg-white border-t border-slate-100 flex gap-2 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold placeholder:text-slate-300"
          />
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-indigo-700 active:scale-90 shadow-lg shadow-indigo-100"
        >
          <span className="text-xl">🚀</span>
        </button>
      </form>
    </div>
  );
}
