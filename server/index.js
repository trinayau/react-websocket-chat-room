const express = require('express');
const app = express();
const http = require("http");
const {Server} = require('socket.io');
const cors = require("cors")

//use cors middleware
app.use(cors());
//make http server with Express
const server = http.createServer(app)

//socket io rooms tutorial
let users = [];

const messages = {
  general: [],
  random: [],
  jokes: [],
  javascript: []
};

//io to do anything w socket io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

//how we listen to events. connection: how it listens to server
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`)
        //joining a room- specifying a value that is id of room you are joining
    socket.on("join_room", (data)=> {
            socket.join(data)
            console.log(data)
        })
    socket.on("send_message", (data) => {
        //broadcast- sent to everyone but urself
        io.to(data.room).emit("receive_message", data)
    })

    //Socket IO Rooms tutorial
socket.on("join server", (username) => {
    const user= {
      username,
      id: socket.id,
    }
    users.push(user);
    io.emit("new user", users);
  })
  //pass callback from client side
  socket.on("join room", (roomName, cb) => {
    socket.join(roomName);
    cb(messages[roomName])
  })
  
  socket.on("disconnect", ()=>{
    users = users.filter(u => u.id !== socket.id);
    io.emit("new user", users);
  })
})

server.listen(3003, () => {
    console.log("Server is running")
})
