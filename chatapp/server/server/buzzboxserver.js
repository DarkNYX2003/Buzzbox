const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Maps for connected users
const connectedUsers = {}; // socket.id -> username
const usernameToSocketId = {}; // username -> socket.id

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Chat message event
    socket.on('chat_message', (data) => {
        const timestamp = new Date().toISOString();
        const messageWithTimestamp = {
            ...data,
            timestamp,
        };
        console.log('Message received from client:', messageWithTimestamp);
        io.emit('chat_message', messageWithTimestamp);
    });

    // Private messaging event
    socket.on('private_message', ({ to, message, from }) => {
        const targetSocketId = usernameToSocketId[to]; // Find recipient's socket.id
        if (targetSocketId) {
            io.to(targetSocketId).emit('private_message', { from, message });
        } else {
            console.log(`User ${to} not found or not connected.`);
        }
    });

    // User connected event
    socket.on('user_connected', (username) => {
        connectedUsers[socket.id] = username; // Map socket.id to username
        usernameToSocketId[username] = socket.id; // Map username to socket.id
        console.log(`${username} connected with ID: ${socket.id}`);
        io.emit('update_user_list', Object.values(connectedUsers)); // Send updated user list
    });

    // Typing events
    socket.on('user_typing', (data) => {
        console.log(`${data.username} is typing...`);
        socket.broadcast.emit('user_typing', data);
    });

    socket.on('user_stopped_typing', () => {
        console.log('A user stopped typing');
        socket.broadcast.emit('user_stopped_typing');
    });

    // User disconnected event
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        const username = connectedUsers[socket.id];
        if (username) {
            delete connectedUsers[socket.id]; // Remove socket.id -> username
            delete usernameToSocketId[username]; // Remove username -> socket.id
        }
        io.emit('update_user_list', Object.values(connectedUsers)); // Send updated user list
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
