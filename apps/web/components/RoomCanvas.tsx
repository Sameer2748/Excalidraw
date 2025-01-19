"use client";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { initDraw } from "../draw";
import { WS_URL } from "../app/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({ RoomId }: { RoomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>();

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_URL}?token=${localStorage.getItem("token")}`
    );

    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "room-join",
          roomId: RoomId,
        })
      );
    };

    return () => {
      ws.close();
    };
  }, []);

  if (!socket) {
    return <h1>Connecting to the server...</h1>;
  }
  return <Canvas RoomId={RoomId} socket={socket} />;
}
