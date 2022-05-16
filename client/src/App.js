
import './App.css';
import io from 'socket.io-client';
import {useEffect, useState, useRef} from 'react'
import Form from "./components/UsernameForm";
import Chat from "./components/Chat"
import immer from 'immer';
const socket = io.connect("http://localhost:3002");

function App() {

  const [username, setUsername] = useState("");
  const [connected, setConnected] = useState("false");
  const [currentChat, setCurrentChat] = useState({isChannel:true, chatName: "general", receivedId:""})
  const [message, setMessage] = useState("");
  const [messageReceived, setMessageReceived] = useState("");
  const [room, setRoom] = useState("");
  const sendMessage = () => {
    socket.emit("send_message", {message, room})

  }
  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
      console.log(room)
    }
  }
  //listening to event in case it happens
  //flow of project: back end will always serve as a layer, when emitting from front end, can ONLY emit to back end
  //for socketio to work, have to emit to back end, then back end listening to event, then back end will receive data and emit it to
  //another event that is being listened to in the front end
  useEffect(()=>{
    socket.on("receive_message", (data) => {
      setMessageReceived(data.message)
    })
  },[socket])
  return (
    <div className="App">
      <input onChange={(e)=>{setRoom(e.target.value)}} placeholder="Room number"/>
      <button onClick={joinRoom}>Join room</button>
      <input onChange={(e)=> setMessage(e.target.value)}placeholder="Message..."/>
      <button onClick={sendMessage}>Send a message</button>
      <h1>Message:</h1>
      {messageReceived}
    </div>
  );
}

export default App;

//create events, name them, can either listen to an eent or emit an event
//emit - send some sort of data who are listening to that specific event
// they can also send some data back 
// when we emit a message in front end, we can receive it in the back end, which can then emit another event that is received in the front end. back end is necessary as a layer to connect those events
