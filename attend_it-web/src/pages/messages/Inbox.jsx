import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Plus, X } from 'lucide-react';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';

// Two-pane messaging: contact list on the left, active conversation on the right
export default function Inbox() {
  const currentUser = authService.getCurrentUser();

  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // New chat modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const messagesEndRef = useRef(null);

  // Load conversation partners with last-message preview + unread counts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await messageService.getContacts();
      setContacts(res.data);
      if (res.data.length > 0 && !activeChat) setActiveChat(res.data[0]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  // Load the full thread for the selected partner and mark incoming as read
  const fetchThread = async (partnerId) => {
    try {
      const res = await messageService.getThread(partnerId);
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation.');
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeChat) fetchThread(activeChat._id);
     
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message, append it to the thread, and refresh the contact list
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    const text = messageInput.trim();
    setMessageInput('');

    try {
      const res = await messageService.sendMessage(activeChat._id, text);
      setMessages((prev) => [...prev, res.data]);
      fetchContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    }
  };

  // Open the "new conversation" modal and fetch the people you can message
  const openNewChat = async () => {
    setShowNewChat(true);
    try {
      const res = await userService.getAllUsers();
      const me = currentUser?.id;
      setAllUsers(res.data.filter((u) => u._id !== me && u.isActive));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    }
  };

  // Begin a new chat with the picked user (or reuse the existing one)
  const startConversation = (user) => {
    const existing = contacts.find((c) => c._id === user._id);
    if (existing) {
      setActiveChat(existing);
    } else {
      const partner = {
        _id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        lastMessage: '',
        unread: 0,
      };
      setContacts((prev) => [partner, ...prev]);
      setActiveChat(partner);
      setMessages([]);
    }
    setShowNewChat(false);
  };

  // Show "HH:MM" for today, otherwise "Mon DD"
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inbox</h1>
          <p className="text-slate-500 mt-2">Direct messages and parent communications.</p>
        </div>
        <button
          onClick={openNewChat}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> New Conversation
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">

        {/* LEFT: Contacts */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <div className="p-6 text-center text-slate-500 text-sm">Loading...</div>}

            {!loading && filteredContacts.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                No conversations yet. Click "New Conversation" to start one.
              </div>
            )}

            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setActiveChat(contact)}
                className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                  activeChat?._id === contact._id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{contact.name}</h3>
                  <span className="text-xs text-slate-400">{formatTime(contact.time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 truncate pr-4">{contact.lastMessage || '—'}</p>
                  {contact.unread > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="w-2/3 flex flex-col bg-slate-50/50">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a conversation to begin messaging.
            </div>
          ) : (
            <>
              <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-slate-800">{activeChat.name}</h2>
                  <p className="text-xs text-slate-500 font-medium capitalize">{activeChat.role}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-slate-400 text-sm">No messages yet — send the first one.</p>
                )}
                {messages.map((msg) => {
                  const isMe = (msg.sender?._id || msg.sender) === currentUser?.id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                        isMe
                          ? 'bg-blue-500 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Start New Conversation</h3>
              <button onClick={() => setShowNewChat(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {allUsers.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm">No other users in the system yet.</div>
              )}
              {allUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => startConversation(u)}
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-600">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
