"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

const ChatRoomClient = ({
  chats,
  roomId,
}: {
  chats: {
    userId: number;
    roomId: number;
    message: string;
    createdAt: string;
  }[];
  roomId: number;
}) => {
  const [Allchats, setChats] = useState(chats);
  const { socket, loading } = useSocket();
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (socket && !loading) {
      socket.send(
        JSON.stringify({
          type: "room-join",
          roomId: roomId,
        })
      );

      socket.onmessage = (msg) => {
        const parsedData = JSON.parse(msg.data);
        if (parsedData.type === "chat") {
          const newChat = {
            userId: parsedData.userId || 0, // Use 0 or appropriate fallback
            roomId: parsedData.roomId,
            message: parsedData.message,
            createdAt: parsedData.createdAt || new Date().toISOString(),
          };

          setChats((prevChats) => [newChat, ...prevChats]);
        }
      };
    }
  }, [socket, loading, roomId]);

  const handleSend = () => {
    if (socket && newMessage.trim()) {
      const newChat = {
        userId: 0, // Use 0 or appropriate fallback
        roomId: roomId,
        message: newMessage,
        createdAt: new Date().toISOString(),
      };

      setChats((prevChats) => [newChat, ...prevChats]);
      socket.send(
        JSON.stringify({
          type: "chat",
          message: newMessage,
          roomId: roomId,
          id: Allchats.length + 1,
        })
      );
      setNewMessage("");
    }
  };

  return (
    <div>
      {Allchats.map((chat, index) => (
        <div key={index}>{chat.message}</div>
      ))}
      <div>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoomClient;
