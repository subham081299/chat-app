import React, { useEffect, useState } from "react";
import "./ProfileUpdate.css";
import avatar_icon from "../../assets/avatar_icon.png"; // Ensure you have this image in your assets
import logo_icon from "../../assets/logo_icon.png"; // Ensure you have this image in your assets

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { toast } from "react-toastify";

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        bio: bio,
        name: name,
        avatar: avatar_icon, // Always set the avatar_icon as the profile picture
      });
      toast.success("Profile updated successfully!");
      console.log("Profile updated successfully!");
      navigate("/chat"); // Navigate to Chat page after successful profile update
    } catch (e) {
      toast.error("Error updating profile: " + e.message);
      console.error("Error updating profile:", e);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        console.log("User authenticated:", user);
        const docRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Document data:", data);
            setName(data.name || "");
            setBio(data.bio || "");
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching document:", error);
        }
      } else {
        console.log("User is not authenticated, navigating to home page.");
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>
          <img
            src={avatar_icon}
            alt="Profile"
            style={{ width: "50px", aspectRatio: "1/1", borderRadius: "50%" }}
          />
          <input
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
            placeholder="Your name"
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
          ></textarea>
          <button type="submit">Save</button>
        </form>
        <img className="profile-pic" src={logo_icon} alt="Logo" />
      </div>
    </div>
  );
};

export default ProfileUpdate;
