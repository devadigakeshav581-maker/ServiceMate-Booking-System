import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { ChatAPI, getRole, BASE_URL } from './api';
import { Card } from './Card';

const ChatWindow = ({ booking, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const role = getRole(); // 'CUSTOMER' or 'PROVIDER'

  useEffect(() => {
    // Load history
    ChatAPI.getMessages(booking.id).then(setMessages).catch(console.error);

    // STOMP over SockJS connection
    const socket = new SockJS(`${BASE_URL}/ws`);
    const stompClient = Stomp.over(socket);
    stompClient.debug = null;
    stompClientRef.current = stompClient;

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    stompClient.connect(headers, () => {
      // Subscribe to general messages for this booking
      // (Assuming a ChatController broadcasts new messages here)
      stompClient.subscribe(`/topic/chat/${booking.id}`, (message) => {
        const newMessage = JSON.parse(message.body);
        setMessages(prev => [...prev, newMessage]);
      });

      // Subscribe to typing indicator topic
      stompClient.subscribe(`/topic/chat/${booking.id}/typing`, (message) => {
        const { isTyping: remoteIsTyping, sender } = JSON.parse(message.body);
        const myUsername = localStorage.getItem('email'); // Assuming email is username
        
        // Only show typing indicator for the *other* user
        if (sender !== myUsername) {
          setIsTyping(remoteIsTyping);
        }
      });
    });

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        // Stop typing when window is closed
        stompClientRef.current.send(`/app/chat/${booking.id}/typing`, {}, JSON.stringify({ isTyping: false }));
        stompClientRef.current.disconnect();
      }
    };
  }, [booking.id]);

  const handleTyping = () => {
    if (stompClientRef.current && stompClientRef.current.connected) {
        clearTimeout(typingTimeoutRef.current);
        stompClientRef.current.send(`/app/chat/${booking.id}/typing`, {}, JSON.stringify({ isTyping: true }));
        typingTimeoutRef.current = setTimeout(() => {
            stompClientRef.current.send(`/app/chat/${booking.id}/typing`, {}, JSON.stringify({ isTyping: false }));
        }, 2000); // Consider the user stopped typing after 2 seconds of inactivity
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      // This still uses the REST API to persist the message.
      // The backend should then broadcast it via WebSocket.
      await ChatAPI.sendMessage(booking.id, {
        text: inputText,
        senderRole: role
      });
      setInputText('');
      stompClientRef.current.send(`/app/chat/${booking.id}/typing`, {}, JSON.stringify({ isTyping: false }));
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="w-[500px] h-[600px] max-w-full flex flex-col p-0 overflow-hidden animate-in fade-in zoom-in duration-200 bg-panel border-border">
        <div className="p-4 border-b border-border flex justify-between items-center bg-panel shadow-sm z-10">
          <div>
            <h3 className="font-syne font-bold text-lg text-text">Chat</h3>
            <p className="text-xs text-muted">Booking #{booking.id} • {booking.serviceName || 'Service'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-input-bg text-muted hover:text-text transition-colors text-lg">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bg/50 scrollbar-thin">
          {messages.length === 0 && <p className="text-center text-xs text-muted mt-10">No messages yet. Say hello! 👋</p>}
          {messages.map((msg, i) => {
            const isMe = msg.senderRole === role;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe ? 'bg-accent text-white rounded-br-none' : 'bg-input-bg border border-border text-text rounded-bl-none'}`}>
                  <p>{msg.text}</p>
                  <span className={`text-[0.65rem] block mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-muted'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm bg-input-bg border border-border text-muted rounded-bl-none italic">
                    typing...
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-panel flex gap-2">
          <input className="flex-1 bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors" placeholder="Type a message..." value={inputText} onChange={e => { setInputText(e.target.value); handleTyping(); }} onKeyDown={e => e.key === 'Enter' && handleSend()} />
          <button onClick={handleSend} className="p-2.5 bg-accent text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-accent/20 aspect-square flex items-center justify-center">➤</button>
        </div>
      </Card>
    </div>
  );
};

export default ChatWindow;