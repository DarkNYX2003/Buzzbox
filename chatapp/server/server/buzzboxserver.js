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

const connectedUsers = {};
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Broadcast the received chat message to all clients with a timestamp
    socket.on('chat_message', (data) => {
        const timestamp = new Date().toISOString(); // Generate ISO timestamp
        const messageWithTimestamp = {
            ...data,
            timestamp, // Attach the timestamp to the message
        };
        console.log('Message received from client:', messageWithTimestamp);
        io.emit('chat_message', messageWithTimestamp); // Broadcast message
    });

    // Notify when a user connects
    socket.on('user_connected', (username) => {
        connectedUsers[socket.id] = username;
        console.log(`${username} connected`);
        io.emit('update_user_list',Object.values(connectedUsers));
    });

    // Handle "user is typing" events
    socket.on('user_typing', (data) => {
        console.log(`${data.username} is typing...`);
        socket.broadcast.emit('user_typing', data); // Notify other clients
    });

    // Handle "user stopped typing" events
    socket.on('user_stopped_typing', () => {
        console.log('A user stopped typing');
        socket.broadcast.emit('user_stopped_typing'); // Notify other clients
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        delete connectedUsers[socket.id];
        io.emit('update_user_list',Object.values(connectedUsers));
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
