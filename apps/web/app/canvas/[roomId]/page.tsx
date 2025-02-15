"use client";

import { RoomCanvas } from "../../../components/RoomCanvas";

export default function Page({ params }: { params: { roomId: string } }) {
  return <RoomCanvas RoomId={params.roomId} />;
}
