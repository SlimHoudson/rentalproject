import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      const interval = setInterval(() => fetchMessages(selectedUser._id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Fetch conv error:', err.message);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch msgs error:', err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    try {
      const res = await api.post('/messages', { 
        text: inputText, 
        receiverId: selectedUser._id 
      });
      setMessages([...messages, res.data]);
      setInputText('');
    } catch (err) {
      console.error('Send error:', err.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in max-w-[1600px] mx-auto">
      {/* Sidebar: List Conversations */}
      <aside className="w-96 border-r border-border flex flex-col bg-muted/10">
        <header className="p-10 border-b border-border bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-primary text-2xl">forum</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Telemetry</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Active Channels</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          {conversations.length === 0 ? (
            <div className="p-16 text-center opacity-20 flex flex-col items-center gap-6">
              <span className="material-symbols-outlined text-7xl">chat_bubble_outline</span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Signals</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user._id}
                onClick={() => setSelectedUser(conv.user)}
                className={`w-full px-8 py-6 flex items-center gap-6 transition-all hover:bg-muted/30 relative group ${
                    selectedUser?._id === conv.user._id ? 'bg-muted/50' : ''
                }`}
              >
                {selectedUser?._id === conv.user._id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-full"></div>
                )}
                <div className="w-14 h-14 rounded-[1.25rem] bg-card border border-border shadow-sm flex items-center justify-center font-black text-primary text-lg group-hover:scale-105 transition-transform">
                  {(conv.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0 space-y-1">
                  <p className="text-sm font-black text-foreground uppercase tracking-tight truncate">{conv.user?.name || 'Unknown Entity'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate italic">
                    {conv.lastMessage?.text || 'Awaiting transmission...'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest whitespace-nowrap">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {selectedUser?._id !== conv.user._id && (
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></div>
                    )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main: Chat View */}
      <main className="flex-1 flex flex-col bg-card/30">
        {selectedUser ? (
          <>
            {/* Header */}
            <header className="px-10 py-8 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-2xl shadow-primary/30">
                        {(selectedUser?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-4 border-card shadow-lg"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-foreground uppercase tracking-tight">{selectedUser?.name || 'Unknown Entity'}</h4>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{selectedUser?.email || '-'}</p>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span className="text-[9px] text-success font-black uppercase tracking-widest">Authorized Link</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-2xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                    <span className="material-symbols-outlined text-xl">call</span>
                </button>
                <button className="w-12 h-12 rounded-2xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                    <span className="material-symbols-outlined text-xl">more_vert</span>
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-fixed">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === user?.id || msg.sender === user?._id ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-6 rounded-[2rem] text-sm relative group ${
                    (msg.sender === user?.id || msg.sender === user?._id) 
                      ? 'bg-primary text-white rounded-tr-none shadow-2xl shadow-primary/20' 
                      : 'bg-card border border-border text-foreground rounded-tl-none shadow-xl'
                  }`}>
                    <p className="leading-relaxed font-medium">{msg.text}</p>
                    <div className={`absolute -bottom-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all ${(msg.sender === user?.id || msg.sender === user?._id) ? 'right-2' : 'left-2'}`}>
                        <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="material-symbols-outlined text-[10px] text-success">done_all</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-8 border-t border-border bg-card/50 backdrop-blur-xl">
              <form onSubmit={handleSend} className="max-w-[1000px] mx-auto flex items-center gap-6 p-2 pr-4 bg-muted/30 rounded-[2.5rem] border border-border focus-within:border-primary/30 transition-all shadow-inner">
                <button type="button" className="w-12 h-12 rounded-full hover:bg-muted transition-all text-muted-foreground flex items-center justify-center">
                    <span className="material-symbols-outlined">add_circle</span>
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Secure transmission to ${(selectedUser?.name || 'Entity').split(' ')[0]}...`}
                  className="flex-1 bg-transparent border-none px-2 py-4 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/30 uppercase tracking-widest"
                />
                <div className="flex items-center gap-2">
                    <button type="button" className="w-12 h-12 rounded-full hover:bg-muted transition-all text-muted-foreground flex items-center justify-center">
                        <span className="material-symbols-outlined">sentiment_satisfied</span>
                    </button>
                    <button
                        type="submit"
                        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-2xl">send</span>
                    </button>
                </div>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-8 animate-pulse">
            <div className="w-40 h-40 rounded-[3rem] bg-muted/10 border border-border flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-8xl text-muted-foreground/20">terminal</span>
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground/40 uppercase tracking-tight">Signal Processor Idle</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Initialize a secure channel from the registry</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminChat;
