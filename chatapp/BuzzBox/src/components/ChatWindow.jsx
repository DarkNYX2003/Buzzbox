import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './ChatWindow.css';

function ChatWindow({ username }) {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [userList, setUserList] = useState([]);
    const [recipient, setRecipient] = useState("");

    useEffect(() => {
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);
        setConnected(true);

        // Listen for events from the server
        newSocket.on('chat_message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        newSocket.on('user_typing', (data) => {
            setTypingUser(data.username);
        });

        newSocket.on('user_stopped_typing', () => {
            setTypingUser(null);
        });

        newSocket.on('update_user_list', (users) => {
            setUserList(users);
        });

        newSocket.on('private_message', (data) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { username: `Private from ${data.from}`, message: data.message }
            ]);
        });

        newSocket.emit('user_connected', username);

        return () => {
            newSocket.disconnect();
            setConnected(false);
        };
    }, [username]);

    const sendMessage = () => {
        if (message.trim()) {
            const data = { username, message };
            socket.emit('chat_message', data);
            setMessage('');
            setIsTyping(false);
            socket.emit('user_stopped_typing');
        }
    };

    const sendPrivateMessage = () => {
        if (message.trim() && recipient) {
            const data = { to: recipient, message, from: username };
            socket.emit('private_message', data);
            setMessages((prevMessages) => [
                ...prevMessages,
                { username: `Private to ${recipient}`, message }
            ]);
            setMessage('');
        }
    };

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            socket.emit('user_typing', { username });
        }
    };

    const handleStopTyping = () => {
        if (isTyping) {
            setIsTyping(false);
            socket.emit('user_stopped_typing');
        }
    };

    const formatTimestamp = (timestamp) => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date)) throw new Error("Invalid Date");
            return date.toLocaleTimeString();
        } catch (error) {
            console.error("Error formatting timestamp:", error);
            return "Invalid Timestamp";
        }
    };

    return (
        <div className="main-screen">
            <h2 align="center">BUZZZ.. Room</h2>
            <div className="separation">
                <div className="chat-area">
                    <div className="chat-window">
                        {messages.map((msg, index) => (
                            <div className="message-box" key={index}>
                                <strong>{msg.username}</strong>
                                <br />
                                {msg.message}
                                <sub style={{ fontSize: '0.8em', marginLeft: '10px', color: 'white' }}>
                                    {msg.timestamp ? formatTimestamp(msg.timestamp) : ''}
                                </sub>
                            </div>
                        ))}
                        {typingUser && (
                            <div style={{ fontStyle: 'italic', fontSize: '1em', animation: 'flicker 1.5s infinite' }}>
                                {typingUser} is typing...
                            </div>
                        )}
                    </div>
                    <div className="message-field">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={handleTyping}
                            onBlur={handleStopTyping}
                            onKeyUp={handleTyping}
                        />
                        <button onClick={sendMessage}>Send</button>
                        <div>
                            <label>Select Recipient: </label>
                            <select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                                <option value="">-- Select User --</option>
                                {userList.map((user, index) => (
                                    <option key={index} value={user}>
                                        {user}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button onClick={sendPrivateMessage}>Send Private Message</button>
                    </div>
                </div>
                <div className="online-users">
                    <h2>Online users</h2>
                    <ul>
                        {userList.map((user, index) => (
                            <div key={index}>
                                <li>{user}</li>
                                <hr />
                            </div>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;
