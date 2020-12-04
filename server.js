const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 3000;

//Set static folder
app.use(express.static(path.join(__dirname,'public')))

const botName = "Chatroom Bot"
//Run when client connects
io.on('connection', socket => {
  // socket.emit for only client
  // socket.broadcast.emit for every client but self
  // io.emit for everyone

  socket.on('joinRoom', ({username,room})  =>{
    const user = userJoin(socket.id,username,room);
    socket.join(user.room);

    //Welcome Message
    socket.emit('message', formatMessage(botName,'Welcome to Chatroom!'));

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName,`${user.username} has joined the chat`)
      );

      //send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
  });

  //Listen for chatMessage
  socket.on('chatMessage',(msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username,msg));
  });

  //Runs when client disconnets
  socket.on('disconnect',() => {
    const user = userLeave(socket.id);
    if(user){
      io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
      io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
