import { useState } from 'react'
import React from 'react';
import './App.css'
import ChatWindow from './components/ChatWindow';
function App() {
  const [isLoggedin , setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handelLogin =()=>{
    if (username.trim()){
      setIsLoggedIn(true);
    }
  };
  return(
    <div>
    
      {!isLoggedin ?(
    <div className='container'>
    <div className='user-identification'>
      <h1> Welcome to BuzzBox..

      </h1>
      <label>USERNAME : </label>
      <input type='text' placeholder='Enter your username' value={username} onChange={(e) => setUsername(e.target.value)} />
      <br></br>
      <button onClick={handelLogin} style={{margin:'10px'}}>Join chat</button>
    </div>
    </div>):(<div>
      <ChatWindow username={username}/>
      </div>)}
    </div>
  )
}

export default App
