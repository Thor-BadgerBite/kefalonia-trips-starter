'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface MessagingInboxProps {
  provider: {
    id: string;
    name: string;
    email: string;
  };
  initialConversations: any[];
}

export default function MessagingInbox({
  provider,
  initialConversations,
}: MessagingInboxProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const markAsRead = async (conversationId: string) => {
    await supabase.rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_reader_type: 'provider',
    });

    // Update local state
    setConversations(
      conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_provider: 0 } : c
      )
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderType: 'provider',
          senderId: provider.id,
          senderName: provider.name,
          senderEmail: provider.email,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_provider || 0),
    0
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4">
      {/* Conversations List */}
      <div className="w-80 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
          {totalUnread > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b hover:bg-gray-50 text-left transition ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-gray-900">
                    {conv.customer_name}
                  </div>
                  {conv.unread_provider > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {conv.unread_provider}
                    </span>
                  )}
                </div>
                {conv.booking && (
                  <div className="text-xs text-gray-500 mb-1">
                    Booking #{conv.booking.booking_number}
                  </div>
                )}
                <div className="text-sm text-gray-600 line-clamp-2">
                  {conv.last_message_preview || 'No messages yet'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(conv.last_message_at), {
                    addSuffix: true,
                  })}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 bg-white rounded-xl shadow flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="font-semibold text-gray-900">
                {selectedConversation.customer_name}
              </div>
              <div className="text-sm text-gray-600">
                {selectedConversation.customer_email}
              </div>
              {selectedConversation.booking && (
                <div className="text-xs text-gray-500 mt-1">
                  Booking #{selectedConversation.booking.booking_number}
                  {selectedConversation.booking.trip && (
                    <> • {selectedConversation.booking.trip.title}</>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_type === 'provider'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md rounded-lg px-4 py-2 ${
                      msg.sender_type === 'provider'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        msg.sender_type === 'provider'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Send Message Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t flex gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
