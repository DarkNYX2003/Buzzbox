import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './ChatWindow.css';

function ChatWindow({ username }) {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // Tracks if the current user is typing
    const [typingUser, setTypingUser] = useState(null); // Tracks which user is typing
    const [userList, setUserList] = useState([]);

    useEffect(() => {
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);
        setConnected(true);

        // Listen for messages
        newSocket.on('chat_message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        // Listen for "user is typing" events
        newSocket.on('user_typing', (data) => {
            setTypingUser(data.username); // Update typing user
        });

        newSocket.on('update_user_list', (users) => {
            setUserList(users); // Update the user list
        });

        // Listen for "user stopped typing" events
        newSocket.on('user_stopped_typing', () => {
            setTypingUser(null); // Clear typing user
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
            socket.emit('chat_message', data); // Send message to server
            setMessage(''); // Clear input field
            setIsTyping(false); // Stop typing
            socket.emit('user_stopped_typing'); // Notify server that user stopped typing
        }
    };

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            socket.emit('user_typing', { username }); // Notify server that user is typing
        }
    };

    const handleStopTyping = () => {
        if (isTyping) {
            setIsTyping(false);
            socket.emit('user_stopped_typing'); // Notify server that user stopped typing
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
            <div className='separation'>
                <div className='chat-area'>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div className= "message-box"key={index}>
                        <strong>{msg.username}
                        <br></br>
                        </strong> {msg.message} 
                        <sub style={{ fontSize: '0.8em', marginLeft: '10px', color: 'white' }}>
                            {formatTimestamp(msg.timestamp)}
                        </sub>
                    </div>
                ))}
                {typingUser && (
                    <div style={{ fontStyle: 'italic',fontSize:'1em',animation: 'flicker 1.5s infinite' }}>
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
                {/*{connected ? (
                    <button onClick={() => socket.disconnect()}>Disconnect</button>
                ) : (
                    <button onClick={() => {
                        const newSocket = io('http://localhost:3000');
                        setSocket(newSocket);
                        setConnected(true);
                    }}>Reconnect</button>
                )}*/}
            </div>
            </div>
            <div className='online-users'>
                <h2> Online users</h2>
                <ul >
                    {userList.map((user,index)=>(<div><li key ={index}>{user}</li> <hr></hr></div>))}
                </ul>
            </div>
            </div>
        </div>
    );
}

export default ChatWindow;
