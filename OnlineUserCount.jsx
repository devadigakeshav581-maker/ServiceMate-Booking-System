import { useState, useEffect } from 'react';
import api from './api'; // Uses the configured axios instance from api.js
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const OnlineUserCount = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 1. Initial fetch via API (to show data immediately)
        const fetchOnlineCount = async () => {
            try {
                // The api object from api.js automatically includes the auth token.
                const response = await api.get('/api/users/online/count');
                setCount(response.data.count);
            } catch (err) {
                console.error("Failed to fetch online user count:", err);
                setError("Failed to load count.");
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineCount();

        // 2. Real-time updates via WebSocket
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug logs

        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        stompClient.connect(headers, () => {
            stompClient.subscribe('/topic/admin/online-users-count', (message) => {
                if (message.body) {
                    setCount(Number(message.body));
                }
            });
        }, (err) => console.error('WebSocket error:', err));

        // Cleanup on unmount
        return () => {
            if (stompClient && stompClient.connected) stompClient.disconnect();
        };
    }, []); // The empty dependency array ensures this effect runs only once on mount.

    if (loading) return <span className="text-lg">...</span>;
    if (error) return <span className="text-lg text-red-500">!</span>;

    return <span className="text-2xl font-bold text-green-600">{count}</span>;
};

export default OnlineUserCount;