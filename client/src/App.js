
import './App.css';
import io from 'socket.io-client';
import {useEffect, useState, useRef} from 'react'
import Form from "./components/UsernameForm";
import Chat from "./components/Chat"
import immer from 'immer';
// const socket = io.connect("http://localhost:3002");

const initialMessageState = {
  general: [],
  random: [],
  jokes: [],
  javascript: []
}
function App() {
  //username form
  const [username, setUsername] = useState("");
  //boolean of whether user is connected-  render form or chat
  const [connected, setConnected] = useState(false);
  //check if in chat or in channel
  const [currentChat, setCurrentChat] = useState({isChannel:true, chatName: "general", receivedId:""});
  //if trying to join room, check whether room has been joined and take away 'join room'
  const [connectedRooms, setConnectedRooms] = useState(['general']);
  //sidebar to show all users
  const [allUsers, setAllUsers] = useState([]);
  //object w messages, keeps track of messages client-side
  const [messages, setMessages] = useState(initialMessageState);
  //message box- text area
  const [message, setMessage] = useState("");
  //houses socket.io connected client
  const socketRef = useRef();

  //This function gets called as user is typing
  function handleMessageChange(e) {
    setMessage(e.target.value);
  }

  function sendMessage() {
    const payload = {
      content: message,
      //either chatName or receiverId. if not channel, need person's socketId
      to: currentChat.isChannel ? currentChat.chatName : currentChat.receivedId,
      sender: username,
      chatName: currentChat.chatName,
      isChannel: currentChat.isChannel
    };
    socketRef.current.emit("send message", payload);
//passing in messages object to immer, and cb mutate the state but state does not actually get immuted 
//immer handles the immutability
    const newMessages = immer(messages, draft => {
      draft[currentChat.chatName].push({
        sender: username,
        content: message
      });
    });
//state will update, component will render
    setMessages(newMessages);
  }

  function roomJoinCallback(incomingMessages, room) {
    //draft represents mutable messages
    const newMessages = immer(messages, draft => {
      //if someone joins chat late, they can get all prev messages
      draft[room] = incomingMessages;
    });
    setMessages(newMessages);
  }

  function joinRoom(room) {
    const newConnectedRooms = immer(connectedRooms, draft => {
      draft.push(room);
    })

    socketRef.current.emit("join room", room, (messages)=> roomJoinCallback(message, room));
    setConnectedRooms(newConnectedRooms)
  }

  //takes currentChat obj as argument, will fire when we click on new chat and it becomes actibe chat
  //makes sure messages obj has currentChat.chatName
  //usually fires when clicking on a person rather than a channel which are pre-defined and exists in state
  function toggleChat(currentChat) {
    if (!messages[currentChat.chatName]){
      //if messages doesn't have chatName
      //
      const newMessages = immer(messages, draft => {
        //creates new key in messages object, with name of new chat initialised to empty array
        draft[currentChat.chatName] = [];
      });
      //render new messages that are just created
      setMessages(newMessages);
    }
    setCurrentChat(currentChat);
  }

  //set username from form
  function handleChange(e) {
    setUsername(e.target.value);
  }

  //when messages changes, set message back to empty string
  //when typing message box and hit send, message box will change
  useEffect(()=>{
    setMessage("")
  }, [messages])

  function connect() {
    setConnected(true);
    //returns a newly connected socket client and attach to socketRef
    socketRef.current = io.connect("http://localhost:3003");
    socketRef.current.emit('join server', username);
    socketRef.current.emit('join room', 'general', (messages)=> roomJoinCallback(messages, "general"));
    socketRef.current.on('new user', allUsers=>{setAllUsers(allUsers)});
    //listens for new message event
    socketRef.current.on('new message', ({ content, sender, chatName}) => {
      //functional set state
      setMessages(messages => {
        const newMessages = immer(messages, draft => {
          //if chat name already exists in messages object, push array in at that key
          if (draft[chatName]) {
            draft[chatName].push({content, sender});
          } else {
            //if chat doesnt exist:
            draft[chatName] = [{content, sender}];
          }
        })
        //sets the state, will see messages as it re-renders
        return newMessages;
      })
    })

  }

  let body;
  if (connected) {
    body = (
      <Chat message={message}
      handleMessageChange={handleMessageChange}
      sendMessage={sendMessage}
      yourId={socketRef.current ? socketRef.current.id : ""}
      allUsers={allUsers}
      joinRoom={joinRoom}
      connectedRooms={connectedRooms}
      currentChat={currentChat}
      toggleChat={toggleChat}
      messages={messages[currentChat.chatName]}
      />
    );
  } else {
    body = (
      <Form username={username} onChange={handleChange} connect={connect}/>
    )
  }

  // const [messageReceived, setMessageReceived] = useState("");
  // const [room, setRoom] = useState("");
  // const sendMessage = () => {
  //   socket.emit("send_message", {message, room})

  // }
  // const joinRoom = () => {
  //   if (room !== "") {
  //     socket.emit("join_room", room);
  //     console.log(room)
  //   }
  // }
  //listening to event in case it happens
  //flow of project: back end will always serve as a layer, when emitting from front end, can ONLY emit to back end
  //for socketio to work, have to emit to back end, then back end listening to event, then back end will receive data and emit it to
  //another event that is being listened to in the front end
  // useEffect(()=>{
  //   socket.on("receive_message", (data) => {
  //     setMessageReceived(data.message)
  //   })
  // },[socket])
  return (
    <div className="App">
      {/* <input onChange={(e)=>{setRoom(e.target.value)}} placeholder="Room number"/>
      <button onClick={joinRoom}>Join room</button>
      <input onChange={(e)=> setMessage(e.target.value)}placeholder="Message..."/>
      <button onClick={sendMessage}>Send a message</button>
      <h1>Message:</h1>
      {messageReceived} */}
      {body}
    </div>
  );
}

export default App;

//create events, name them, can either listen to an eent or emit an event
//emit - send some sort of data who are listening to that specific event
// they can also send some data back 
// when we emit a message in front end, we can receive it in the back end, which can then emit another event that is received in the front end. back end is necessary as a layer to connect those events
