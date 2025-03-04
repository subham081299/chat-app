import React, { useContext } from "react";
import "./RightSideBar.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";

const RightSideBar = () => {
  const { chatUser, userData } = useContext(AppContext);

  const convertEpochToHumanDate = (epochTime) => {
    const date = new Date(epochTime);
    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      const options = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      return `Today at ${date.toLocaleString("en-US", options)}`;
    } else {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      return date.toLocaleString("en-US", options);
    }
  };

  return chatUser ? (
    <div className="rs">
      <div className="rs-profile">
        <img src={assets.avatar_icon} alt="User Avatar" className="rs-avatar" />
        <h3>{Date.now()-chatUser.userData.lastSeen <= 70000 ? <img src={assets.green_dot} alt="Online" className="dot" />:null}
          {chatUser.userData.name}{" "}
          
        </h3>
        <p>{chatUser.userData.bio}</p>
      </div>
      <hr />
      <div className="rs-status">
        {chatUser.userData.lastSeen ? (
          <p>
            <strong>Last Seen: </strong> {convertEpochToHumanDate(chatUser.userData.lastSeen)}
          </p>
        ) : (
          <p>
            <strong>Last Seen: </strong> Currently Online
          </p>
        )}
      </div>
      <hr />
      <button className="rs-logout-button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  ) : (
    <div className="rs">
      <div className="rs-profile">
        <img src={assets.avatar_icon} alt="User Avatar" className="rs-avatar" />
        <h5>Welcome</h5>
        <p>Select a contact to start chatting</p>
      </div>
      <hr />
     
      <button className="rs-logout-button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
};

export default RightSideBar;
