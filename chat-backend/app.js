const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const socket = require('socket.io');
const http = require('http');

app.use(cors());

const server = http.createServer(app);
const io = socket(server, {
  cors: {origin: 'http://localhost:5173'}
});

let socketsConnected = new Set();
let users = {};
let messages = [];

io.on('connection', (socket) => {
  console.log(`New user connected : ${socket.id}`);
  socketsConnected.add(socket.id);

  io.emit('userCount', socketsConnected.size);

  socket.on('message', (message) => {
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('privateMessage', (message) => {
    messages.push(message);
    const recipientSocket = Object.keys(users).find(key => key === message.receiverId);
    if (recipientSocket) {
      io.to(recipientSocket).emit('privateMessage', message);
    }
  });

  socket.on('typing', (user) => {
    socket.broadcast.emit('typing', user);
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('stopTyping');
  });

  socket.on('setUsername', (username) => {
    users[socket.id] = { name: username, online: true };
    io.emit('updateUserList', users);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected : ${socket.id}`);
    socketsConnected.delete(socket.id);
    if (users[socket.id]) {
      users[socket.id].online = false;
    }
    io.emit('updateUserList', users);
    io.emit('userCount', socketsConnected.size);
  });

  socket.on('messageSeen', (messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      message.seen = true;
      io.emit('messageSeen', { messageId, receiverId: message.receiverId });
    }
  });
});

app.get('/', (req, res) => {
  res.send('Hello, welcome to my server');
});

server.listen(port, () => {
  console.log(`Server online on port http://localhost:${port}`);
});
