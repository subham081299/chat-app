import React, { useState, useEffect, useContext } from "react";
import "./LeftSideBar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AppContext } from "../../context/AppContext";

const LeftSideBar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [authUid, setAuthUid] = useState("");
  const { userData, chatData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUid(user.uid);
        console.log("Authenticated user:", user.uid);
      } else {
        console.log("No authenticated user found.");
      }
    });
  }, []);

  const inputHandler = async (e) => {
    try {
      const input = e.target.value;
      setSearchTerm(input);

      if (input.trim() !== "") {
        setShowSearch(true);
        const useRef = collection(db, "users");
        const q = query(useRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          querySnap.forEach((doc) => {
            const foundUser = doc.data();
            if (foundUser.id !== userData.id) {
              let userExist = false;
              if (chatData) {
                chatData.forEach((user) => {
                  if (user.rId === querySnap.docs[0].data().id) {
                    userExist = true;
                  }
                });
              }
              if (!userExist) {
                setUser(querySnap.docs[0].data());
              }
            } else {
              console.log("Searched user is the authenticated user.");
            }
          });
        } else {
          console.log("No user found");
        }
      } else {
        setShowSearch(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error searching user:", error);
    }
  };

  const addChat = async () => {
    const messageRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");

    try {
      // Create a new message document
      const newMessageRef = doc(messageRef);
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Check if chat document exists for the user
      const chatDoc = await getDoc(doc(chatsRef, user.id));
      if (!chatDoc.exists()) {
        await setDoc(doc(chatsRef, user.id), {
          chatData: [],
        });
      }

      // Update chat document for the user
      await updateDoc(doc(chatsRef, user.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      // Check if chat document exists for the authenticated user
      const userChatDoc = await getDoc(doc(chatsRef, userData.id));
      if (!userChatDoc.exists()) {
        await setDoc(doc(chatsRef, userData.id), {
          chatData: [],
        });
      }

      // Update chat document for the authenticated user
      await updateDoc(doc(chatsRef, userData.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      const uSnap = await getDoc(doc(db, "users", user.id));
      const uData = uSnap.data();
      setChatUser({
        messageId: newMessageRef.id, // Ensure this is correctly set
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageSeen: true,
        userData: uData,
      });
      setMessagesId(newMessageRef.id);
      setSearchTerm(""); // Clear the search field
      setUser(null); // Clear the user state
      setShowSearch(false); // Hide search results
      setChatVisible(true);

      console.log("Chat successfully added");
    } catch (error) {
      console.error("Error adding chat:", error);
    }
  };

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);

      const userChatsRef = doc(db, 'chats', userData.id);
      const userChatsSnapshotRef = await getDoc(userChatsRef);
      const userChatsData = userChatsSnapshotRef.data();

      const chatIndex = userChatsData.chatData.findIndex((c) => c.messageId === item.messageId);
      userChatsData.chatData[chatIndex].messageSeen = true;
      await updateDoc(userChatsRef, { chatData: userChatsData.chatData });
      setChatVisible(true);
    } catch (error) {
      console.log(error.message);
    }
  };

  const uniqueChatData = [];
  if (chatData) {
    const userSet = new Set();

    chatData.forEach((item) => {
      if (!userSet.has(item.userData.id)) {
        userSet.add(item.userData.id);
        uniqueChatData.push(item);
      }
    });
  }

  useEffect(() => {
    const updateChatUserData = async () => {
      if (chatUser) {
        const userRef = doc(db, "users", chatUser.userData.id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        setChatUser((prev) => ({ ...prev, userData: userData }));
      }
    };
    updateChatUserData();
  }, [chatData, chatUser]);

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} alt="" className="logo" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" className="menu-icon" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input
            onChange={inputHandler}
            type="text"
            placeholder="Search here..."
            value={searchTerm}
          />
        </div>
      </div>
      <div className="ls-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img src={assets.avatar_icon} alt="" />
            <p>{user.name}</p>
          </div>
        ) : (
          uniqueChatData.map((item, index) => (
            <div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
              <img src={assets.avatar_icon} alt="" />
              <div>
                <p>{item.userData.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
