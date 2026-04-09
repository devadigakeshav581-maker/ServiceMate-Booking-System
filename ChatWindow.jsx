import { useEffect, useMemo, useState } from 'react';
import { ChatAPI, getUserRole } from './api';

const ChatWindow = ({ booking, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const role = getUserRole() || 'CUSTOMER';

    const loadMessages = async () => {
        try {
            const data = await ChatAPI.getMessages(booking.id);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
        const intervalId = setInterval(loadMessages, 4000);
        return () => clearInterval(intervalId);
    }, [booking.id]);

    const handleSend = async () => {
        const text = draft.trim();
        if (!text) return;

        try {
            setSending(true);
            await ChatAPI.sendMessage(booking.id, {
                text,
                senderRole: role
            });
            setDraft('');
            await loadMessages();
        } catch (error) {
            console.error('Failed to send chat message:', error);
        } finally {
            setSending(false);
        }
    };

    const orderedMessages = useMemo(
        () => [...messages].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)),
        [messages]
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[130] p-4">
            <div className="premium-card w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold">Booking Chat</h3>
                        <div className="text-xs text-[#7070a0] mt-1">
                            {booking.serviceName || 'Service'} - Booking #{booking.id}
                        </div>
                    </div>
                    <button onClick={onClose} className="premium-button-ghost px-4 py-2 text-xs">Close</button>
                </div>

                <div className="flex-1 min-h-[320px] max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                    {loading ? (
                        <div className="text-center py-12 text-[#7070a0]">Loading messages...</div>
                    ) : orderedMessages.length === 0 ? (
                        <div className="text-center py-12 text-[#7070a0] italic">No messages yet. Start the conversation.</div>
                    ) : (
                        orderedMessages.map((msg) => {
                            const mine = (msg.senderRole || '').toUpperCase() === role.toUpperCase();
                            return (
                                <div key={msg.id || `${msg.timestamp}-${msg.text}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 border ${mine ? 'bg-[#6c63ff]/20 border-[#6c63ff]/30 text-white' : 'bg-[#1c1c27] border-[#2a2a3a] text-[#f0f0f8]'}`}>
                                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#7070a0] mb-1">
                                            {msg.senderRole || 'User'}
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap">{msg.text || msg.message}</div>
                                        <div className="text-[0.65rem] text-[#7070a0] mt-2">
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Just now'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#2a2a3a] flex gap-3">
                    <textarea
                        rows="3"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="premium-input flex-1"
                        placeholder="Type your message..."
                    />
                    <button onClick={handleSend} disabled={sending || !draft.trim()} className="premium-button px-5 py-3 self-end">
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
