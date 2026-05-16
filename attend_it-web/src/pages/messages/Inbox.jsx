// Legacy DM Inbox UI. Superseded by Threads.jsx (Triggered Threads, Fig. 12).
// Not currently routed — kept for backwards compatibility.

import React, { useState } from 'react';
import { Search, Send, Paperclip, MoreVertical } from 'lucide-react';

export default function Inbox() {
  // 1. Dummy Data 
  const [contacts] = useState([
    { id: 1, name: 'Maria Santos', role: 'Parent', lastMessage: 'Noted, thank you!', time: '10:30 AM', unread: 2 },
    { id: 2, name: 'Juan Dela Cruz', role: 'Student', lastMessage: 'Can I ask about the quiz?', time: 'Yesterday', unread: 0 },
    { id: 3, name: 'Prof. Garcia', role: 'Faculty', lastMessage: 'Meeting at 3 PM.', time: 'Monday', unread: 0 },
  ]);

  const [activeChat, setActiveChat] = useState(contacts[0]);
  const [messageInput, setMessageInput] = useState('');

  // Dummy messages for the active chat
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Maria Santos', text: 'Good morning! Did my son arrive on time today?', time: '10:15 AM', isMe: false },
    { id: 2, sender: 'You', text: 'Yes, Mrs. Santos. His RFID logged him in at 7:25 AM.', time: '10:20 AM', isMe: true },
    { id: 3, sender: 'Maria Santos', text: 'Noted, thank you!', time: '10:30 AM', isMe: false },
  ]);

  // 2. Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'You',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      
      {/*Header Structure */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inbox</h1>
        <p className="text-slate-500 mt-2">Direct messages and parent communications.</p>
      </div>

      {/* New Chat Interface*/}
      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        
        {/* LEFT COLUMN: Contact List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setActiveChat(contact)}
                className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                  activeChat.id === contact.id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{contact.name}</h3>
                  <span className="text-xs text-slate-400">{contact.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 truncate pr-4">{contact.lastMessage}</p>
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

        {/* RIGHT COLUMN: Chat Area */}
        <div className="w-2/3 flex flex-col bg-slate-50/50">
          
          {/* Active Chat Header */}
          <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800">{activeChat.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{activeChat.role}</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Display */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                  msg.isMe 
                    ? 'bg-blue-500 text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
              <button 
                type="submit" 
                className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
                disabled={!messageInput.trim()}
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}