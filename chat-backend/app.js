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

io.on('connection', (socket) => {
  console.log(`New user connected : ${socket.id}`);
  socketsConnected.add(socket.id);

  io.emit('userCount', socketsConnected.size);

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  socket.on('privateMessage', (message) => {
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
    users[socket.id] = username;
    io.emit('updateUserList', users);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected : ${socket.id}`);
    socketsConnected.delete(socket.id);
    delete users[socket.id];
    io.emit('updateUserList', users);
    io.emit('userCount', socketsConnected.size);
  });

});

app.get('/', (req, res) => {
  res.send('Hello, welcome to my server');
});

server.listen(port, () => {
  console.log(`Server online on port http://localhost:${port}`);
});
