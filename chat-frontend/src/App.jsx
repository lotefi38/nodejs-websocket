import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faUser } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  const [name, setName] = useState('anonymous');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    socket.emit('setUsername', name);

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('privateMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('userCount', (userTotal) => {
      setUserCount(userTotal);
    });

    socket.on('updateUserList', (usersList) => {
      setUsers(usersList); 
    });

    socket.on('typing', (user) => {
      setFeedback(`${user.name} is typing...`);
    });

    socket.on('stopTyping', () => {
      setFeedback('');
    });

    socket.on('messageSeen', ({ messageId, receiverId }) => {
      if (receiverId === socket.id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, seen: true } : msg
          )
        );
      }
    });

    return () => {
      socket.off('message');
      socket.off('privateMessage');
      socket.off('userCount');
      socket.off('setUsername');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('messageSeen');
    };
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
    socket.emit('setUsername', e.target.value);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { name });
  };

  const handleMessageSend = (e) => {
    e.preventDefault();
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9), // Generate a unique ID for the message
      text: message,
      author: name,
      date: new Date().toLocaleString(),
      senderId: socket.id,
      receiverId: selectedUser,
      seen: false,
    };
    socket.emit(selectedUser ? 'privateMessage' : 'message', newMessage);
    setMessage('');
    socket.emit('stopTyping');
  };

  const selectUser = (userId) => {
    setSelectedUser(userId);
  };

  useEffect(() => {
    if (selectedUser) {
      messages.forEach((msg) => {
        if (msg.senderId === selectedUser && !msg.seen) {
          socket.emit('messageSeen', msg.id);
        }
      });
    }
  }, [selectedUser, messages]);

  return (
    <>
      <h1 className='title'>iChat</h1>
      <div className="mainChat">
        <div className="flex">
          <div className="userList">
            <h3>Users : {userCount}</h3>
            <ul>
              <li onClick={() => selectUser(null)} className={selectedUser === null ? 'selected' : ''}>All</li>
              {Object.keys(users).map((user, index) => (
                <li key={index} onClick={() => selectUser(user)} className={selectedUser === user ? 'selected' : ''}>
                  {users[user].name} {users[user].online ? '(en ligne)' : '(hors ligne)'}
                </li>
              ))}
            </ul>
          </div>
          <div className="chat">
            <div className="name">
              <span className="nameForm">
                <FontAwesomeIcon icon={faUser} />
                <input
                  type="text"
                  className="nameInput"
                  id="nameInput"
                  value={name}
                  onChange={handleNameChange}
                  maxLength="20"
                />
              </span>
            </div>
            <ul className="conversation">
              {messages.filter(msg => !selectedUser || msg.receiverId === selectedUser || msg.senderId === selectedUser).map((msg, index) => (
                <li key={index} className={msg.senderId === socket.id ? 'messageRight' : 'messageLeft'}>
                  <p className="message">{msg.text}</p>
                  <span>{msg.author} - {msg.date} {msg.seen && ' (vu)'}</span>
                </li>
              ))}
              {feedback && (
                <li className="messageFeedback">
                  <p className="feedback">{feedback}</p>
                </li>
              )}
            </ul>
            <form className="messageForm" onSubmit={handleMessageSend}>
              <input
                type="text"
                name="message"
                className='messageInput'
                value={message}
                onKeyUp={() => {
                  if (!message) {
                    socket.emit('stopTyping');
                  }
                }}
                onChange={handleMessageChange}
              />
              <div className="vDivider"></div>
              <button type="submit" className='sendButton'>Send <FontAwesomeIcon icon={faPaperPlane} /></button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
