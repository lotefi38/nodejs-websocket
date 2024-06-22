const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const socket = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const { User, Message } = require('./models');

app.use(cors());
app.use(express.json()); // Pour traiter les données JSON

const server = http.createServer(app);
const io = socket(server, {
  cors: { origin: 'http://localhost:5173' }
});

let socketsConnected = new Set();
let users = {};

// Route pour l'enregistrement
app.post('/register', async (req, res) => {
  const { username } = req.body;
  try {
    const newUser = await User.create({ username });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route pour la connexion
app.post('/login', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, 'secretKey', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log(`New user connected : ${socket.id}`);
  socketsConnected.add(socket.id);

  io.emit('userCount', socketsConnected.size);

  socket.on('message', async (message) => {
    const newMessage = await Message.create(message);
    io.emit('message', newMessage);
  });

  socket.on('privateMessage', async (message) => {
    const recipientSocket = Object.keys(users).find(key => key === message.receiverId);
    if (recipientSocket) {
      const newMessage = await Message.create(message);
      io.to(recipientSocket).emit('privateMessage', newMessage);
      io.to(socket.id).emit('privateMessage', newMessage); // Ajouter pour que l'expéditeur voit son propre message
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

  socket.on('messageSeen', async (messageId) => {
    const message = await Message.findByPk(messageId);
    if (message) {
      message.seen = true;
      await message.save();
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
