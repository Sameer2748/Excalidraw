"use client";
import React, { useEffect, useState } from "react";
import { WS_URL } from "../app/config";
import { Canvas } from "./Canvas";
import { WebSocketService } from "../hooks/WebSocketService";

export function RoomCanvas({ RoomId }: { RoomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const wsService = WebSocketService.getInstance();

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        const ws = await wsService.connect(
          `${WS_URL}?token=${localStorage.getItem("token")}`
        );
        setSocket(ws);

        wsService.send({
          type: "room-join",
          roomId: RoomId,
        });

        return () => {
          wsService.close();
        };
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    };

    connectWebSocket();
  }, [RoomId, wsService]);

  if (!socket) {
    return <h1>Connecting to the server...</h1>;
  }

  return <Canvas RoomId={RoomId} socket={wsService} />;
}
