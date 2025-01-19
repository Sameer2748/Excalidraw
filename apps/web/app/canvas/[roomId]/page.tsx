import React from "react";

import { RoomCanvas } from "../../../components/RoomCanvas";

const page = ({ params }: { params: { roomId: string } }) => {
  const roomId = params.roomId;

  return <RoomCanvas RoomId={roomId} />;
};

export default page;
