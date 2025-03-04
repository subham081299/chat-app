import React from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { db } from "../../config/firebase";
import {
  arrayUnion,
  
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";


const ChatBox = () => {
  const { userData, messagesId, chatUser, messages, setMessages,chatVisible,setChatVisible } =
    useContext(AppContext);

  const [input, setInput] = useState("");
  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        // Send the message
        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date(),
          }),
        });

        // Update the lastMessage field for both users
        const userIDs = [chatUser.rId, userData.id];
        await Promise.all(
          userIDs.map(async (id) => {
            const userChatsRef = doc(db, "chats", id);
            const userChatsSnapshot = await getDoc(userChatsRef);
            if (userChatsSnapshot.exists()) {
              const userChatData = userChatsSnapshot.data();
              const chatIndex = userChatData.chatData.findIndex(
                (c) => c.messageId === messagesId
              );

              // Ensure the chat index exists before updating
              if (chatIndex !== -1) {
                userChatData.chatData[chatIndex].lastMessage = input.slice(
                  0,
                  30
                );
                userChatData.chatData[chatIndex].updatedAt = Date.now();
                if (userChatData.chatData[chatIndex].rId === userData.id) {
                  userChatData.chatData[chatIndex].messageSeen = false;
                }
                await updateDoc(userChatsRef, {
                  chatData: userChatData.chatData,
                });
              } else {
                console.error("Chat index not found for user:", id);
              }
            } else {
              console.error("User chats document not found for user:", id);
            }
          })
        );
      }
    } catch (error) {
      console.log(error.message);
      console.error("Error sending message:", error);
    }
    setInput("");
  };

  const handleClick = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const convertTimestamp = (timestamp) => {
    let date = timestamp.toDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (hours > 12) {
      hours = hours - 12 + ":" + minutes + " PM";
    } else {
      hours = hours + ":" + minutes + " AM";
    }
    return hours;
  };

  useEffect(() => {
    if (messagesId) {
      const unsub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data().messages.reverse());
      });
      return () => unsub();
    }
  }, [messagesId]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible?"":"hidden"}`}>
      <div className="chat-user">
        <img src={assets.avatar_icon} alt="" />
        <p>
          {chatUser.userData.name}
          {Date.now() - chatUser.userData.lastSeen <= 70000 ? (
            <img className="dot" src={assets.green_dot} alt="" />
          ) : null}
        </p>
        <img src={assets.help_icon} className="help" alt="" />
        <img onClick={()=>setChatVisible(false)} src={assets.arrow_icon} className="arrow" alt="" />
      </div>

      <div className="chat-msg">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.sId === userData.id ? "s-msg" : "r-msg"}
          >
            <p className="msg">{msg.text}</p>
            <div>
              <img
                src={
                  msg.sId === userData.id
                    ? assets.avatar_icon
                    : assets.avatar_icon
                }
                alt=""
              />
              <p>{convertTimestamp(msg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Send a message"
          onKeyDown={handleClick}
        />

        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  ) : (
    <div className={`chat-welcome ${chatVisible?"":"hidden"}`}>
      <img src={assets.logo_icon} alt="welcome-pic" />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
