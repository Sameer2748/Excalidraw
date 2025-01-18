import axios from "axios";
import React from "react";
import { Backend_url } from "../app/config";
import ChatRoomClient from "./ChatRoomClient";

const getRoomChats = async (roomId: number) => {
  console.log(`${Backend_url}/room/chats/${roomId}`);

  const chats = await axios.get(`${Backend_url}/room/chats/${roomId}`, {
    headers: {
      Authorization:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczNjg3NTI4N30.t-GcnywMfmFCscGPxHzx4g5cZAwgviiO7XXgPZHZL9U",
    },
  });

  return chats.data.chats;
};
const ChatRoom = async ({ id }: { id: any }) => {
  console.log(id);

  const chats = await getRoomChats(id);
  console.log(chats);
  return <ChatRoomClient chats={chats} roomId={id} />;
};

export default ChatRoom;
