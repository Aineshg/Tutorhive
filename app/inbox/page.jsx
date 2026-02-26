"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  MessageSquare, Send, Search, MoreVertical, Edit2, Trash2, 
  Check, CheckCheck, X, Smile, Loader2, ArrowLeft
} from "lucide-react"
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useSocket } from "@/hooks/use-socket";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Lazy imports
const DashboardNav = dynamic(() =>
  import("@/components/dashboard-nav").then((mod) => mod.DashboardNav),
  { ssr: false }
);
const Avatar = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.Avatar),
  { ssr: false }
);
const AvatarImage = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.AvatarImage),
  { ssr: false }
);
const AvatarFallback = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.AvatarFallback),
  { ssr: false }
);

  // Helper function to format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper function to format time for WhatsApp-style timestamps
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  // Today
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }
  // This week
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  // Older
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// Common emoji reactions
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function InboxPage() {
  const { user } = useUser();
  const { socket, isConnected } = useSocket();
  const { refresh: refreshUnreadCount } = useUnreadMessages();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "unread", "read"
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showReactions, setShowReactions] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationIdRef = useRef(null);
  const fetchingConversationsRef = useRef(false);
  const fetchingMessagesRef = useRef(false);
  const hasInitialFetchRef = useRef(false);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations (memoized to prevent recreation)
  const fetchConversations = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingConversationsRef.current) {
      return null;
    }
    
    fetchingConversationsRef.current = true;
    try {
      const response = await fetch('/api/messages/conversations');
      const data = await response.json();
      if (data.success) {
        const conversationsList = data.data.conversations || [];
        setConversations(conversationsList);
        return conversationsList;
      }
      return null;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return null;
    } finally {
      setLoading(false);
      // Use setTimeout to ensure the ref is reset after the state update
      setTimeout(() => {
        fetchingConversationsRef.current = false;
      }, 100);
    }
  }, []);

  // Fetch messages for selected conversation (memoized to prevent recreation)
  const fetchMessages = useCallback(async (conversationId) => {
    // Prevent multiple simultaneous fetches for the same conversation
    if (fetchingMessagesRef.current === conversationId) {
      return;
    }
    
    fetchingMessagesRef.current = conversationId;
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages || []);
        
        // Clear unread count for this conversation in the conversations list
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
        
        // Refresh unread count after messages are loaded (they're marked as read)
        refreshUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      // Use setTimeout to ensure the ref is reset after the state update
      setTimeout(() => {
        fetchingMessagesRef.current = null;
      }, 100);
    }
  }, [refreshUnreadCount]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for new messages
    const handleMessageReceived = (data) => {
      // Use function form to get current state
      setSelectedConversation(currentConv => {
        // Only add message if it's for the current conversation
        if (currentConv && currentConv.id === data.conversationId) {
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            if (prev.some(m => m.id === data.id)) {
              return prev
            }
            return [...prev, {
              ...data,
              isOwnMessage: data.sender.id !== user?.id
            }]
          })
        }
        return currentConv // Don't change selected conversation
      })
      
      // Update conversations list locally without API call
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: data.content,
                sender: data.sender.name,
                timestamp: data.createdAt,
                isDeleted: data.isDeleted
              },
              lastMessageAt: data.createdAt,
              unreadCount: data.sender.id !== user?.id ? (conv.unreadCount || 0) + 1 : conv.unreadCount
            }
          }
          return conv
        })
      })
      
      // Refresh unread count if message is from another user
      if (data.sender.id !== user?.id) {
        refreshUnreadCount();
      }
    }

    // Listen for message sent confirmation (for other devices)
    const handleMessageSent = (data) => {
      setSelectedConversation(currentConv => {
        if (currentConv && currentConv.id === data.conversationId) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.id)) {
              return prev
            }
            return [...prev, {
              ...data,
              isOwnMessage: true
            }]
          })
        }
        return currentConv // Don't change selected conversation
      })
      
      // Update conversations list locally
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: data.content,
                sender: data.sender.name,
                timestamp: data.createdAt,
                isDeleted: data.isDeleted
              },
              lastMessageAt: data.createdAt
            }
          }
          return conv
        })
      })
    }

    socket.on('message_received', handleMessageReceived)
    socket.on('message_sent', handleMessageSent)

    return () => {
      socket.off('message_received', handleMessageReceived)
      socket.off('message_sent', handleMessageSent)
    }
  }, [socket, isConnected, user?.id, refreshUnreadCount]) // Include refreshUnreadCount

  // Join conversation room when conversation is selected
  useEffect(() => {
    const conversationId = selectedConversation?.id;
    if (socket && isConnected && conversationId && conversationId !== 'new') {
      socket.emit('join_conversation', conversationId)
      
      return () => {
        socket.emit('leave_conversation', conversationId)
      }
    }
  }, [socket, isConnected, selectedConversation?.id])

  // Initial fetch of conversations (only once on mount)
  useEffect(() => {
    // Only fetch once on mount - use ref guard to prevent re-fetching
    if (!hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run on mount

  // Load messages when conversation is selected (only once per conversation ID)
  useEffect(() => {
    const currentId = selectedConversation?.id;
    
    // Only fetch if conversation ID actually changed
    if (currentId && currentId !== conversationIdRef.current) {
      conversationIdRef.current = currentId;
      
      if (currentId === 'new') {
        // New conversation - set empty messages
        setMessages([]);
      } else {
        // Fetch messages for the conversation (only once per ID)
        fetchMessages(currentId);
      }
    } else if (!currentId && conversationIdRef.current) {
      // Only clear if we had a conversation before
      conversationIdRef.current = null;
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]) // Only depend on the ID - fetchMessages is stable (memoized)

  // Send message
  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    const messageContent = messageInput.trim();
    setSendingMessage(true);
    
    // Optimistically add the message to the UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: {
        id: user?.id || '',
        name: user?.name || 'You',
        avatar_url: user?.avatar_url || null
      },
      content: messageContent,
      status: 'sent',
      isEdited: false,
      isDeleted: false,
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOwnMessage: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setMessageInput("");

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: selectedConversation.otherUser.id,
          content: messageContent
        })
      });

      const data = await response.json();
      if (data.success) {
        // Remove optimistic message and add real message
        setMessages(prev => {
          const filtered = prev.filter(m => !m.id.startsWith('temp-'))
          return [...filtered, {
            ...data.data.message,
            isOwnMessage: true
          }]
        })

        // Emit socket event for real-time updates
        if (socket && isConnected && data.data.conversationId) {
          socket.emit('new_message', {
            conversationId: data.data.conversationId,
            ...data.data.message
          })
        }

        // If this was a new conversation, update the selected conversation with the new ID
        if (selectedConversation.id === 'new' || selectedConversation.isNewConversation) {
          // Refresh conversations to get the new conversation ID (use memoized function)
          const updatedConversations = await fetchConversations();
          if (updatedConversations) {
            // Find the new conversation in the updated list
            const newConv = updatedConversations.find(
              c => c.otherUser.id === selectedConversation.otherUser.id
            );
            if (newConv) {
              setSelectedConversation(newConv);
              // Join the new conversation room
              if (socket && isConnected) {
                socket.emit('join_conversation', newConv.id)
              }
            }
          }
        } else {
          // Join conversation room if not already joined
          if (socket && isConnected && data.data.conversationId) {
            socket.emit('join_conversation', data.data.conversationId)
          }
          // Update last message locally (no API call needed)
          setConversations(prev => prev.map(conv => 
            conv.id === data.data.conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    content: messageContent,
                    sender: user?.name || 'You',
                    timestamp: data.data.message.createdAt,
                    isDeleted: false
                  },
                  lastMessageAt: data.data.message.createdAt
                }
              : conv
          ))
        }
      } else {
        // If sending failed, remove the optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setMessageInput(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // If sending failed, remove the optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setMessageInput(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  // Edit message
  const handleEdit = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/${editingMessage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit',
          content: editContent.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update message locally instead of refetching
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...data.data.message, isOwnMessage: true }
            : msg
        ))
        setEditingMessage(null);
        setEditContent("");
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // Delete message
  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update message locally instead of refetching
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...data.data.message, isOwnMessage: true }
            : msg
        ))
        // Update conversations list locally
        if (selectedConversation) {
          setConversations(prev => prev.map(conv => 
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    content: 'This message was deleted'
                  }
                }
              : conv
          ))
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Add/remove reaction
  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'react',
          reaction: emoji
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update message locally instead of refetching
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reactions: data.data.message.reactions }
            : msg
        ))
        setShowReactions(null);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery && !conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Read/unread filter
    if (filter === 'unread' && conv.unreadCount === 0) return false;
    if (filter === 'read' && conv.unreadCount > 0) return false;
    
    return true;
  });

  // Get message status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // State for mobile view (show chat list or chat)
  const [showChatView, setShowChatView] = useState(false);

  // Handle conversation selection for mobile
  const handleSelectConversation = (conv) => {
    if (conv.isNewConversation) {
      setSelectedConversation({
        ...conv,
        id: 'new',
        messages: []
      });
    } else {
      setConversations(prev => prev.map(c => 
        c.id === conv.id 
          ? { ...c, unreadCount: 0 }
          : c
      ));
      setSelectedConversation(conv);
    }
    // On mobile, show chat view
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowChatView(true);
    }
  };

  // Handle back button for mobile
  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedConversation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 md:bg-gradient-to-br md:from-purple-50 md:via-blue-50 md:to-indigo-50">
      <DashboardNav />

      {/* Mobile: Show chat list OR chat view */}
      <div className="md:hidden">
        {!showChatView ? (
          /* Chat List View - Mobile */
          <div className="h-[calc(100vh-4rem-4rem)] bg-white flex flex-col">
            {/* Header */}
            <div className="bg-[#075e54] text-white p-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">Chats</h1>
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 cursor-pointer" />
                <MoreVertical className="h-5 w-5 cursor-pointer" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 bg-white border-b">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search or start new chat"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none focus:ring-0 focus:outline-none bg-transparent p-0 h-auto"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id || conv.otherUser.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100"
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={conv.otherUser.avatar_url} alt={conv.otherUser.name} />
                      <AvatarFallback className="bg-[#075e54] text-white text-lg">
                        {conv.otherUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{conv.otherUser.name}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {conv.isNewConversation ? '' : formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate flex-1 ${
                          conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}>
                          {conv.lastMessage.content}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-[#25d366] text-white text-xs font-semibold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Chat View - Mobile */
          selectedConversation && (
            <div className="fixed inset-x-0 top-16 bottom-16 bg-[#e5ddd5] flex flex-col overflow-hidden" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='100' height='100' patternTransform='scale(0.5) rotate(0)'%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='hsla(0,0%25,100%25,1)'/%3E%3Cpath d='M-50 0h100v100h-100z' stroke='hsla(0,0%25,0%25,0.04)' stroke-width='1' fill='none'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23a)' width='100%25' height='100%25'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px'
            }}>
              {/* Chat Header */}
              <div className="bg-[#075e54] text-white p-3 flex items-center gap-3 flex-shrink-0 z-10">
                <button
                  onClick={handleBackToList}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.otherUser.avatar_url} alt={selectedConversation.otherUser.name} />
                  <AvatarFallback className="bg-white/20 text-white">
                    {selectedConversation.otherUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/connections?viewUser=${selectedConversation.otherUser.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="font-semibold text-white">{selectedConversation.otherUser.name}</h3>
                  </Link>
                  <p className="text-xs text-white/80">
                    {isConnected ? 'online' : 'offline'}
                  </p>
                </div>
              </div>

              {/* Messages - Scrollable area between header and input */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-2 py-4 space-y-1 min-h-0"
              >
                {selectedConversation.id === 'new' && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-sm">Send a message to {selectedConversation.otherUser.name} to start chatting</p>
                  </div>
                )}
                {messages.map((msg, index) => {
                  const prevMsg = messages[index - 1];
                  const showTime = !prevMsg || 
                    new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000 || // 5 minutes
                    msg.isOwnMessage !== prevMsg.isOwnMessage;
                  
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center my-2">
                          <span className="bg-black/10 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${msg.isOwnMessage ? "justify-end" : "justify-start"} mb-1`}>
                        <div className={`max-w-[75%] ${msg.isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`rounded-lg px-2 py-1.5 text-sm shadow-sm relative ${
                              msg.isOwnMessage
                                ? "bg-[#dcf8c6] text-gray-900 rounded-tr-none"
                                : "bg-white text-gray-900 rounded-tl-none"
                            } ${msg.isDeleted ? "opacity-60" : ""}`}
                          >
                            {!msg.isDeleted && (
                              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                            )}
                            {msg.isDeleted && (
                              <div className="italic text-gray-500">This message was deleted</div>
                            )}
                            
                            {/* Message footer */}
                            <div className={`flex items-center gap-1 mt-0.5 justify-end ${
                              msg.isOwnMessage ? "text-gray-600" : "text-gray-500"
                            }`}>
                              <span className="text-[11px]">{formatTime(msg.createdAt)}</span>
                              {msg.isOwnMessage && (
                                <span className="ml-1">
                                  {getStatusIcon(msg.status)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - Fixed at bottom above navbar */}
              <div className="bg-white p-2 border-t border-gray-200 flex-shrink-0 z-10">
                <div className="flex items-end gap-2">
                  
                  <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-end">
                    <Textarea
                      rows={1}
                      placeholder="Type a message"
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none bg-transparent resize-none max-h-32 text-sm p-0"
                      style={{ minHeight: '24px', outline: 'none' }}
                    />
                  </div>
                  {messageInput.trim() && (
                    <button
                      onClick={handleSend}
                      disabled={sendingMessage}
                      className="text-white rounded-full p-2 transition-colors disabled:opacity-50 flex-shrink-0"
                      style={{ backgroundColor: 'oklch(0.395 0.055 200.975)' }}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Desktop: Side-by-side view */}
      <div className="hidden md:grid container mx-auto mt-6 grid-cols-3 gap-4 p-4">
        {/* Chat List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="flex-1 text-xs"
                style={filter === 'all' ? { backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' } : {}}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="flex-1 text-xs"
                style={filter === 'unread' ? { backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' } : {}}
              >
                Unread
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
                className="flex-1 text-xs"
                style={filter === 'read' ? { backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' } : {}}
              >
                Read
              </Button>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id || conv.otherUser.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                    selectedConversation?.otherUser?.id === conv.otherUser.id
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.otherUser.avatar_url} alt={conv.otherUser.name} />
                    <AvatarFallback>{conv.otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800 truncate">{conv.otherUser.name}</h4>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                      {conv.isNewConversation && (
                        <Badge variant="outline" className="h-5 px-2 text-xs bg-blue-50 text-blue-600 border-blue-200">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      conv.isNewConversation 
                        ? "text-blue-600 font-medium italic" 
                        : "text-gray-500"
                    }`}>
                      {conv.lastMessage.content}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {conv.isNewConversation ? '' : formatRelativeTime(conv.lastMessageAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border shadow-sm flex flex-col h-[80vh]">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.otherUser.avatar_url} alt={selectedConversation.otherUser.name} />
                  <AvatarFallback>{selectedConversation.otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/users/${selectedConversation.otherUser.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="font-semibold text-gray-800">{selectedConversation.otherUser.name}</h3>
                    </Link>
                    {isConnected && (
                      <div className="h-2 w-2 bg-green-500 rounded-full" title="Connected" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{selectedConversation.otherUser.role}</p>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {selectedConversation.id === 'new' && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-sm">Send a message to {selectedConversation.otherUser.name} to start chatting</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div className="group max-w-[70%]">
                      <div
                        className={`rounded-lg px-3 py-2 text-sm relative shadow-sm ${
                          msg.isOwnMessage
                            ? "bg-[#dcf8c6] text-gray-900 rounded-tr-none"
                            : "bg-white text-gray-900 rounded-tl-none"
                        } ${msg.isDeleted ? "opacity-60" : ""}`}
                      >
                        {!msg.isDeleted && (
                          <div className="whitespace-pre-line break-words">{msg.content}</div>
                        )}
                        {msg.isDeleted && (
                          <div className="italic text-gray-500">This message was deleted</div>
                        )}
                        
                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  msg.isOwnMessage
                                    ? "bg-white/20 text-white border-white/30"
                                    : "bg-white text-gray-700 border-gray-300"
                                } hover:opacity-80`}
                              >
                                {emoji} {userIds.length}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Message footer */}
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${
                          msg.isOwnMessage ? "text-white/70 justify-end" : "text-gray-500"
                        }`}>
                          {msg.isEdited && <span className="italic">(edited)</span>}
                          <span>{formatRelativeTime(msg.createdAt)}</span>
                          {msg.isOwnMessage && getStatusIcon(msg.status)}
                        </div>

                        {/* Message actions menu */}
                        {!msg.isDeleted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded ${
                                  msg.isOwnMessage
                                    ? "text-white/70 hover:bg-white/20"
                                    : "text-gray-500 hover:bg-gray-200"
                                } transition-opacity`}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                              >
                                <Smile className="h-4 w-4 mr-2" />
                                Add reaction
                              </DropdownMenuItem>
                              {msg.isOwnMessage && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMessage(msg);
                                      setEditContent(msg.content);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(msg.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {/* Reaction picker */}
                        {showReactions === msg.id && (
                          <div className={`absolute ${msg.isOwnMessage ? 'left-full ml-2' : 'right-full mr-2'} top-0 bg-white border rounded-lg shadow-lg p-2 z-10`}>
                            <div className="flex gap-1">
                              {REACTION_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="p-1 hover:bg-gray-100 rounded text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Textarea
                    rows={1}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 resize-none"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="flex items-center gap-1"
                    style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <MessageSquare className="h-6 w-6 mr-2" />
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>Make changes to your message below.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMessage(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editContent.trim()}
              style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
