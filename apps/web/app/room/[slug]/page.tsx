import axios from "axios";
import { headers } from "next/headers";
import React from "react";
import { Backend_url } from "../../config";
import ChatRoom from "../../../components/ChatRoom";

export const getRoom = async (slug: string) => {
  try {
    console.log(`${Backend_url}/room/${slug}`);

    const room = await axios.get(`${Backend_url}/room/${slug}`, {
      headers: {
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczNjg3NTI4N30.t-GcnywMfmFCscGPxHzx4g5cZAwgviiO7XXgPZHZL9U",
      },
    });

    return room.data.room.id;
  } catch (error) {
    console.log("error in getting the room");
  }
};

const page = async ({ params }: { params: { slug: string } }) => {
  const slug = await params;
  const roomID = slug.slug;

  const room = await getRoom(roomID);
  console.log(room);

  // return <div>helo room {roomID}</div>;
  return <ChatRoom id={parseInt(room)} />;
};

export default page;
